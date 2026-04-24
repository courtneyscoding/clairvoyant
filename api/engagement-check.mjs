import { handleOptions, readJsonBody, setCors } from "./_shared/cors.mjs";
import { requireSupabaseUser } from "./_shared/supabase.mjs";

const buildPrompt = (messages) => `You decide whether a user seems genuinely engaged enough for a soft premium upsell to voice chat.

Rules:
- Return shouldUpsell=true only if the user sounds interested, entertained, invested, or clearly wants to continue the conversation.
- Be conservative. Return false if the conversation is ambiguous, short, frustrated, hostile, one-word replies, or too early.
- The upsell is for premium voice chat on the website.
- Return valid JSON with this exact shape:
{"shouldUpsell":false,"confidence":0.0,"reason":"short reason"}

Conversation:
${messages
  .map((message) => `${message.role === "oracle" ? "Courtney" : "User"}: ${message.text}`)
  .join("\n")}`;

const parseDecision = (rawText) => {
  try {
    const parsed = JSON.parse(rawText.trim().replace(/^```json\s*|\s*```$/g, ""));

    return {
      shouldUpsell: Boolean(parsed.shouldUpsell),
      confidence: typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
      reason: typeof parsed.reason === "string" ? parsed.reason.trim() : "",
    };
  } catch {
    return { shouldUpsell: false, confidence: 0, reason: "" };
  }
};

export default async function handler(req, res) {
  setCors(res, { allowAuthorization: true });

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await requireSupabaseUser(req);
  } catch {
    res.status(200).json({ shouldUpsell: false, confidence: 0, reason: "" });
    return;
  }

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

  if (!apiKey) {
    res.status(200).json({ shouldUpsell: false, confidence: 0, reason: "no_api_key" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (message) =>
              message &&
              (message.role === "user" || message.role === "oracle") &&
              typeof message.text === "string" &&
              message.text.trim()
          )
          .slice(-8)
      : [];

    if (messages.length < 4) {
      res.status(200).json({ shouldUpsell: false, confidence: 0, reason: "too_short" });
      return;
    }

    // Use Grok (reliable, paid credits)
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.20",          // Current flagship as of April 2026 (fast + reliable reasoning)
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: buildPrompt(messages),
          },
          {
            role: "user",
            content: "Evaluate this conversation and decide if an upsell is appropriate.",
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Grok engagement-check failed:", response.status, data);
      res.status(200).json({ shouldUpsell: false, confidence: 0, reason: "api_error" });
      return;
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const decision = parseDecision(content);

    res.status(200).json({
      shouldUpsell: decision.shouldUpsell && decision.confidence >= 0.55,
      confidence: decision.confidence,
      reason: decision.reason,
    });
  } catch (error) {
    console.error("Failed to evaluate engagement with Grok:", error);
    res.status(200).json({ shouldUpsell: false, confidence: 0, reason: "exception" });
  }
}