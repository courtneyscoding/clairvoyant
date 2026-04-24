import getMp3Duration from "get-mp3-duration";
import { handleOptions, readJsonBody, setCors } from "./_shared/cors.mjs";
import { createSupabaseAdminClient, requireSupabaseUser } from "./_shared/supabase.mjs";
import {
  buildEntitlementsFromRow,
  getSubscriptionRowForUser,
  ORACLE_PLAN_KEY,
  SEEKER_PLAN_KEY,
} from "./_shared/subscriptions.mjs";

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const VOICE_TEST_ENTITLEMENTS = {
  planKey: ORACLE_PLAN_KEY,
  planName: "Voice Test",
  status: "test",
  hasPaidPlan: true,
  isFree: false,
  canUseVoice: true,
  voiceSecondsLimit: null,
  voiceSecondsUsed: 0,
  voiceSecondsRemaining: null,
  voiceUnlimited: true,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

const trimOrUndefined = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const sendVoiceError = (res, status, code, message, entitlements) => {
  res.status(status).json({
    error: message,
    code,
    entitlements,
  });
};

const isVoiceTestRequest = (req) =>
  req.headers["x-courtney-voice-test"] === "true" &&
  process.env.NODE_ENV !== "production" &&
  process.env.VERCEL_ENV !== "production";

export default async function handler(req, res) {
  setCors(res, { allowAuthorization: true });

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = trimOrUndefined(process.env.ELEVENLABS_COURTNEY_VOICE_ID) || DEFAULT_VOICE_ID;
  const modelId = trimOrUndefined(process.env.ELEVENLABS_MODEL_ID) || DEFAULT_MODEL_ID;

  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
    return;
  }

  try {
    const voiceTestRequest = isVoiceTestRequest(req);
    let admin = null;
    let subscriptionRow = null;
    let user = null;
    let entitlements = VOICE_TEST_ENTITLEMENTS;

    if (!voiceTestRequest) {
      ({ user } = await requireSupabaseUser(req));
      admin = createSupabaseAdminClient();
      subscriptionRow = await getSubscriptionRowForUser(admin, user.id);
      entitlements = buildEntitlementsFromRow(subscriptionRow);
    }

    if (!entitlements.hasPaidPlan) {
      sendVoiceError(
        res,
        403,
        "upgrade_required",
        "Voice chat is available on Seeker and Oracle plans.",
        entitlements,
      );
      return;
    }

    if (!entitlements.canUseVoice) {
      sendVoiceError(
        res,
        403,
        "limit_reached",
        "You have used all of your included voice time for this billing period.",
        entitlements,
      );
      return;
    }

    const { text } = await readJsonBody(req);

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required", code: "invalid_text" });
      return;
    }

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
          },
        }),
      },
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text().catch(() => "");
      res.status(elevenLabsResponse.status).json({
        error: trimOrUndefined(errorText) || "ElevenLabs could not generate audio",
      });
      return;
    }

    const audioBuffer = Buffer.from(await elevenLabsResponse.arrayBuffer());

    if (!audioBuffer.length) {
      res.status(500).json({ error: "Courtney's voice came back empty" });
      return;
    }

    const durationMs = getMp3Duration(audioBuffer);
    const durationSeconds = Math.max(1, Math.ceil(durationMs / 1000));

    if (
      subscriptionRow?.plan_key === SEEKER_PLAN_KEY &&
      entitlements.voiceSecondsRemaining !== null &&
      durationSeconds > entitlements.voiceSecondsRemaining
    ) {
      sendVoiceError(
        res,
        403,
        "limit_reached",
        "You have used all of your included voice time for this billing period.",
        entitlements,
      );
      return;
    }

    const nextVoiceSecondsUsed = entitlements.voiceSecondsUsed + durationSeconds;
    const nextVoiceSecondsRemaining =
      entitlements.voiceSecondsRemaining === null
        ? null
        : Math.max(0, entitlements.voiceSecondsRemaining - durationSeconds);

    if (!voiceTestRequest) {
      const { error: usageError } = await admin
        .from("voice_usage_events")
        .insert({
          user_id: user.id,
          stripe_subscription_id: subscriptionRow?.stripe_subscription_id ?? null,
          seconds_used: durationSeconds,
          request_chars: text.trim().length,
        });

      if (usageError) {
        throw usageError;
      }

      const { error: updateError } = await admin
        .from("user_subscriptions")
        .update({
          voice_seconds_used: nextVoiceSecondsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Courtney-Voice-Seconds-Used", String(nextVoiceSecondsUsed));
    res.setHeader(
      "X-Courtney-Voice-Seconds-Remaining",
      nextVoiceSecondsRemaining === null ? "unlimited" : String(nextVoiceSecondsRemaining),
    );
    res.setHeader(
      "X-Courtney-Voice-Unlimited",
      subscriptionRow?.plan_key === ORACLE_PLAN_KEY ? "true" : "false",
    );
    res.status(200).send(audioBuffer);
  } catch (error) {
    if (error?.code === "unauthorized") {
      sendVoiceError(res, 401, "unauthorized", "Authentication is required", null);
      return;
    }

    console.error("Failed to generate Courtney speech:", error);
    res.status(500).json({
      error: "Courtney's voice is unavailable right now",
      code: "voice_unavailable",
    });
  }
}
