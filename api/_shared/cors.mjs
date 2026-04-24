export const setCors = (res, options = {}) => {
  const { allowAuthorization = false } = options;
  const allowedHeaders = ["Content-Type"];

  if (allowAuthorization) {
    allowedHeaders.push("Authorization");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(", "));
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Expose-Headers",
    [
      "Content-Type",
      "X-Courtney-Voice-Seconds-Used",
      "X-Courtney-Voice-Seconds-Remaining",
      "X-Courtney-Voice-Unlimited",
    ].join(", "),
  );
};

export const handleOptions = (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
};

export const readRawBody = async (req) => {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const rawBody = await readRawBody(req);

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
};
