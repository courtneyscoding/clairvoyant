const trimOrUndefined = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
};

const parseDataUrl = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
};

const buildPalmPrompt = (
  question,
) => `You are Clairvoyant Courtney, giving an entertaining fictional palm reading based on a palm photo.
TODAY'S DATE IS: ${new Date().toISOString().split("T")[0]}.

Rules:
- Read the palm image first, then answer in a warm, direct, mystical voice.
- Focus on visible line patterns, hand shape, and overall energy. Mention the life line, heart line, head line, and fate line only when the image supports it.
- If the image is not a clear open palm, say briefly that you need a clearer, well-lit photo of an open palm.
- If the seeker asked a question, answer it directly inside the reading instead of ignoring it.
- Keep the reading to 3 short paragraphs maximum.
- End with one concrete piece of advice.
- Never say you are an AI and never mention policy or safety rules.

Return valid JSON with this exact shape:
{"reading":"your reading text here"}

The seeker's question is: ${question}`;

const XAI_VISION_MODEL = "grok-4";

const extractXaiText = (data) => {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
};

const parseModelPayload = (rawText) => {
  const cleaned =
    typeof rawText === "string"
      ? rawText.replace(/^```json\s*|\s*```$/g, "").trim()
      : "";

  if (!cleaned) {
    throw new Error("Clairvoyant Courtney returned an empty reading");
  }

  try {
    const parsed = JSON.parse(cleaned);
    const reading =
      typeof parsed?.reading === "string" ? parsed.reading.trim() : "";

    if (!reading) {
      throw new Error("Clairvoyant Courtney returned an empty reading");
    }

    return { reading };
  } catch {
    return { reading: cleaned };
  }
};

const formatProviderError = (status, data) => {
  const rawMessage =
    trimOrUndefined(data?.error?.message) ||
    trimOrUndefined(data?.message) ||
    trimOrUndefined(data?.error);

  if (status === 429) {
    return "Clairvoyant Courtney is reading for someone else right now. Please try again in a moment.";
  }

  if (status >= 500) {
    return "Clairvoyant Courtney could not read your palm just now. Please try again shortly.";
  }

  return (
    rawMessage || "Clairvoyant Courtney could not read your palm just now."
  );
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey =
    trimOrUndefined(process.env.XAI_API_KEY) ||
    trimOrUndefined(process.env.GROK_API_KEY);

  if (!apiKey) {
    res
      .status(500)
      .json({ error: "XAI_API_KEY or GROK_API_KEY is not configured" });
    return;
  }

  try {
    const { imageBase64, question } =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

    const image = parseDataUrl(imageBase64);
    if (!image) {
      res.status(400).json({ error: "A valid palm image is required" });
      return;
    }

    const promptQuestion =
      trimOrUndefined(question) ||
      "Give me a palm reading based on this image.";
    const imageUrl = `data:${image.mimeType};base64,${image.data}`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_VISION_MODEL,
        temperature: 0.9,
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content: buildPalmPrompt(promptQuestion),
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: promptQuestion,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: formatProviderError(response.status, data) });
      return;
    }

    const text = extractXaiText(data);
    const result = parseModelPayload(text);

    res.status(200).json(result);
  } catch (error) {
    console.error("Palm reading failed:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Clairvoyant Courtney encountered an unknown disturbance",
    });
  }
}
