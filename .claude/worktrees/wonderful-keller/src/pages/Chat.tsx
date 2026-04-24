import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import QuestionInput from "@/components/QuestionInput";
import LoadingOracle from "@/components/LoadingOracle";
import ChatMessage from "@/components/ChatMessage";
import SiteHeader from "@/components/SiteHeader";
import { getReading } from "@/lib/readings";
import { BRAND_CHAT_TAGLINE, BRAND_NAME } from "@/lib/brand";
import { isProfileComplete, type ProfileContext } from "@/lib/profile";

interface ConversationMessage {
  id: string;
  role: "user" | "oracle";
  text: string;
  category?: string;
}

interface SavedReading {
  id: string;
  question: string;
  reading: string;
  category: string;
  created_at: string;
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const RECENT_MEMORY_MESSAGE_LIMIT = 16;

const buildTranscriptMessages = (entries: SavedReading[]) =>
  entries.flatMap<ConversationMessage>((entry) => [
    {
      id: `${entry.id}-user`,
      role: "user",
      text: entry.question,
    },
    {
      id: `${entry.id}-oracle`,
      role: "oracle",
      text: entry.reading,
      category: entry.category,
    },
  ]);

const getRecentMemory = (entries: ConversationMessage[]) =>
  entries.slice(Math.max(0, entries.length - RECENT_MEMORY_MESSAGE_LIMIT));

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [hiddenMemory, setHiddenMemory] = useState<ConversationMessage[]>([]);
  const [loadingReading, setLoadingReading] = useState(false);
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;
    setProfileLoading(true);

    supabase
      .from("profiles")
      .select("display_name, birthday, zodiac_sign, gender_identity, bio, location")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;

        const nextProfile = error ? null : ((data as ProfileContext | null) ?? null);
        if (!isProfileComplete(nextProfile)) {
          navigate("/profile?onboarding=1&returnTo=/chat", { replace: true });
          return;
        }

        const { data: transcriptRows } = await supabase
          .from("readings")
          .select("id, question, reading, category, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!active) return;

        const nonTarotTranscript = ((transcriptRows as SavedReading[] | null) ?? []).filter(
          (entry) => entry.category !== "Tarot",
        );

        setMessages([]);
        setHiddenMemory(buildTranscriptMessages(nonTarotTranscript));
        setProfile(nextProfile);
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, navigate, user]);

  const handleSubmit = useCallback(
    async (question: string) => {
      if (!user || loadingReading) return;

      setLoadingReading(true);

      const nextUserMessage: ConversationMessage = {
        id: createMessageId(),
        role: "user",
        text: question,
      };

      const rememberedMessages = [...hiddenMemory, ...messages];
      const nextMessages = [...messages, nextUserMessage];
      setMessages(nextMessages);

      try {
        const result = await getReading(
          question,
          profile || undefined,
          getRecentMemory([...hiddenMemory, ...nextMessages]).map(({ role, text }) => ({ role, text })),
          user.id,
        );

        const oracleMessage: ConversationMessage = {
          id: createMessageId(),
          role: "oracle",
          text: result.text,
          category: result.category,
        };

        setMessages((current) => [...current, oracleMessage]);
        setHiddenMemory((current) => [...current, nextUserMessage, oracleMessage]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "oracle",
            text:
              error instanceof Error
                ? error.message
                : `${BRAND_NAME} hit a snag. Try that again in a moment.`,
            category: "Disturbance",
          },
        ]);
      } finally {
        setLoadingReading(false);
      }
    },
    [loadingReading, messages, profile, user],
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [loadingReading, messages]);

  const introMessage = useMemo<ConversationMessage | null>(() => {
    if (!user || !profile) return null;

    return {
      id: "courtney-intro",
      role: "oracle",
      category: "Welcome",
      text: "Tell me what you want clarity on and I'll answer directly.",
    };
  }, [profile, user]);

  if (authLoading || profileLoading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 py-12">
        <CosmicBackground />
        <div className="relative z-[1] flex flex-col items-center gap-5 text-center">
          <OracleEye pulsing size="md" />
          <p className="font-body text-sm text-muted-foreground">
            Getting your reading room ready...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 py-8 sm:px-6">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-5xl flex-col gap-8 pt-28 pb-8">
        <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <OracleEye pulsing={loadingReading} size="lg" />
          <p className="mt-4 text-xs uppercase tracking-[0.34em] text-purple-light">
            Live Readings
          </p>
          <h1 className="mt-3 font-display text-5xl font-light text-foreground text-glow-purple sm:text-6xl">
            {BRAND_NAME}
          </h1>
          <p className="mt-4 max-w-xl font-body text-sm leading-7 text-muted-foreground sm:text-base">
            {BRAND_CHAT_TAGLINE}
          </p>
        </section>

        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[36px] border border-purple-dim bg-[rgba(10,8,18,0.6)] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-6 md:p-8">
          <div className="rounded-[28px] border border-purple-dim bg-[linear-gradient(180deg,rgba(55,42,88,0.42),rgba(18,14,30,0.75))] px-5 py-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-purple-light">
              Session
            </p>
            <p className="mt-2 font-body text-sm leading-7 text-foreground/88 sm:text-base">
              Ask about love, timing, work, patterns, or the thing you cannot stop thinking
              about. {BRAND_NAME} will answer plainly.
            </p>
          </div>

          <div className="min-h-[20rem] space-y-5 overflow-y-auto pr-1 sm:min-h-[24rem] sm:max-h-[58vh]">
            {introMessage && (
              <ChatMessage
                role={introMessage.role}
                text={introMessage.text}
                category={introMessage.category}
              />
            )}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                text={message.text}
                category={message.category}
              />
            ))}
            {loadingReading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-[28px] rounded-bl-md border border-purple-dim bg-mystic/95 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:max-w-[78%]">
                  <LoadingOracle />
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          <QuestionInput
            onSubmit={handleSubmit}
            loading={loadingReading}
            placeholder="Ask Clairvoyant Courtney anything..."
          />
        </section>
      </main>
    </div>
  );
};

export default Chat;
