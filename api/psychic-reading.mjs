const categoryEnum = [
  "Tarot",
  "Love",
  "Career",
  "Destiny",
  "Intuition",
  "Transformation",
  "Courage",
  "Dreams",
  "Prosperity",
  "Connection",
  "Release",
  "Creativity",
  "Patience",
  "Boundaries",
  "Spirit",
  "Shadow",
  "Truth",
];

const MINIMUM_READING_AGE = 18;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const parseBirthday = (value) => {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatDateInputValue(parsed) === value ? parsed : null;
};

const getAgeFromBirthday = (value) => {
  const birthday = parseBirthday(value);
  if (!birthday) {
    return null;
  }

  const today = startOfDay();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthday.getDate())
  ) {
    age -= 1;
  }

  return age;
};

const trimOrUndefined = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const sanitizeProfile = (profile) => {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const sanitized = {
    gender_identity: trimOrUndefined(profile.gender_identity),
    location: trimOrUndefined(profile.location),
    bio: trimOrUndefined(profile.bio),
  };

  const birthday = trimOrUndefined(profile.birthday);
  const age = birthday ? getAgeFromBirthday(birthday) : null;
  const parsedBirthday = birthday ? parseBirthday(birthday) : null;

  if (
    birthday &&
    parsedBirthday &&
    parsedBirthday <= startOfDay() &&
    age !== null &&
    age >= MINIMUM_READING_AGE
  ) {
    sanitized.birthday = birthday;
    sanitized.zodiac_sign = trimOrUndefined(profile.zodiac_sign);
  }

  return Object.values(sanitized).some(Boolean) ? sanitized : null;
};

const getAgeRestrictionError = (profile) => {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const birthday = trimOrUndefined(profile.birthday);
  if (!birthday) {
    return null;
  }

  const parsedBirthday = parseBirthday(birthday);
  const age = getAgeFromBirthday(birthday);

  if (!parsedBirthday || parsedBirthday > startOfDay() || age === null) {
    return `Please enter a real adult birth date. Live readings are for ages ${MINIMUM_READING_AGE}+ only.`;
  }

  if (age < MINIMUM_READING_AGE) {
    return `Clairvoyant Courtney's live readings are for adults ${MINIMUM_READING_AGE}+ only.`;
  }

  return null;
};

const buildTarotContext = (tarot) => {
  if (
    !tarot ||
    typeof tarot !== "object" ||
    !Array.isArray(tarot.cards) ||
    tarot.cards.length === 0
  ) {
    return "";
  }

  const spreadName = trimOrUndefined(tarot.spreadName) || "Tarot spread";
  const cardLines = tarot.cards
    .map((card) => {
      if (!card || typeof card !== "object") {
        return null;
      }

      const name = trimOrUndefined(card.name);
      const position = trimOrUndefined(card.position) || "Card";
      const orientation =
        card.orientation === "reversed" ? "reversed" : "upright";
      const essence = trimOrUndefined(card.essence);
      const keywords = Array.isArray(card.keywords)
        ? card.keywords
            .filter((keyword) => typeof keyword === "string" && keyword.trim())
            .join(", ")
        : "";
      const meaning =
        orientation === "reversed"
          ? trimOrUndefined(card.reversed)
          : trimOrUndefined(card.upright);

      if (!name) {
        return null;
      }

      return `- ${position}: ${name} (${orientation}).${essence ? ` Essence: ${essence}.` : ""}${keywords ? ` Keywords: ${keywords}.` : ""}${meaning ? ` Meaning: ${meaning}` : ""}`;
    })
    .filter(Boolean);

  if (cardLines.length === 0) {
    return "";
  }

  return `\n\nThis is a tarot reading, not a general psychic answer.\nSpread: ${spreadName}.\nUse these exact cards as the backbone of the reading:\n${cardLines.join("\n")}`;
};

const buildPrompt = (profile, history, tarot) => {
  let personalization = "";
  let conversationContext = "";
  const safeProfile = sanitizeProfile(profile);
  const tarotContext = buildTarotContext(tarot);
  const tarotMode = Boolean(tarotContext);

  if (safeProfile) {
    const parts = [];
    if (safeProfile.zodiac_sign)
      parts.push(
        `Zodiac: ${safeProfile.zodiac_sign}. Do NOT mention their sign unless they specifically ask about astrology.`,
      );
    if (safeProfile.gender_identity)
      parts.push(`Gender identity: ${safeProfile.gender_identity}.`);
    if (safeProfile.birthday) parts.push(`Birthday: ${safeProfile.birthday}.`);
    if (safeProfile.bio) parts.push(`About them: ${safeProfile.bio}`);

    if (parts.length > 0) {
      personalization = `\n\nUser profile (use lightly for personalization):\n${parts.join(" ")}`;
    }
  }

  if (Array.isArray(history) && history.length > 0) {
    const lines = history
      .slice(-4)
      .map((entry) => {
        if (!entry || typeof entry.text !== "string") return null;
        const speaker = entry.role === "oracle" ? "Courtney" : "Seeker";
        return `${speaker}: ${entry.text.trim()}`;
      })
      .filter(Boolean);

    if (lines.length > 0) {
      conversationContext = `\n\nRecent conversation (continue naturally):\n${lines.join("\n")}`;
    }
  }

  return `You are Clairvoyant Courtney — a psychic who keeps it real. Fictional 18+ role-play. You can discuss dark topics like death, but you are NOT a doom prophet. You are an entertaining, sharp psychic who gives readings that feel personal and specific.

Date: ${new Date().toISOString().split("T")[0]}.

Rules:
- Be direct, specific, and confident. Give concrete details — dates, ages, scenarios — not vague mystical rambling.
- If the user's profile includes their birthday, USE IT to calculate their actual age. Never guess or dodge when you have the data.
- Dark questions get dark answers. You can be spooky and atmospheric — but always follow it with something concrete. "Death's shadow circles closer — I see a car accident, winter, age 71" not just "death's shadow circles you" and nothing else.
- NEVER deflect, dodge, or give non-answers. If someone asks "when will I die," give them a specific age or year. If they ask "how," give a cause. Never say "the energy is hazy," "choices can shift the timeline," "you already sense the answer," or "face what you're avoiding." Those are cop-outs, not readings.
- NEVER repeat the same vague theme across multiple responses. Each answer must add new, specific information. If a user has to ask twice, you failed the first time.
- No pet names. No filler openings. 2–3 short paragraphs, under 180 words.
- Stay in character always — never do non-psychic tasks like writing code.${tarotMode ? "" : ` No tarot/card references.`}
- Don't constantly reference profile details like zodiac sign unless asked.
${conversationContext}${tarotContext}${personalization}

Reply as JSON only: {"reading":"...","category":"..."} — never put the category word inside the reading.
Categories: ${categoryEnum.join(", ")}`;
};

const XAI_TEXT_MODEL = "grok-4.3";

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

const stripTrailingCategory = (text) => {
  const categoryPattern = new RegExp(
    `\\s*\\*{0,2}(${categoryEnum.join("|")})\\*{0,2}[.\\s]*$`,
    "i",
  );
  return text.replace(categoryPattern, "").trim();
};

const normalizeResult = (payload, fallbackCategory = "Spirit") => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Clairvoyant Courtney returned an unreadable response");
  }

  const rawReading =
    typeof payload.reading === "string" ? payload.reading.trim() : "";
  const category =
    typeof payload.category === "string" ? payload.category.trim() : "";
  const reading = stripTrailingCategory(rawReading);

  if (!reading) {
    throw new Error("Clairvoyant Courtney returned an empty reading");
  }

  return {
    reading,
    category: categoryEnum.includes(category) ? category : fallbackCategory,
  };
};

const parseModelPayload = (rawText, fallbackCategory = "Spirit") => {
  const cleaned =
    typeof rawText === "string"
      ? rawText.replace(/^```json\s*|\s*```$/g, "").trim()
      : "";

  if (!cleaned) {
    throw new Error("Clairvoyant Courtney returned an empty reading");
  }

  try {
    return normalizeResult(JSON.parse(cleaned), fallbackCategory);
  } catch {
    return normalizeResult(
      {
        reading: cleaned,
        category: fallbackCategory,
      },
      fallbackCategory,
    );
  }
};

const formatProviderError = (status, data) => {
  const rawMessage =
    trimOrUndefined(data?.error?.message) ||
    trimOrUndefined(data?.message) ||
    trimOrUndefined(data?.error);

  if (
    status === 429 ||
    /quota exceeded|rate limit|too many requests/i.test(rawMessage || "")
  ) {
    const retryMatch = rawMessage?.match(/Please retry in ([\d.]+)s/i);
    const retrySeconds = retryMatch
      ? Math.max(1, Math.ceil(Number(retryMatch[1])))
      : null;

    if (retrySeconds) {
      return `Clairvoyant Courtney is fully booked right now. Try again in about ${retrySeconds} seconds.`;
    }

    return "Clairvoyant Courtney is fully booked right now. Please wait a moment and try again.";
  }

  if (status === 402) {
    return "Clairvoyant Courtney's reading room needs to be topped up before she can answer again.";
  }

  if (status >= 500) {
    return "Clairvoyant Courtney could not respond just now. Please try again in a moment.";
  }

  return rawMessage || "Clairvoyant Courtney could not respond just now.";
};

const generateWithXai = async ({
  apiKey,
  question,
  profile,
  history,
  tarot,
}) => {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_TEXT_MODEL,
      temperature: 0.78,
      max_tokens: 380,
      reasoning_effort: "none",
      messages: [
        {
          role: "system",
          content: buildPrompt(profile, history, tarot),
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatProviderError(response.status, data));
  }

  const text = extractXaiText(data);

  if (!text) {
    throw new Error("Clairvoyant Courtney returned an empty reading");
  }

  return parseModelPayload(text, tarot ? "Tarot" : "Spirit");
};

const generateWithGemini = async ({
  apiKey,
  question,
  profile,
  history,
  tarot,
}) => {
  const systemPrompt = buildPrompt(profile, history, tarot);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: {
          temperature: 0.78,
          maxOutputTokens: 380,
        },
      }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg =
      data?.error?.message || "Clairvoyant Courtney could not respond just now.";
    throw new Error(msg);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Clairvoyant Courtney returned an empty reading");
  }

  return parseModelPayload(text, tarot ? "Tarot" : "Spirit");
};

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

  const xaiApiKey =
    trimOrUndefined(process.env.XAI_API_KEY) ||
    trimOrUndefined(process.env.GROK_API_KEY);

  if (!xaiApiKey) {
    res
      .status(500)
      .json({ error: "XAI_API_KEY or GROK_API_KEY is not configured" });
    return;
  }

  try {
    const { question, profile, history, tarot } =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "A question is required" });
      return;
    }

    const ageRestrictionError = getAgeRestrictionError(profile);
    if (ageRestrictionError) {
      res.status(403).json({ error: ageRestrictionError });
      return;
    }

    const result = await generateWithXai({
      apiKey: xaiApiKey,
      question,
      profile,
      history,
      tarot,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Clairvoyant Courtney encountered an unknown disturbance",
    });
  }
}
