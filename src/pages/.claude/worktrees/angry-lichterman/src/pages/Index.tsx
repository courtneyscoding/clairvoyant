import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ScrollText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import SiteHeader from "@/components/SiteHeader";
import {
  BRAND_CHAT_TAGLINE,
  BRAND_HOME_CTA,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand";
import { isProfileComplete, type ProfileContext } from "@/lib/profile";

const cardClassName =
  "rounded-[28px] border border-purple-dim bg-[linear-gradient(180deg,rgba(33,25,54,0.82),rgba(11,9,20,0.96))] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    supabase
      .from("profiles")
      .select("display_name, birthday, zodiac_sign, gender_identity, bio, location")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfile((data as ProfileContext | null) ?? null);
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const canStartReading = useMemo(() => isProfileComplete(profile), [profile]);

  const handleSpeak = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!profileLoading && !canStartReading) {
      navigate("/profile?onboarding=1&returnTo=/chat");
      return;
    }

    navigate("/chat");
  };

  const welcomeCopy = user
    ? canStartReading
      ? `Welcome back, ${profile?.display_name || "Seeker"}. ${BRAND_CHAT_TAGLINE}`
      : "Finish your profile to unlock live readings, or explore tarot and articles while you get settled."
    : BRAND_TAGLINE;

  if (authLoading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center">
        <CosmicBackground />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 py-8 sm:px-6">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-6xl flex-col gap-10 pt-28 pb-12">
        <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <OracleEye onClick={handleSpeak} size="lg" />
          <p className="mt-4 text-xs uppercase tracking-[0.34em] text-purple-light">
            Private Readings
          </p>
          <h1 className="mt-3 font-display text-5xl font-light text-foreground text-glow-purple sm:text-6xl">
            {BRAND_NAME}
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-muted-foreground sm:text-base">
            {welcomeCopy}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSpeak}
              className="rounded-full bg-primary px-6 py-3 font-body text-sm font-medium text-primary-foreground transition-all duration-300 hover:glow-purple active:scale-95"
            >
              {BRAND_HOME_CTA}
            </button>
            <button
              onClick={() => navigate("/tarot")}
              className="rounded-full border border-purple-dim bg-black/25 px-6 py-3 font-body text-sm text-foreground transition-all duration-300 hover:border-primary hover:bg-secondary/30"
            >
              Explore Tarot
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <button onClick={handleSpeak} className={cardClassName}>
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-3 text-purple-light">
              <MessageCircle size={18} />
            </div>
            <h2 className="font-display text-3xl text-foreground">{BRAND_HOME_CTA}</h2>
            <p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
              Step into a private conversation with Courtney and get a direct, personal reading.
            </p>
          </button>

          <button onClick={() => navigate("/tarot")} className={cardClassName}>
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-3 text-purple-light">
              <Sparkles size={18} />
            </div>
            <h2 className="font-display text-3xl text-foreground">Tarot Readings</h2>
            <p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
              Draw from a full deck, choose cards from the spread, and read them one by one.
            </p>
          </button>

          <button
            onClick={() => navigate("/articles")}
            className="rounded-[28px] border border-purple-dim bg-black/25 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-secondary/20"
          >
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-3 text-purple-light">
              <ScrollText size={18} />
            </div>
            <h2 className="font-display text-3xl text-foreground">Articles</h2>
            <p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
              Browse grounded spiritual writing that supports the readings side of the site.
            </p>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Index;
