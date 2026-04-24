import http from "node:http";
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPort = Number(process.env.LOCAL_API_PORT || 5173);
const vitePort = Number(process.env.LOCAL_VITE_PORT || 8080);
const viteHost = "127.0.0.1";

const getListeningProcesses = (port) => {
  try {
    return execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((columns) => columns.length >= 2)
      .map((columns) => ({
        command: columns[0],
        pid: Number(columns[1]),
      }))
      .filter((processInfo) => Number.isFinite(processInfo.pid));
  } catch {
    return [];
  }
};

const getCommandForPid = (pid) => {
  try {
    return execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
};

const stopStaleCourtneyDevProcesses = () => {
  const candidateProcesses = [
    ...getListeningProcesses(apiPort),
    ...getListeningProcesses(vitePort),
  ];
  const seenPids = new Set();

  for (const processInfo of candidateProcesses) {
    if (seenPids.has(processInfo.pid)) {
      continue;
    }

    seenPids.add(processInfo.pid);
    const command = getCommandForPid(processInfo.pid);
    const isThisProjectDevServer =
      command.includes("scripts/dev-full.mjs") ||
      (command.includes("/node_modules/vite/") &&
        command.includes(rootDir) &&
        command.includes(`--port ${vitePort}`));

    if (!isThisProjectDevServer) {
      continue;
    }

    try {
      process.kill(processInfo.pid, "SIGTERM");
      console.log(`Stopped stale Courtney dev process ${processInfo.pid}.`);
    } catch {
      // If the process disappeared between lsof and kill, there is nothing else to do.
    }
  }
};

const loadDotEnv = () => {
  const envPath = path.join(rootDir, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n|\r/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match || (process.env[match[1]] !== undefined && process.env[match[1]].trim())) {
      continue;
    }

    const rawValue = match[2].trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[match[1]] = value;
  }
};

const readRequestBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
};

const decorateResponse = (res) => {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };

  res.json = (payload) => {
    if (!res.hasHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json");
    }

    res.end(JSON.stringify(payload));
  };

  res.send = (payload) => {
    res.end(payload);
  };
};

const getApiModulePath = (requestPath) => {
  const normalizedPath = requestPath.replace(/^\/api\/?/, "");
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length === 0 || segments.some((segment) => segment.startsWith("."))) {
    return null;
  }

  return path.join(rootDir, "api", `${segments.join("/")}.mjs`);
};

const handleApiRequest = async (req, res, requestUrl) => {
  decorateResponse(res);

  const modulePath = getApiModulePath(requestUrl.pathname);

  if (!modulePath || !existsSync(modulePath)) {
    res.status(404).json({ error: "API route not found" });
    return;
  }

  const rawBody = await readRequestBody(req);
  const rawBodyText = rawBody.toString("utf8");
  const isStripeWebhook = requestUrl.pathname === "/api/stripe/webhook";

  if (rawBody.length > 0) {
    if (isStripeWebhook) {
      req.body = rawBodyText;
    } else {
      try {
        req.body = JSON.parse(rawBodyText);
      } catch {
        req.body = rawBodyText;
      }
    }
  }

  try {
    const routeModule = await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);
    await routeModule.default(req, res);
  } catch (error) {
    console.error(`Local API route failed: ${requestUrl.pathname}`, error);

    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Local API route failed",
      });
    } else {
      res.end();
    }
  }
};

const proxyToVite = (req, res) => {
  const proxyReq = http.request(
    {
      hostname: viteHost,
      port: vitePort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${vitePort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    res.statusCode = 502;
    res.end(`Vite dev server is not reachable yet: ${error.message}`);
  });

  req.pipe(proxyReq);
};

const proxyUpgradeToVite = (req, socket, head) => {
  const upstream = net.connect(vitePort, viteHost, () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${Object.entries(req.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\r\n")}\r\n\r\n`,
    );
    upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  socket.on("error", () => {
    upstream.destroy();
  });

  upstream.on("error", () => {
    socket.destroy();
  });
};

loadDotEnv();
stopStaleCourtneyDevProcesses();

const viteProcess = spawn(
  process.execPath,
  [
    path.join(rootDir, "node_modules", "vite", "bin", "vite.js"),
    "--host",
    "127.0.0.1",
    "--port",
    String(vitePort),
    "--strictPort",
  ],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_API_ORIGIN: process.env.VITE_API_ORIGIN || `http://localhost:${apiPort}`,
    },
    stdio: "inherit",
  },
);

viteProcess.on("error", (error) => {
  console.error(`Failed to start Vite: ${error.message}`);
  process.exit(1);
});

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://localhost:${apiPort}`);

  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, requestUrl);
    return;
  }

  proxyToVite(req, res);
});

server.on("upgrade", proxyUpgradeToVite);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `\nPort ${apiPort} is already in use. Another local Courtney dev server is probably still running.`,
    );
    console.error("Stop the old terminal with Ctrl+C, or run this to free the port:");
    console.error(`lsof -nP -iTCP:${apiPort} -sTCP:LISTEN`);
    console.error("Then kill the listed node PID and run npm run dev:full again.\n");
  } else {
    console.error(`Local full app failed to start: ${error.message}`);
  }

  viteProcess.kill("SIGTERM");
  process.exit(1);
});

server.listen(apiPort, () => {
  console.log(`\nLocal full app: http://localhost:${apiPort}`);
  console.log(`Vite frontend: http://localhost:${vitePort}`);
  console.log(`API routes: http://localhost:${apiPort}/api/*\n`);
});

const shutdown = () => {
  server.close();
  viteProcess.kill("SIGTERM");
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

viteProcess.on("exit", (code) => {
  server.close();

  if (code && code !== 0) {
    process.exit(code);
  }
});
