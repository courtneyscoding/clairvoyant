import { supabase } from "@/integrations/supabase/client";
import { BRAND_NAME } from "@/lib/brand";
import {
  sanitizeProfileForReading,
  type ProfileContext,
} from "@/lib/profile";
import type { DrawnTarotCard, TarotSpread } from "@/lib/tarot";

interface ConversationEntry {
  role: "user" | "oracle";
  text: string;
}

interface TarotReadingRequest {
  spread: TarotSpread;
  cards: DrawnTarotCard[];
}

interface RequestReadingOptions {
  question: string;
  profile?: ProfileContext;
  history?: ConversationEntry[];
  tarot?: TarotReadingRequest;
  saveQuestion: string;
  userId?: string;
}

async function requestReading({
  question,
  profile,
  history = [],
  tarot,
  saveQuestion,
  userId,
}: RequestReadingOptions): Promise<{ text: string; category: string }> {
  const response = await fetch("/api/psychic-reading", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      profile: sanitizeProfileForReading(profile),
      history,
      tarot: tarot
        ? {
            spreadId: tarot.spread.id,
            spreadName: tarot.spread.name,
            positions: tarot.spread.positions,
            cards: tarot.cards.map((card) => ({
              id: card.id,
              name: card.name,
              position: card.position,
              orientation: card.orientation,
              essence: card.essence,
              keywords: card.keywords,
              upright: card.upright,
              reversed: card.reversed,
            })),
          }
        : undefined,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `${BRAND_NAME} could not be reached`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (userId) {
    const { error: saveError } = await supabase.from("readings").insert({
      user_id: userId,
      question: saveQuestion,
      reading: data.reading,
      category: data.category,
    });

    if (saveError) {
      console.error("Failed to save reading", saveError);
    }
  }

  return {
    text: data.reading,
    category: data.category,
  };
}

export async function getReading(
  question: string,
  profile?: ProfileContext,
  history: ConversationEntry[] = [],
  userId?: string,
): Promise<{ text: string; category: string }> {
  return requestReading({
    question,
    profile,
    history,
    saveQuestion: question,
    userId,
  });
}

export async function getTarotReading(
  tarot: TarotReadingRequest,
  question: string,
  profile?: ProfileContext,
  userId?: string,
): Promise<{ text: string; category: string }> {
  const trimmedQuestion = question.trim();
  const effectiveQuestion =
    trimmedQuestion || `Give me a ${tarot.spread.name} tarot reading.`;

  return requestReading({
    question: effectiveQuestion,
    profile,
    tarot,
    saveQuestion: trimmedQuestion || `${tarot.spread.name} tarot reading`,
    userId,
  });
}
