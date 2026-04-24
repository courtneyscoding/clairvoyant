import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCourtneySpeech } from "@/hooks/useCourtneySpeech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSubscription } from "@/hooks/useSubscription";
import crystalBallPortrait from "@/assets/psychic-crystal-ball.png";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { authorizedApiFetch } from "@/lib/authHeaders";
import { BRAND_NAME } from "@/lib/brand";
import { getReading } from "@/lib/readings";
import { isProfileComplete, type ProfileContext } from "@/lib/profile";
import { fetchProfileContext } from "@/lib/profileStore";
import { isLocalPreview, previewUser } from "@/lib/preview";
import {
  DEFAULT_ENTITLEMENTS,
  formatSecondsAsMinutes,
  type SubscriptionEntitlements,
  type VoiceUsageSnapshot,
} from "@/lib/subscriptions";

type ConversationMessage = {
  id: string;
  role: "user" | "oracle";
  text: string;
  category?: string;
};

interface SavedReading {
  id: string;
  question: string;
  reading: string;
  category: string;
  created_at: string;
}

const RECENT_MEMORY_MESSAGE_LIMIT = 16;
const CHAT_IDLE_RESET_MS = 30 * 60 * 1000;
const CHAT_SESSION_STORAGE_PREFIX = "courtney-chat-session-v1";
const UPSELL_SESSION_KEY = "courtney-voice-upsell-seen-v1";
const UPSELL_DISMISS_UNTIL_KEY = "courtney-voice-upsell-dismiss-until-v1";
const UPSELL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type SavedChatSession = {
  userId: string;
  messages: ConversationMessage[];
  lastActiveAt: number;
};

interface MindSpeakerProps {
  voiceTestMode?: boolean;
}

const VOICE_TEST_ENTITLEMENTS: SubscriptionEntitlements = {
  ...DEFAULT_ENTITLEMENTS,
  planKey: "oracle",
  planName: "Voice Test",
  status: "test",
  hasPaidPlan: true,
  isFree: false,
  canUseVoice: true,
  voiceSecondsLimit: null,
  voiceSecondsRemaining: null,
  voiceUnlimited: true,
};

const refreshVoiceTestEntitlements = async () => VOICE_TEST_ENTITLEMENTS;
const ignoreVoiceUsage = (_usage: VoiceUsageSnapshot) => {};
const ignoreEntitlementSync = (_entitlements: SubscriptionEntitlements) => {};

const getChatSessionStorageKey = (userId: string) => `${CHAT_SESSION_STORAGE_PREFIX}:${userId}`;

const isConversationMessage = (value: unknown): value is ConversationMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ConversationMessage>;

  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "oracle") &&
    typeof candidate.text === "string" &&
    (candidate.category === undefined || typeof candidate.category === "string")
  );
};

const readSavedChatSession = (userId: string) => {
  if (typeof window === "undefined") {
    return [];
  }

  const storageKey = getChatSessionStorageKey(userId);
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedChatSession>;
    const lastActiveAt = Number(parsed.lastActiveAt);

    if (
      parsed.userId !== userId ||
      !Number.isFinite(lastActiveAt) ||
      Date.now() - lastActiveAt > CHAT_IDLE_RESET_MS ||
      !Array.isArray(parsed.messages) ||
      !parsed.messages.every(isConversationMessage)
    ) {
      window.localStorage.removeItem(storageKey);
      return [];
    }

    return parsed.messages;
  } catch (error) {
    console.error("Failed to restore Courtney chat session:", error);
    window.localStorage.removeItem(storageKey);
    return [];
  }
};

const writeSavedChatSession = (
  userId: string,
  messages: ConversationMessage[],
  lastActiveAt = Date.now(),
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getChatSessionStorageKey(userId),
    JSON.stringify({
      userId,
      messages,
      lastActiveAt,
    } satisfies SavedChatSession),
  );
};

const clearSavedChatSession = (userId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getChatSessionStorageKey(userId));
};

const buildTranscriptMessages = (entries: SavedReading[]) =>
  entries.flatMap<ConversationMessage>((entry) => [
    { id: `${entry.id}-user`, role: "user", text: entry.question },
    { id: `${entry.id}-oracle`, role: "oracle", text: entry.reading, category: entry.category },
  ]);

const getRecentMemory = (entries: ConversationMessage[]) =>
  entries.slice(Math.max(0, entries.length - RECENT_MEMORY_MESSAGE_LIMIT));

const getSessionUpsellSeen = () =>
  typeof window !== "undefined" && window.sessionStorage.getItem(UPSELL_SESSION_KEY) === "1";

const markSessionUpsellSeen = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(UPSELL_SESSION_KEY, "1");
};

const getDismissedUpsellUntil = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.localStorage.getItem(UPSELL_DISMISS_UNTIL_KEY);
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dismissUpsellForAWeek = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    UPSELL_DISMISS_UNTIL_KEY,
    String(Date.now() + UPSELL_DISMISS_MS),
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MindSpeaker = ({ voiceTestMode = false }: MindSpeakerProps) => {
  const { user: authUser, loading: rawAuthLoading } = useAuth();
  const user = voiceTestMode ? previewUser : authUser;
  const authLoading = voiceTestMode ? false : rawAuthLoading;
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [hiddenMemory, setHiddenMemory] = useState<ConversationMessage[]>([]);
  const [loadingReading, setLoadingReading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const lastSubmittedTranscriptRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const latestMessagesRef = useRef<ConversationMessage[]>([]);
  const chatStorageReadyRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const upsellCheckInFlightRef = useRef(false);
  const skipDismissRef = useRef(false);
  const hadVoiceAccessRef = useRef(false);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript,
  } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking, prime } = useCourtneySpeech({ voiceTestMode });
  const subscription = useSubscription({ disabled: voiceTestMode });
  const entitlements = voiceTestMode ? VOICE_TEST_ENTITLEMENTS : subscription.entitlements;
  const subscriptionLoading = voiceTestMode ? false : subscription.loading;
  const refreshEntitlements = voiceTestMode
    ? refreshVoiceTestEntitlements
    : subscription.refreshEntitlements;
  const applyVoiceUsage = voiceTestMode ? ignoreVoiceUsage : subscription.applyVoiceUsage;
  const syncEntitlements = voiceTestMode ? ignoreEntitlementSync : subscription.syncEntitlements;

  useEffect(() => {
    document.title = `Speak with Courtney - ${BRAND_NAME}`;
  }, []);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    chatStorageReadyRef.current = false;
    setChatStorageReady(false);

    if (voiceTestMode || isLocalPreview) {
      setProfileLoading(false);
      setProfile(null);
      setMessages([]);
      setHiddenMemory([]);
      setChatStorageReady(true);
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const loadContext = async () => {
      setProfileLoading(true);
      const { data, error } = await fetchProfileContext(user.id);

      if (!active) {
        return;
      }

      if (error) {
        console.error("Failed to load profile for mind speaker:", error);
      }

      const nextProfile = data ?? null;

      if (!isProfileComplete(nextProfile)) {
        navigate("/profile?onboarding=1&returnTo=/chat", { replace: true });
        return;
      }

      const { data: transcriptRows } = await supabase
        .from("readings")
        .select("id, question, reading, category, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!active) {
        return;
      }

      const nonTarotTranscript = ((transcriptRows as SavedReading[] | null) ?? []).filter(
        (entry) => entry.category !== "Tarot",
      );

      const restoredMessages = readSavedChatSession(user.id);

      setMessages(restoredMessages);
      latestMessagesRef.current = restoredMessages;
      chatStorageReadyRef.current = true;
      setChatStorageReady(true);
      lastActivityAtRef.current = Date.now();
      setHiddenMemory(buildTranscriptMessages(nonTarotTranscript));
      setProfile(nextProfile);
      setProfileLoading(false);
    };

    void loadContext();

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [authLoading, navigate, stopSpeaking, user, voiceTestMode]);

  useEffect(() => {
    if (!user || voiceTestMode || isLocalPreview || !chatStorageReady) {
      return;
    }

    if (messages.length === 0) {
      clearSavedChatSession(user.id);
      return;
    }

    writeSavedChatSession(user.id, messages, lastActivityAtRef.current);
  }, [chatStorageReady, messages, user, voiceTestMode]);

  useEffect(() => {
    if (!user || voiceTestMode || isLocalPreview || !chatStorageReady) {
      return;
    }

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();

      if (latestMessagesRef.current.length > 0) {
        writeSavedChatSession(user.id, latestMessagesRef.current, lastActivityAtRef.current);
      }
    };

    const resetIfIdleExpired = () => {
      const idleForMs = Date.now() - lastActivityAtRef.current;

      if (idleForMs <= CHAT_IDLE_RESET_MS) {
        markActivity();
        return;
      }

      clearSavedChatSession(user.id);
      latestMessagesRef.current = [];
      setMessages([]);
      stopSpeaking();
      stopListening();
      toast.message("Courtney started a fresh chat after 30 minutes away.");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetIfIdleExpired();
      }
    };

    window.addEventListener("focus", resetIfIdleExpired);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pointerdown", resetIfIdleExpired);
    window.addEventListener("keydown", resetIfIdleExpired);
    window.addEventListener("touchstart", resetIfIdleExpired);

    return () => {
      window.removeEventListener("focus", resetIfIdleExpired);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pointerdown", resetIfIdleExpired);
      window.removeEventListener("keydown", resetIfIdleExpired);
      window.removeEventListener("touchstart", resetIfIdleExpired);
    };
  }, [chatStorageReady, stopListening, stopSpeaking, user, voiceTestMode]);

  useEffect(() => {
    if (!entitlements.canUseVoice) {
      hadVoiceAccessRef.current = false;
      setVoiceRepliesEnabled(false);
      stopSpeaking();
      stopListening();
      return;
    }

    if (!hadVoiceAccessRef.current) {
      hadVoiceAccessRef.current = true;
      setVoiceRepliesEnabled(true);
    }
  }, [entitlements.canUseVoice, stopListening, stopSpeaking]);

  useEffect(() => {
    if (!voiceRepliesEnabled) {
      stopSpeaking();
    }
  }, [stopSpeaking, voiceRepliesEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isSpeaking, loadingReading, messages]);

  useEffect(() => {
    if (entitlements.hasPaidPlan) {
      setUpsellOpen(false);
    }
  }, [entitlements.hasPaidPlan]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("checkout") !== "success") {
      return;
    }

    let cancelled = false;

    const syncCheckout = async () => {
      let nextEntitlements = DEFAULT_ENTITLEMENTS;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        nextEntitlements = await refreshEntitlements();

        if (nextEntitlements.hasPaidPlan) {
          break;
        }

        await wait(1500);
      }

      if (cancelled) {
        return;
      }

      if (nextEntitlements.hasPaidPlan) {
        toast.success("Voice chat is unlocked for your account.");
      } else {
        toast.message("Payment was received. Voice access will unlock as soon as billing finishes syncing.");
      }

      navigate("/chat", { replace: true });
    };

    void syncCheckout();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, refreshEntitlements]);

  const openUpsell = useCallback(() => {
    markSessionUpsellSeen();
    setUpsellOpen(true);
  }, []);

  const dismissUpsell = useCallback(() => {
    dismissUpsellForAWeek();
    setUpsellOpen(false);
  }, []);

  const maybePromptUpsell = useCallback(
    async (conversation: ConversationMessage[]) => {
      if (voiceTestMode || entitlements.hasPaidPlan || upsellOpen || isLocalPreview) {
        return;
      }

      if (upsellCheckInFlightRef.current || getSessionUpsellSeen()) {
        return;
      }

      if (getDismissedUpsellUntil() > Date.now()) {
        return;
      }

      const userMessages = conversation.filter((entry) => entry.role === "user");

      if (userMessages.length < 3) {
        return;
      }

      upsellCheckInFlightRef.current = true;

      try {
        const response = await authorizedApiFetch("/api/engagement-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversation.slice(-8).map(({ role, text }) => ({
              role,
              text,
            })),
          }),
        });

        const data = await response.json().catch(() => null);

        if (data?.shouldUpsell) {
          openUpsell();
        }
      } catch (error) {
        console.error("Failed to run engagement check:", error);
      } finally {
        upsellCheckInFlightRef.current = false;
      }
    },
    [entitlements.hasPaidPlan, openUpsell, upsellOpen, voiceTestMode],
  );

  const handleVoiceResult = useCallback(
    async (result: Awaited<ReturnType<typeof speak>>) => {
      if (result.ok) {
        if (result.usage) {
          applyVoiceUsage(result.usage);
        }
        return;
      }

      if (result.entitlements) {
        syncEntitlements(result.entitlements);
      }

      if (result.code === "upgrade_required") {
        setVoiceRepliesEnabled(false);
        toast.message("Voice chat unlocks on Seeker and Oracle.");
        openUpsell();
        return;
      }

      if (result.code === "limit_reached") {
        setVoiceRepliesEnabled(false);
        toast.message(result.message);
        openUpsell();
        return;
      }

      toast.error(result.message);
    },
    [applyVoiceUsage, openUpsell, syncEntitlements],
  );

  const playCourtneyVoice = useCallback(
    async (text: string) => {
      const result = await speak(text);
      await handleVoiceResult(result);
    },
    [handleVoiceResult, speak],
  );

  const submitQuestion = useCallback(
    async (question: string) => {
      const trimmedQuestion = question.trim();

      if (!user || !trimmedQuestion || loadingReading) {
        return;
      }

      stopSpeaking();
      setLoadingReading(true);
      setInputText("");

      const userMessage: ConversationMessage = {
        id: createMessageId(),
        role: "user",
        text: trimmedQuestion,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);

      try {
        const result = await getReading(
          trimmedQuestion,
          profile || undefined,
          getRecentMemory([...hiddenMemory, ...nextMessages]).map(({ role, text }) => ({
            role,
            text,
          })),
          voiceTestMode ? undefined : user.id,
        );

        const oracleMessage: ConversationMessage = {
          id: createMessageId(),
          role: "oracle",
          text: result.text,
          category: result.category,
        };

        const conversationWithReply = [...nextMessages, oracleMessage];
        setMessages(conversationWithReply);
        setHiddenMemory((current) => [...current, userMessage, oracleMessage]);

        if (voiceRepliesEnabled && entitlements.canUseVoice) {
          void playCourtneyVoice(result.text);
        }

        void maybePromptUpsell(conversationWithReply);
      } catch (error) {
        const fallback =
          error instanceof Error ? error.message : `${BRAND_NAME} hit a snag. Try again in a moment.`;

        const oracleMessage: ConversationMessage = {
          id: createMessageId(),
          role: "oracle",
          text: fallback,
          category: "Disturbance",
        };

        setMessages([...nextMessages, oracleMessage]);
        setHiddenMemory((current) => [...current, userMessage, oracleMessage]);
      } finally {
        setLoadingReading(false);
      }
    },
    [
      entitlements.canUseVoice,
      hiddenMemory,
      loadingReading,
      messages,
      maybePromptUpsell,
      playCourtneyVoice,
      profile,
      stopSpeaking,
      user,
      voiceRepliesEnabled,
      voiceTestMode,
    ],
  );

  useEffect(() => {
    const nextTranscript = transcript.trim();

    if (isListening || !nextTranscript || nextTranscript === lastSubmittedTranscriptRef.current) {
      return;
    }

    lastSubmittedTranscriptRef.current = nextTranscript;
    void submitQuestion(nextTranscript);
    setTranscript("");
  }, [isListening, setTranscript, submitQuestion, transcript]);

  const beginListening = () => {
    if (!entitlements.canUseVoice) {
      toast.message("Voice chat unlocks on the paid plans.");
      navigate("/plans");
      return;
    }

    prime();
    stopSpeaking();
    lastSubmittedTranscriptRef.current = "";
    setTranscript("");

    try {
      startListening();
      setMicSupported(true);
    } catch (error) {
      console.error("Speech recognition is not supported:", error);
      setMicSupported(false);
    }
  };

  const handleVoiceToggle = () => {
    if (loadingReading) {
      return;
    }

    if (!entitlements.canUseVoice) {
      toast.message("Voice chat unlocks on the paid plans.");
      navigate("/plans");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    beginListening();
  };

  const handleVoiceKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleVoiceToggle();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (entitlements.canUseVoice) {
      prime();
    }

    void submitQuestion(inputText);
  };

  const introText = profile?.display_name?.trim()
    ? `${profile.display_name}, sit down and be direct with me. Ask the real question.`
    : "Sit down and be direct with me. Ask the real question.";

  const latestOracleReply = useMemo(
    () => [...messages].reverse().find((message) => message.role === "oracle") ?? null,
    [messages],
  );

  const statusText = useMemo(() => {
    if (!entitlements.canUseVoice) {
      return entitlements.hasPaidPlan ? "Voice time used up" : "Text chat open";
    }

    if (!micSupported) {
      return "Voice unavailable";
    }

    if (loadingReading) {
      return "Channeling...";
    }

    if (isListening) {
      return "Listening";
    }

    if (isSpeaking) {
      return "Speaking";
    }

    if (voiceTestMode) {
      return "Voice test ready";
    }

    if (entitlements.voiceUnlimited) {
      return "Voice ready";
    }

    return `${formatSecondsAsMinutes(entitlements.voiceSecondsRemaining ?? 0)} left`;
  }, [
    entitlements.canUseVoice,
    entitlements.hasPaidPlan,
    entitlements.voiceSecondsRemaining,
    entitlements.voiceUnlimited,
    isListening,
    isSpeaking,
    loadingReading,
    micSupported,
    voiceTestMode,
  ]);

  const voiceHintText = voiceTestMode
    ? "Voice test mode is open on this page."
    : entitlements.hasPaidPlan
    ? "You have reached your included voice time for this cycle."
    : "Voice chat unlocks on Seeker and Oracle.";

  if (authLoading || profileLoading || subscriptionLoading) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden bg-[hsl(270,70%,6%)]">
        <CosmicBackground />
        <div className="absolute inset-0 bg-[rgba(12,7,20,0.7)]" />
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-[100dvh] overflow-hidden bg-[hsl(270,72%,5%)] text-white">
        <CosmicBackground />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,11,36,0.88),rgba(14,6,24,0.94))]" />

        <div className="relative z-[1] flex min-h-[100dvh] flex-col">
          <SiteHeader />

          <header className="mt-20 border-b border-[rgba(116,69,151,0.3)] bg-[rgba(32,15,45,0.78)] px-4 py-4 backdrop-blur-md sm:mt-24 sm:px-6 sm:py-5">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#b8a5d4] transition-colors hover:text-white sm:h-11 sm:w-11"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.6} />
                  </button>
                  <img
                    src={crystalBallPortrait}
                    alt="Clairvoyant Courtney"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[rgba(136,97,212,0.5)] sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-display text-[1.3rem] font-semibold uppercase leading-none tracking-tight text-[#f1e8ff] sm:text-[1.65rem]">
                      {BRAND_NAME}
                    </div>
                    <div className="mt-1 text-[0.92rem] text-[#b8a5d4] sm:text-[1rem]">{statusText}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setVoiceRepliesEnabled((current) => !current)}
                    disabled={!entitlements.canUseVoice}
                    className={`rounded-[1.15rem] border px-3 py-2 font-body text-[0.85rem] font-medium transition-all sm:px-4 sm:text-[0.92rem] ${
                      voiceRepliesEnabled && entitlements.canUseVoice
                        ? "border-[rgba(159,87,239,0.62)] bg-[rgba(90,48,138,0.5)] text-[#f2e9ff]"
                        : "border-[rgba(116,69,151,0.42)] bg-[rgba(40,21,54,0.35)] text-[#c7b7e3]"
                    }`}
                  >
                    {entitlements.canUseVoice
                      ? voiceRepliesEnabled
                        ? "Voice replies on"
                        : "Text only"
                      : "Voice locked"}
                  </button>

                  {entitlements.canUseVoice && latestOracleReply && (
                    <button
                      type="button"
                      onClick={() => playCourtneyVoice(latestOracleReply.text)}
                      disabled={loadingReading || isSpeaking}
                      className="inline-flex items-center gap-2 rounded-[1.15rem] border border-[rgba(214,178,255,0.35)] bg-[rgba(255,255,255,0.08)] px-3 py-2 font-body text-[0.85rem] font-medium text-[#f5e9ff] transition-colors hover:bg-[rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-[0.92rem]"
                    >
                      <Volume2 className="h-5 w-5" />
                      <span>Replay</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    onKeyDown={handleVoiceKeyDown}
                    disabled={!entitlements.canUseVoice || (!micSupported && !isListening && !isSpeaking)}
                    className="inline-flex items-center gap-2 rounded-[1.15rem] border border-[rgba(159,87,239,0.62)] bg-[rgba(90,48,138,0.5)] px-3 py-2 font-body text-[0.85rem] font-medium text-[#f2e9ff] transition-all hover:bg-[rgba(108,58,164,0.58)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-[0.92rem]"
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    <span>{entitlements.canUseVoice ? (isListening ? "Stop" : "Voice") : "Voice locked"}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-[1.4rem] border border-[rgba(139,98,199,0.2)] bg-[rgba(25,10,38,0.55)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[rgba(168,115,244,0.16)] p-2 text-[#f0dcff]">
                    {entitlements.canUseVoice ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#f6eeff]">
                      {entitlements.canUseVoice
                        ? entitlements.voiceUnlimited
                          ? "Oracle voice is fully open."
                          : `${formatSecondsAsMinutes(entitlements.voiceSecondsRemaining ?? 0)} of voice time left this month.`
                        : voiceHintText}
                    </p>
                    <p className="mt-1 text-sm text-[#cdbbe5]">
                      {entitlements.canUseVoice
                        ? "Text stays available either way, and voice is ready whenever you want Courtney to answer out loud."
                        : "When the timing feels right, you can unlock the spoken version of Courtney and keep the same conversation going."}
                    </p>
                  </div>
                </div>

                {!entitlements.canUseVoice && (
                  <button
                    type="button"
                    onClick={() => navigate("/plans")}
                    className="inline-flex items-center justify-center rounded-[1rem] border border-[rgba(214,178,255,0.35)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#f5e9ff] transition-colors hover:bg-[rgba(255,255,255,0.12)]"
                  >
                    {entitlements.hasPaidPlan ? "See upgrade options" : "Unlock voice"}
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col">
            <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-7">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-[1.65rem] rounded-bl-[0.8rem] bg-[rgba(63,39,87,0.92)] px-5 py-4 text-[1rem] leading-[1.5] text-[#f1e8ff] shadow-[0_10px_26px_rgba(0,0,0,0.16)] sm:max-w-[72%] sm:px-6 sm:py-5 sm:text-[1.05rem]">
                    {introText}
                  </div>
                </div>

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] px-5 py-4 text-[1rem] leading-[1.55] shadow-[0_10px_26px_rgba(0,0,0,0.16)] sm:max-w-[72%] sm:px-6 sm:py-5 sm:text-[1.05rem] ${
                        message.role === "user"
                          ? "rounded-[1.65rem] rounded-br-[0.8rem] bg-[linear-gradient(135deg,#9f57ef,#8a44df)] text-white"
                          : "rounded-[1.65rem] rounded-bl-[0.8rem] bg-[rgba(63,39,87,0.92)] text-[#f1e8ff]"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {loadingReading && (
                  <div className="flex justify-start">
                    <div className="rounded-[1.65rem] rounded-bl-[0.8rem] bg-[rgba(63,39,87,0.92)] px-5 py-4 sm:px-6 sm:py-5">
                      <div className="flex gap-2">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#b98cff]" />
                        <span
                          className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#b98cff]"
                          style={{ animationDelay: "120ms" }}
                        />
                        <span
                          className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#b98cff]"
                          style={{ animationDelay: "240ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </section>

            <footer className="border-t border-[rgba(116,69,151,0.3)] bg-[rgba(24,11,36,0.86)] px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
              <form className="mx-auto flex w-full max-w-5xl items-center gap-3" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="Ask Clairvoyant Courtney anything..."
                  autoComplete="off"
                  disabled={loadingReading}
                  className="h-[4.5rem] flex-1 rounded-[1.45rem] border border-[rgba(116,69,151,0.42)] bg-[rgba(46,24,64,0.96)] px-5 text-[1rem] text-white outline-none placeholder:text-[#b8a5d4] focus:border-[#9f57ef] sm:h-[4.7rem] sm:px-6"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={loadingReading || !inputText.trim()}
                  className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#9f57ef,#8a44df)] text-white transition-transform active:scale-95 disabled:opacity-50 sm:h-[4.7rem] sm:w-[4.7rem]"
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
            </footer>
          </main>
        </div>
      </div>

      <Dialog
        open={upsellOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setUpsellOpen(true);
            return;
          }

          if (skipDismissRef.current) {
            skipDismissRef.current = false;
            setUpsellOpen(false);
            return;
          }

          dismissUpsell();
        }}
      >
        <DialogContent className="max-w-xl overflow-hidden border-[rgba(163,118,240,0.38)] bg-[linear-gradient(180deg,rgba(30,13,45,0.98),rgba(17,8,27,0.98))] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          
          <div className="border-b border-[rgba(163,118,240,0.18)] bg-[radial-gradient(circle_at_top,rgba(179,124,255,0.24),transparent_56%)] px-6 pb-5 pt-7">
            <DialogHeader className="space-y-4 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(216,182,255,0.22)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.22em] text-[#f4ddff]">
                <Sparkles className="h-3.5 w-3.5" />
                VOICE INVITATION
              </div>
              <DialogTitle className="font-display text-4xl leading-none text-[#fff7ff]">
                Are you enjoying texting Clairvoyant Courtney?
              </DialogTitle>
              <DialogDescription className="max-w-lg text-base leading-8 text-[#d6c4ea]">
                If so, you will love speaking to her on the phone. Keep the same reading going with her voice — it feels much more personal and direct.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6 text-sm leading-7 text-[#e8ddf5]">
            <div className="rounded-[1.4rem] border border-[rgba(152,109,219,0.22)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
              <p className="font-semibold text-[#f6edff]">What happens next</p>
              <p className="mt-2">
                Tap the button below and Courtney’s voice will open right here in the chat. It works just like a phone call — you speak, she answers out loud.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 border-t border-[rgba(163,118,240,0.18)] bg-[rgba(14,7,22,0.9)] px-6 py-5 sm:flex-row sm:justify-between sm:space-x-0">
            <button
              type="button"
              onClick={dismissUpsell}
              className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[rgba(203,180,234,0.26)] px-4 text-sm font-semibold text-[#dcc9ee] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              Maybe later
            </button>

            <Button
              type="button"
              className="h-11 rounded-[1rem] bg-[linear-gradient(135deg,#f0ccff,#9f57ef)] px-5 text-sm font-semibold text-[#240d35] hover:opacity-95"
              onClick={() => {
                skipDismissRef.current = true;
                setUpsellOpen(false);
                navigate("/plans?source=chat-upsell");
              }}
            >
              Talk to Courtney on the phone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MindSpeaker;
