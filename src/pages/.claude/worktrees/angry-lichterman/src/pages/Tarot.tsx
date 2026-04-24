import { useEffect, useMemo, useRef, useState } from "react";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import {
  getTarotArtKey,
  prepareTarotDeck,
  tarotSpreads,
  type DrawnTarotCard,
  type PreparedTarotCard,
  type TarotReading,
} from "@/lib/tarot";
import { tarotArt } from "@/lib/tarotArt";
import { RefreshCw } from "lucide-react";
import tarotReaderImage from "@/assets/tarot.jpeg";
import LoadingOracle from "@/components/LoadingOracle";
import { getTarotReading } from "@/lib/readings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileContext } from "@/lib/profile";

interface DeckCardEntry {
  deckId: string;
  card: PreparedTarotCard;
  picked: boolean;
}

interface TarotCardBackProps {
  position?: string;
  compact?: boolean;
}

interface TarotCardFaceProps {
  card: DrawnTarotCard;
}

interface ResultSpreadCardProps {
  card: DrawnTarotCard;
}

interface VisibleDeckEntry {
  actualIndex: number;
  card: DeckCardEntry;
}

const cardStageTitle: Record<string, string> = {
  single: "Pick your single-card pull",
  "three-card": "Pick your three-card spread",
  crossroads: "Pick your crossroads spread",
};

const shortPositionLabel = (position: string) =>
  position
    .replace(" influence", "")
    .replace(" current", "")
    .replace(" truth", "")
    .replace(" matter", "")
    .replace(" you", "")
    .replace(" next", "")
    .replace(" move", "")
    .trim();

const createDeckStack = (): DeckCardEntry[] =>
  prepareTarotDeck().map((card, index) => ({
    deckId: `${card.id}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    card,
    picked: false,
  }));

const TarotCardBack = ({ position, compact = false }: TarotCardBackProps) => (
  <div className="flex flex-col items-center gap-3">
    <div className={`relative ${compact ? "w-[76px] sm:w-[82px]" : "w-[122px] sm:w-[138px]"}`}>
      {!compact && <div className="absolute inset-[-10px] rounded-[20px] border border-primary/30" />}
      <div
        className={`relative aspect-[7/12] overflow-hidden rounded-[18px] border-4 border-[#d8c18d] bg-[#170f26] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.32)] ${
          compact ? "border-[3px]" : ""
        }`}
      >
        <div className="relative flex h-full items-center justify-center rounded-[12px] border border-primary/60 bg-[linear-gradient(180deg,#25153f,#160f27)]">
          <div className="absolute inset-[10px] rounded-[10px] border border-[#d8c18d]/55" />
          <div className="absolute inset-x-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-[#d8c18d]/40" />
          <div className="absolute inset-y-1/2 left-4 right-4 h-px -translate-y-1/2 bg-[#d8c18d]/25" />
          <div className={`absolute ${compact ? "top-4 h-2.5 w-2.5" : "top-6 h-3 w-3"} rounded-full border border-[#e9d7ab] bg-[#170f26]`} />
          <div className={`absolute ${compact ? "bottom-4 h-2.5 w-2.5" : "bottom-6 h-3 w-3"} rounded-full border border-[#e9d7ab] bg-[#170f26]`} />
          <div
            className={`relative flex items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(177,111,255,0.92),rgba(118,74,196,0.76)_38%,transparent_65%)] ${
              compact ? "h-14 w-14" : "h-24 w-24"
            }`}
          >
            <div className={`absolute rounded-full bg-[#f0dfb0] opacity-80 blur-md ${compact ? "h-4 w-4" : "h-7 w-7"}`} />
            <div className={`${compact ? "text-sm" : "text-xl"} text-[#f8edc7]`}>✦</div>
          </div>
        </div>
      </div>
    </div>
    {position && (
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#8f82a9]">
        {shortPositionLabel(position)}
      </p>
    )}
  </div>
);

const TarotCardFace = ({ card }: TarotCardFaceProps) => {
  const image = tarotArt[getTarotArtKey(card.id) ?? ""];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[122px] sm:w-[138px]">
        <div className="absolute inset-[-10px] rounded-[20px] border border-primary/30" />
        <div className="relative rounded-[18px] border-4 border-[#e5d0a0] bg-[#efe3c7] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
          <div className="rounded-[12px] bg-[#f7f0df] p-1">
            <div className="overflow-hidden rounded-[10px] border border-[#2b2235] bg-[#f7f0df]">
              {image ? (
                <img
                  src={image}
                  alt={card.name}
                  className={`aspect-[7/12] w-full object-cover ${card.orientation === "reversed" ? "rotate-180" : ""}`}
                />
              ) : (
                <div className="aspect-[7/12] bg-[#f7f0df]" />
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-2 bottom-7 flex justify-center">
            <div className="rounded-[12px] border border-primary/30 bg-[rgba(20,13,31,0.88)] px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm">
              <p className="font-display text-[17px] leading-none text-[#f5ead1]">{card.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#8f82a9]">
          {shortPositionLabel(card.position)}
        </p>
        {card.orientation === "reversed" && (
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-[#d3a174]">Reversed</p>
        )}
      </div>
    </div>
  );
};

const ResultSpreadCard = ({ card }: ResultSpreadCardProps) => {
  const image = tarotArt[getTarotArtKey(card.id) ?? ""];

  return (
    <div className="relative w-[84px] sm:w-[94px]">
      <div className="absolute inset-[-6px] rounded-[18px] border border-primary/25" />
      <div className="relative rounded-[16px] border-[3px] border-[#e5d0a0] bg-[#efe3c7] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.32)]">
        <div className="overflow-hidden rounded-[10px] border border-[#2b2235] bg-[#f7f0df]">
          {image ? (
            <img
              src={image}
              alt={card.name}
              className={`aspect-[7/12] w-full object-cover ${card.orientation === "reversed" ? "rotate-180" : ""}`}
            />
          ) : (
            <div className="aspect-[7/12] bg-[#f7f0df]" />
          )}
        </div>
      </div>
    </div>
  );
};

const TarotReaderPortrait = ({ cards }: { cards: DrawnTarotCard[] }) => {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6">
      <div className="relative w-full overflow-hidden rounded-[34px] border border-purple-dim bg-[linear-gradient(180deg,rgba(15,11,24,0.96),rgba(8,6,14,0.98))] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <img
          src={tarotReaderImage}
          alt="Clairvoyant Courtney giving a tarot reading"
          className="w-full rounded-[28px] object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(7,5,13,0.82))]" />
        <div className="absolute inset-x-0 bottom-5 px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#ead6ff]">
            Courtney Reading Your Spread
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 px-4">
        {cards.map((card) => (
          <ResultSpreadCard key={`${card.id}-${card.position}-result`} card={card} />
        ))}
      </div>
    </div>
  );
};

const Tarot = () => {
  const { user } = useAuth();
  const [spreadId, setSpreadId] = useState(tarotSpreads[1].id);
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [deckStack, setDeckStack] = useState<DeckCardEntry[]>(() => createDeckStack());
  const [selectedCards, setSelectedCards] = useState<DrawnTarotCard[]>([]);
  const [hoveredDeckId, setHoveredDeckId] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const deckRowRef = useRef<HTMLDivElement | null>(null);

  const activeSpread = useMemo(
    () => tarotSpreads.find((spread) => spread.id === spreadId) ?? tarotSpreads[1],
    [spreadId],
  );

  useEffect(() => {
    setDeckStack(createDeckStack());
    setSelectedCards([]);
    setReading(null);
    setHoveredDeckId(null);
    setLoadingReading(false);
  }, [spreadId]);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      return () => {
        active = false;
      };
    }

    supabase
      .from("profiles")
      .select("display_name, birthday, zodiac_sign, gender_identity, bio, location")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;

        setProfile(error ? null : ((data as ProfileContext | null) ?? null));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleReshuffle = () => {
    setDeckStack(createDeckStack());
    setSelectedCards([]);
    setReading(null);
    setHoveredDeckId(null);
    setLoadingReading(false);
  };

  const handlePickCard = async (deckId: string) => {
    if (selectedCards.length >= activeSpread.cardCount || loadingReading) return;

    const selectedDeckEntry = deckStack.find((entry) => entry.deckId === deckId);
    if (!selectedDeckEntry || selectedDeckEntry.picked) return;

    const nextSelectedCard: DrawnTarotCard = {
      ...selectedDeckEntry.card,
      position: activeSpread.positions[selectedCards.length],
    };
    const nextSelectedCards = [...selectedCards, nextSelectedCard];

    setDeckStack((current) =>
      current.map((entry) =>
        entry.deckId === deckId ? { ...entry, picked: true } : entry,
      ),
    );
    setSelectedCards(nextSelectedCards);
    setHoveredDeckId(null);

    if (nextSelectedCards.length === activeSpread.cardCount) {
      setLoadingReading(true);

      try {
        const result = await getTarotReading(
          {
            spread: activeSpread,
            cards: nextSelectedCards,
          },
          question,
          profile || undefined,
          user?.id,
        );

        setReading({
          spread: activeSpread,
          cards: nextSelectedCards,
          headline: "What your cards are saying",
          summary: result.text,
          guidance: [],
          closing: result.text.split("\n\n").slice(-1)[0] || "",
        });
      } catch (error) {
        setReading({
          spread: activeSpread,
          cards: nextSelectedCards,
          headline: "Disturbance",
          summary:
            error instanceof Error
              ? error.message
              : "Clairvoyant Courtney hit a snag. Shuffle and try again.",
          guidance: [],
          closing: "",
        });
      } finally {
        setLoadingReading(false);
      }
    }
  };

  const slots = activeSpread.positions.map((position, index) => ({
    position,
    card: selectedCards[index] ?? null,
  }));
  const availableDeck = deckStack.filter((entry) => !entry.picked);
  const visibleDeckCount = Math.min(24, availableDeck.length);
  const visibleDeck: VisibleDeckEntry[] =
    visibleDeckCount <= 1
      ? availableDeck.map((card, index) => ({ actualIndex: index, card }))
      : Array.from({ length: visibleDeckCount }, (_, index) => {
          const actualIndex = Math.floor(
            (index * (availableDeck.length - 1)) / (visibleDeckCount - 1),
          );

          return {
            actualIndex,
            card: availableDeck[actualIndex],
          };
        });
  const deckStep = 34;
  const compactCardWidth = 82;
  const deckWidth = Math.max(
    compactCardWidth,
    compactCardWidth + Math.max(0, visibleDeck.length - 1) * deckStep,
  );
  const deckMidpoint = (visibleDeck.length - 1) / 2;

  const pickedCount = selectedCards.length;
  const picksRemaining = activeSpread.cardCount - pickedCount;

  const deckIdFromClientX = (clientX: number) => {
    const row = deckRowRef.current;
    if (!row || availableDeck.length === 0) return null;

    const rect = row.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width - 1);
    const ratio = rect.width <= 1 ? 0 : relativeX / (rect.width - 1);
    const index = Math.min(
      availableDeck.length - 1,
      Math.max(0, Math.round(ratio * (availableDeck.length - 1))),
    );

    return availableDeck[index]?.deckId ?? availableDeck[availableDeck.length - 1]?.deckId ?? null;
  };

  const visibleDeckIdFromClientX = (clientX: number) => {
    const row = deckRowRef.current;
    if (!row || visibleDeck.length === 0) return null;

    const rect = row.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width - 1);
    const ratio = rect.width <= 1 ? 0 : relativeX / (rect.width - 1);
    const index = Math.min(
      visibleDeck.length - 1,
      Math.max(0, Math.round(ratio * (visibleDeck.length - 1))),
    );

    return visibleDeck[index]?.card.deckId ?? null;
  };

  const handleDeckPointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pickedCount >= activeSpread.cardCount || loadingReading) return;
    setHoveredDeckId(visibleDeckIdFromClientX(event.clientX));
  };

  const handleDeckClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (pickedCount >= activeSpread.cardCount || loadingReading) return;
    const deckId = deckIdFromClientX(event.clientX);
    if (deckId) {
      await handlePickCard(deckId);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-6 py-8">
      <CosmicBackground />
      <div className="absolute inset-0 -z-10 bg-[rgba(8,5,15,0.54)]" />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-6xl flex-col gap-10 pt-28 pb-12">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-purple-light">Tarot Readings</p>
          <h1 className="mt-4 font-display text-4xl font-light text-foreground sm:text-5xl">
            Hover the deck, then click the cards you want in your spread.
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-muted-foreground sm:text-base">
            The deck is shuffled once. The card beneath the back is hidden until you choose it.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {tarotSpreads.map((spread) => {
              const active = spread.id === spreadId;
              return (
                <button
                  key={spread.id}
                  onClick={() => setSpreadId(spread.id)}
                  className={`rounded-full border px-4 py-3 transition-all duration-300 ${
                    active
                      ? "border-primary/70 bg-[rgba(40,21,64,0.82)] text-foreground"
                      : "border-white/10 bg-black/10 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="block font-display text-xl leading-none">{spread.name}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.26em]">
                    {spread.cardCount} cards
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 w-full rounded-[24px] border border-white/10 bg-black/15 p-4 backdrop-blur-sm">
            <label className="mb-2 block text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Optional focus
            </label>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What do you want clarity on?"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleReshuffle}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-foreground transition-colors hover:border-primary/40"
              >
                <RefreshCw size={16} />
                Shuffle deck
              </button>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#a191bd]">
                {pickedCount === activeSpread.cardCount
                  ? "Spread complete"
                  : `${picksRemaining} ${picksRemaining === 1 ? "card" : "cards"} left to choose`}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-5xl flex-col items-center rounded-[32px] border border-white/10 bg-black/14 px-4 py-8 backdrop-blur-[2px] sm:px-8">
          <p className="mb-8 text-center text-[18px] uppercase tracking-[0.34em] text-[#9a8ab4]">
            {cardStageTitle[activeSpread.id]}
          </p>

          <div className="flex w-full flex-wrap items-start justify-center gap-6 sm:gap-8">
            {slots.map(({ position, card }) =>
              card ? (
                <TarotCardFace key={`${card.id}-${position}`} card={card} />
              ) : (
                <TarotCardBack key={position} position={position} />
              ),
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl rounded-[28px] border border-white/10 bg-black/12 px-4 py-6 backdrop-blur-[2px]">
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.34em] text-purple-light">The Deck</p>
            <p className="font-body text-sm text-muted-foreground">
              Move across the fan and click to pull from the shuffled deck.
            </p>
          </div>

          <div className="overflow-x-auto pb-6 pt-4">
            <div
              ref={deckRowRef}
              className={`relative mx-auto h-[172px] min-w-max ${pickedCount >= activeSpread.cardCount || loadingReading ? "cursor-default" : "cursor-pointer"}`}
              style={{ width: `${deckWidth}px` }}
              onMouseMove={handleDeckPointerMove}
              onMouseLeave={() => setHoveredDeckId(null)}
              onClick={handleDeckClick}
            >
              {visibleDeck.map(({ card, actualIndex }, index) => {
                const raised = hoveredDeckId === card.deckId;
                const offsetFromCenter = index - deckMidpoint;
                const edgeDistance = Math.abs(offsetFromCenter) / Math.max(deckMidpoint || 1, 1);

                return (
                  <div
                    key={`${card.deckId}-${actualIndex}`}
                    aria-label={`Pick card ${actualIndex + 1} from the tarot deck`}
                    className="absolute top-6 transition-all duration-200 ease-out"
                    style={{
                      left: `${index * deckStep}px`,
                      zIndex: raised ? 200 : index + 1,
                      opacity: raised ? 1 : 0.84 + (1 - edgeDistance) * 0.12,
                      transform: `translateY(${raised ? -22 : Math.abs(offsetFromCenter) * 0.6}px) rotate(${raised ? 0 : offsetFromCenter * 0.55}deg) scale(${raised ? 1.04 : 1})`,
                      transformOrigin: "bottom center",
                    }}
                  >
                    <TarotCardBack compact />
                  </div>
                );
              })}

              {availableDeck.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#a191bd]">
                    Spread complete. Shuffle to start again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {(loadingReading || reading) && (
          <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,11,23,0.94),rgba(9,7,16,0.98))] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-sm">
            <div className="flex flex-col gap-8">
              <TarotReaderPortrait cards={reading?.cards ?? selectedCards} />

              <div className="mx-auto w-full max-w-3xl text-center">
                {loadingReading ? (
                  <div className="rounded-[28px] border border-purple-dim bg-[rgba(14,10,24,0.55)] px-5 py-8">
                    <LoadingOracle />
                  </div>
                ) : reading ? (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-purple-light">Reading</p>
                    <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">{reading.headline}</h2>
                    <div className="mt-6 space-y-4 text-left">
                      {reading.summary.split("\n\n").map((paragraph) => (
                        <p
                          key={paragraph}
                          className="font-body text-base leading-8 text-foreground/90"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Tarot;
