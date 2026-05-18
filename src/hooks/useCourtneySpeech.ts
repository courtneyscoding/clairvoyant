import { useCallback, useEffect, useRef, useState } from "react";
import { authorizedApiFetch } from "@/lib/authHeaders";
import { isLocalPreview } from "@/lib/preview";
import type {
  SubscriptionEntitlements,
  VoiceApiError,
  VoiceUsageSnapshot,
} from "@/lib/subscriptions";
import { normalizeVoiceFailureMessage } from "@/lib/voice";

interface CourtneySpeechOptions {
  voiceTestMode?: boolean;
}

const cleanTextForSpeech = (text: string) =>
  text
    .replace(/[*_~`#>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[—–]/g, ", ")
    .replace(/\.{2,}/g, ".")
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

const getPreferredVoice = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  return (
    voices.find((voice) =>
      /samantha|ava|allison|karen|victoria|zira/i.test(voice.name),
    ) ||
    voices.find((voice) => /en-us/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
};

export function useCourtneySpeech({
  voiceTestMode = false,
}: CourtneySpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopBrowserSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
  }, []);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.playsInline = true;
      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  const stop = useCallback(() => {
    stopBrowserSpeech();

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.onended = null;
      audio.onerror = null;
    }

    clearObjectUrl();
    setIsSpeaking(false);
  }, [clearObjectUrl, stopBrowserSpeech]);

  const prime = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureAudio();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, [ensureAudio]);

  const speakWithBrowserVoice = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const parseVoiceUsage = useCallback(
    (response: Response): VoiceUsageSnapshot | null => {
      const voiceSecondsUsedHeader = response.headers.get(
        "X-Courtney-Voice-Seconds-Used",
      );
      const voiceSecondsRemainingHeader = response.headers.get(
        "X-Courtney-Voice-Seconds-Remaining",
      );
      const voiceUnlimitedHeader = response.headers.get(
        "X-Courtney-Voice-Unlimited",
      );

      if (!voiceSecondsUsedHeader) {
        return null;
      }

      const voiceSecondsUsed = Number(voiceSecondsUsedHeader);
      const voiceUnlimited = voiceUnlimitedHeader === "true";
      const voiceSecondsRemaining =
        voiceSecondsRemainingHeader === "unlimited" ||
        voiceSecondsRemainingHeader === null
          ? null
          : Number(voiceSecondsRemainingHeader);

      return {
        voiceSecondsUsed: Number.isFinite(voiceSecondsUsed)
          ? voiceSecondsUsed
          : 0,
        voiceSecondsRemaining:
          voiceSecondsRemaining === null ||
          Number.isFinite(voiceSecondsRemaining)
            ? voiceSecondsRemaining
            : null,
        voiceUnlimited,
      };
    },
    [],
  );

  const parseVoiceError = useCallback(async (response: Response) => {
    const data = (await response
      .json()
      .catch(() => null)) as VoiceApiError | null;

    return {
      ok: false as const,
      message: data?.error || "Courtney's voice is unavailable right now",
      code: data?.code,
      entitlements: (data?.entitlements ??
        null) as SubscriptionEntitlements | null,
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      const cleanedText = cleanTextForSpeech(text);

      if (!cleanedText) {
        return { ok: false as const, message: "Nothing to speak" };
      }

      stop();

      if (isLocalPreview) {
        const voiceId = import.meta.env.VITE_ELEVENLABS_COURTNEY_VOICE_ID || "DcMkMjzUnqektDQI5pk3";
        const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

        if (elevenLabsKey) {
          try {
            const elResponse = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
              {
                method: "POST",
                headers: {
                  Accept: "audio/mpeg",
                  "Content-Type": "application/json",
                  "xi-api-key": elevenLabsKey,
                },
                body: JSON.stringify({
                  text: cleanedText,
                  model_id: import.meta.env.VITE_ELEVENLABS_MODEL_ID || "eleven_monolingual_v1",
                  voice_settings: { stability: 0.72, similarity_boost: 0.82 },
                }),
              },
            );

            if (elResponse.ok) {
              const audioBlob = await elResponse.blob();
              const audio = ensureAudio();
              if (audio) {
                const url = URL.createObjectURL(audioBlob);
                objectUrlRef.current = url;
                audio.src = url;
                audio.onended = () => { clearObjectUrl(); setIsSpeaking(false); };
                audio.onerror = () => { clearObjectUrl(); setIsSpeaking(false); };
                setIsSpeaking(true);
                await audio.play();
                return { ok: true as const, usage: null, fallback: undefined };
              }
            }
          } catch {}
        }

        if (speakWithBrowserVoice(cleanedText)) {
          return { ok: true as const, usage: null, fallback: "browser" as const };
        }
        return { ok: false as const, message: "Browser speech not available" };
      }

      try {
        let response: Response;

        try {
          response = await authorizedApiFetch("/api/courtney-speech", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(voiceTestMode ? { "X-Courtney-Voice-Test": "true" } : {}),
            },
            body: JSON.stringify({ text: cleanedText }),
          });
        } catch (error) {
          if (speakWithBrowserVoice(cleanedText)) {
            return {
              ok: true as const,
              usage: null,
              fallback: "browser" as const,
            };
          }

          return {
            ok: false as const,
            message: normalizeVoiceFailureMessage(error),
            code: "voice_unavailable",
            entitlements: null,
          };
        }

        if (!response.ok) {
          const voiceError = await parseVoiceError(response);

          if (
            (response.status >= 500 ||
              voiceError.code === "voice_unavailable") &&
            speakWithBrowserVoice(cleanedText)
          ) {
            return {
              ok: true as const,
              usage: null,
              fallback: "browser" as const,
            };
          }

          return voiceError;
        }

        const audioBytes = await response.arrayBuffer();

        if (!audioBytes.byteLength) {
          if (speakWithBrowserVoice(cleanedText)) {
            return {
              ok: true as const,
              usage: parseVoiceUsage(response),
              fallback: "browser" as const,
            };
          }

          return {
            ok: false as const,
            message: "Courtney's voice came back empty",
          };
        }

        const audioBlob = new Blob([audioBytes], {
          type:
            response.headers.get("Content-Type")?.split(";")[0]?.trim() ||
            "audio/mpeg",
        });
        const audio = ensureAudio();

        if (!audio) {
          return {
            ok: false as const,
            message: "Audio playback is unavailable",
          };
        }

        const usage = parseVoiceUsage(response);
        const objectUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current = objectUrl;
        audio.src = objectUrl;
        audio.load();
        let browserFallbackUsed = false;

        const fallbackToBrowserVoice = () => {
          if (browserFallbackUsed) {
            return true;
          }

          clearObjectUrl();
          setIsSpeaking(false);
          browserFallbackUsed = speakWithBrowserVoice(cleanedText);
          return browserFallbackUsed;
        };

        audio.onended = () => {
          clearObjectUrl();
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          fallbackToBrowserVoice();
        };

        setIsSpeaking(true);
        try {
          await audio.play();
        } catch (error) {
          if (fallbackToBrowserVoice()) {
            return { ok: true as const, usage, fallback: "browser" as const };
          }

          return {
            ok: false as const,
            message: normalizeVoiceFailureMessage(error),
            code: "voice_unavailable",
            entitlements: null,
          };
        }

        return {
          ok: true as const,
          usage,
        };
      } catch (error) {
        console.error("Courtney speech playback failed:", error);
        clearObjectUrl();

        if (speakWithBrowserVoice(cleanedText)) {
          return {
            ok: true as const,
            usage: null,
            fallback: "browser" as const,
          };
        }

        return {
          ok: false as const,
          message: normalizeVoiceFailureMessage(error),
          code: "voice_unavailable",
          entitlements: null,
        };
      }
    },
    [
      clearObjectUrl,
      ensureAudio,
      parseVoiceError,
      parseVoiceUsage,
      speakWithBrowserVoice,
      stop,
      voiceTestMode,
    ],
  );

  useEffect(() => stop, [stop]);

  return { isSpeaking, speak, stop, prime };
}
