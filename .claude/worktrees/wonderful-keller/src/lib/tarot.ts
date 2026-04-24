export interface TarotCardData {
  id: string;
  numeral: string;
  name: string;
  glyph: string;
  essence: string;
  keywords: string[];
  upright: string;
  reversed: string;
}

export interface TarotSpread {
  id: string;
  name: string;
  cardCount: number;
  description: string;
  positions: string[];
}

export interface DrawnTarotCard extends TarotCardData {
  orientation: "upright" | "reversed";
  position: string;
}

export interface PreparedTarotCard extends TarotCardData {
  orientation: "upright" | "reversed";
}

export interface TarotReading {
  spread: TarotSpread;
  cards: DrawnTarotCard[];
  headline: string;
  summary: string;
  guidance: string[];
  closing: string;
}

export const tarotSpreads: TarotSpread[] = [
  {
    id: "single",
    name: "Single Card",
    cardCount: 1,
    description: "A clean pull for the energy circling you right now.",
    positions: ["Present current"],
  },
  {
    id: "three-card",
    name: "Past, Present, Future",
    cardCount: 3,
    description: "A classic spread for timing, context, and where the path bends next.",
    positions: ["Past influence", "Present truth", "Near future"],
  },
  {
    id: "crossroads",
    name: "Crossroads",
    cardCount: 5,
    description: "A deeper look at pressure, hidden gifts, and the choice in front of you.",
    positions: ["Heart of the matter", "What blocks you", "What helps you", "What changes next", "Best next move"],
  },
];

const majorArtKeyById: Record<string, string> = {
  fool: "m00",
  magician: "m01",
  "high-priestess": "m02",
  empress: "m03",
  emperor: "m04",
  hierophant: "m05",
  lovers: "m06",
  chariot: "m07",
  strength: "m08",
  hermit: "m09",
  "wheel-of-fortune": "m10",
  justice: "m11",
  "hanged-man": "m12",
  death: "m13",
  temperance: "m14",
  devil: "m15",
  tower: "m16",
  star: "m17",
  moon: "m18",
  sun: "m19",
  judgement: "m20",
  world: "m21",
};

const minorSuits = [
  {
    id: "cups",
    code: "c",
    glyph: "◔",
    essence: "Emotion, intimacy, intuition",
    keywords: ["Heart", "Feeling", "Intuition"],
    lens: "the emotional current",
  },
  {
    id: "pentacles",
    code: "p",
    glyph: "◈",
    essence: "Work, resources, embodiment",
    keywords: ["Material", "Body", "Stability"],
    lens: "the practical world",
  },
  {
    id: "swords",
    code: "s",
    glyph: "✦",
    essence: "Mind, truth, conflict",
    keywords: ["Mind", "Truth", "Tension"],
    lens: "the mental field",
  },
  {
    id: "wands",
    code: "w",
    glyph: "✧",
    essence: "Action, desire, momentum",
    keywords: ["Fire", "Drive", "Motion"],
    lens: "your momentum",
  },
] as const;

const minorRanks = [
  {
    id: "ace",
    numeral: "Ace",
    name: "Ace",
    code: "01",
    keywords: ["Beginning", "Spark"],
    upright: "A fresh opening is forming here.",
    reversed: "The opening exists, but it is hesitant or blocked.",
  },
  {
    id: "two",
    numeral: "II",
    name: "Two",
    code: "02",
    keywords: ["Choice", "Balance"],
    upright: "A choice or balancing act is defining the next move.",
    reversed: "Indecision or imbalance is making the situation wobble.",
  },
  {
    id: "three",
    numeral: "III",
    name: "Three",
    code: "03",
    keywords: ["Growth", "Expansion"],
    upright: "Something is developing and beginning to take shape.",
    reversed: "Growth is uneven, delayed, or pulling in different directions.",
  },
  {
    id: "four",
    numeral: "IV",
    name: "Four",
    code: "04",
    keywords: ["Stability", "Pause"],
    upright: "The energy wants grounding, structure, or rest.",
    reversed: "Stability is slipping because something essential is being ignored.",
  },
  {
    id: "five",
    numeral: "V",
    name: "Five",
    code: "05",
    keywords: ["Tension", "Shift"],
    upright: "Friction is part of the lesson here.",
    reversed: "The tension is easing, or you are finally learning how to handle it.",
  },
  {
    id: "six",
    numeral: "VI",
    name: "Six",
    code: "06",
    keywords: ["Movement", "Relief"],
    upright: "There is movement away from strain and toward clarity.",
    reversed: "You may be circling the lesson instead of truly moving through it.",
  },
  {
    id: "seven",
    numeral: "VII",
    name: "Seven",
    code: "07",
    keywords: ["Test", "Assessment"],
    upright: "This card asks for discernment and a sharper read on what is really happening.",
    reversed: "Confusion or self-protection is making the signal harder to read.",
  },
  {
    id: "eight",
    numeral: "VIII",
    name: "Eight",
    code: "08",
    keywords: ["Mastery", "Momentum"],
    upright: "The pattern strengthens through repetition, skill, or sustained effort.",
    reversed: "Progress is being slowed by scattered energy or avoidance.",
  },
  {
    id: "nine",
    numeral: "IX",
    name: "Nine",
    code: "09",
    keywords: ["Near completion", "Intensity"],
    upright: "This is close to completion, but the emotional weight is real.",
    reversed: "The pressure may be lifting, or the fear around it is louder than the facts.",
  },
  {
    id: "ten",
    numeral: "X",
    name: "Ten",
    code: "10",
    keywords: ["Completion", "Consequence"],
    upright: "A full cycle is peaking, for better or worse.",
    reversed: "The ending is incomplete, delayed, or harder to release than expected.",
  },
  {
    id: "page",
    numeral: "Page",
    name: "Page",
    code: "11",
    keywords: ["Message", "Curiosity"],
    upright: "A message, invitation, or beginner energy is entering the scene.",
    reversed: "Immaturity, hesitation, or mixed signals are coloring the message.",
  },
  {
    id: "knight",
    numeral: "Knight",
    name: "Knight",
    code: "12",
    keywords: ["Pursuit", "Action"],
    upright: "This energy moves quickly and wants to act.",
    reversed: "The drive is there, but it may be reckless, stalled, or misdirected.",
  },
  {
    id: "queen",
    numeral: "Queen",
    name: "Queen",
    code: "13",
    keywords: ["Maturity", "Command"],
    upright: "This is wise, contained, self-possessed energy.",
    reversed: "The power is present, but it may be distorted by defensiveness or imbalance.",
  },
  {
    id: "king",
    numeral: "King",
    name: "King",
    code: "14",
    keywords: ["Authority", "Mastery"],
    upright: "This card asks for leadership, steadiness, and command.",
    reversed: "Authority is compromised by rigidity, avoidance, or poor judgment.",
  },
] as const;

export const tarotDeck: TarotCardData[] = [
  {
    id: "fool",
    numeral: "0",
    name: "The Fool",
    glyph: "✦",
    essence: "Beginnings, innocence, unguarded possibility",
    keywords: ["Leap", "Trust", "Openness"],
    upright: "A new path wants courage more than certainty. Move before overthinking hardens into fear.",
    reversed: "You're hovering at the edge of a leap, but hesitation or naivety is distorting the invitation.",
  },
  {
    id: "magician",
    numeral: "I",
    name: "The Magician",
    glyph: "✶",
    essence: "Willpower, intention, channeling desire into form",
    keywords: ["Manifest", "Direct", "Focus"],
    upright: "You already have the tools. What matters now is directing your attention instead of scattering it.",
    reversed: "Power is present, but it may be leaking through self-doubt, mixed signals, or manipulation.",
  },
  {
    id: "high-priestess",
    numeral: "II",
    name: "The High Priestess",
    glyph: "☾",
    essence: "Intuition, mystery, what is felt before it is spoken",
    keywords: ["Listen", "Stillness", "Inner knowing"],
    upright: "The answer is already whispering inside you. Quiet is more useful than more information.",
    reversed: "Your own knowing is being drowned out by noise, urgency, or the need for external proof.",
  },
  {
    id: "empress",
    numeral: "III",
    name: "The Empress",
    glyph: "❀",
    essence: "Nurture, fertility, magnetism, embodied abundance",
    keywords: ["Receive", "Create", "Soften"],
    upright: "Growth comes through care, not force. Let what you want have room to ripen.",
    reversed: "You may be overgiving, undernourished, or disconnected from the body wisdom that restores you.",
  },
  {
    id: "emperor",
    numeral: "IV",
    name: "The Emperor",
    glyph: "♜",
    essence: "Structure, protection, standards, discipline",
    keywords: ["Boundaries", "Leadership", "Order"],
    upright: "Stability comes from clearer rules, better planning, and the courage to hold your line.",
    reversed: "Control issues or rigid expectations are choking the warmth out of the situation.",
  },
  {
    id: "lovers",
    numeral: "VI",
    name: "The Lovers",
    glyph: "♡",
    essence: "Union, alignment, values, sacred choice",
    keywords: ["Devotion", "Choice", "Harmony"],
    upright: "The real question is whether this choice matches your values, not just your craving.",
    reversed: "Misalignment is showing. Desire and truth may be pulling in different directions.",
  },
  {
    id: "chariot",
    numeral: "VII",
    name: "The Chariot",
    glyph: "☄",
    essence: "Momentum, determination, disciplined motion",
    keywords: ["Drive", "Victory", "Steer"],
    upright: "You can move this forward, but only if you choose a direction and keep the reins in your own hands.",
    reversed: "The energy is strong but unruly. Slow down long enough to regain control of the direction.",
  },
  {
    id: "strength",
    numeral: "VIII",
    name: "Strength",
    glyph: "∞",
    essence: "Gentle power, patience, emotional mastery",
    keywords: ["Steady", "Compassion", "Courage"],
    upright: "The soft approach wins here. Calm conviction is more powerful than force.",
    reversed: "Confidence is flickering. Stop mistaking tenderness for weakness.",
  },
  {
    id: "hermit",
    numeral: "IX",
    name: "The Hermit",
    glyph: "⟡",
    essence: "Reflection, withdrawal, soul-level clarity",
    keywords: ["Retreat", "Discern", "Seek"],
    upright: "Step back from the noise. Solitude will reveal what pressure cannot.",
    reversed: "Isolation may be turning into avoidance. Wisdom still needs contact with the world.",
  },
  {
    id: "wheel-of-fortune",
    numeral: "X",
    name: "Wheel of Fortune",
    glyph: "☸",
    essence: "Cycles, turning points, fate meeting readiness",
    keywords: ["Shift", "Cycle", "Timing"],
    upright: "The wheel is turning in your favor, but you still need to recognize the opening when it arrives.",
    reversed: "A cycle is repeating because the lesson has not been fully met yet.",
  },
  {
    id: "justice",
    numeral: "XI",
    name: "Justice",
    glyph: "⚖",
    essence: "Truth, accountability, consequences, fairness",
    keywords: ["Clarity", "Balance", "Decision"],
    upright: "This situation becomes easier the moment you tell yourself the whole truth.",
    reversed: "Bias, avoidance, or wishful thinking is distorting the reading of the facts.",
  },
  {
    id: "hanged-man",
    numeral: "XII",
    name: "The Hanged Man",
    glyph: "△",
    essence: "Pause, surrender, perspective, sacred delay",
    keywords: ["Release", "Wait", "Reframe"],
    upright: "Nothing is wrong with the pause. It is creating a better angle of vision.",
    reversed: "You may be stuck because you're calling resistance intuition.",
  },
  {
    id: "death",
    numeral: "XIII",
    name: "Death",
    glyph: "☠",
    essence: "Endings, release, transformation, clean severance",
    keywords: ["End", "Transform", "Shed"],
    upright: "Something needs to end so something more honest can begin.",
    reversed: "The old story is lingering because you haven't fully let yourself grieve or detach.",
  },
  {
    id: "temperance",
    numeral: "XIV",
    name: "Temperance",
    glyph: "⚗",
    essence: "Integration, healing, moderation, right proportion",
    keywords: ["Blend", "Heal", "Balance"],
    upright: "The answer is not extreme. It is the elegant middle path that actually lasts.",
    reversed: "Imbalance is showing up as impatience, overcorrection, or trying to force timing.",
  },
  {
    id: "devil",
    numeral: "XV",
    name: "The Devil",
    glyph: "⛓",
    essence: "Attachment, temptation, compulsive loops, power bargains",
    keywords: ["Pattern", "Desire", "Shadow"],
    upright: "See the pattern clearly and it loses some of its hold over you.",
    reversed: "Liberation is possible now, but only if you stop pretending the pattern is harmless.",
  },
  {
    id: "tower",
    numeral: "XVI",
    name: "The Tower",
    glyph: "⚡",
    essence: "Shock, revelation, collapse of false structures",
    keywords: ["Breakthrough", "Truth", "Upheaval"],
    upright: "A false structure is breaking. That does not mean your whole life is ruined.",
    reversed: "You may feel the crack before the collapse. Voluntary change will hurt less than forced change.",
  },
  {
    id: "star",
    numeral: "XVII",
    name: "The Star",
    glyph: "✷",
    essence: "Hope, renewal, trust after difficulty",
    keywords: ["Healing", "Faith", "Guidance"],
    upright: "The path is not only possible, it is quietly healing already.",
    reversed: "Hope is present but dimmed. Stop measuring your recovery against impossible speed.",
  },
  {
    id: "moon",
    numeral: "XVIII",
    name: "The Moon",
    glyph: "◐",
    essence: "Dreams, illusion, sensitivity, hidden tides",
    keywords: ["Mystery", "Instinct", "Fog"],
    upright: "Not everything can be known yet. Let intuition guide you through the fog.",
    reversed: "The fog is starting to clear. What felt mysterious may simply need plain language.",
  },
  {
    id: "sun",
    numeral: "XIX",
    name: "The Sun",
    glyph: "☼",
    essence: "Visibility, joy, confidence, life force",
    keywords: ["Radiance", "Success", "Truth"],
    upright: "This wants to be out in the open. Warmth and honesty help it thrive.",
    reversed: "Joy is available, but doubt or overexposure may be muting it.",
  },
  {
    id: "judgement",
    numeral: "XX",
    name: "Judgement",
    glyph: "☍",
    essence: "Reckoning, awakening, answering the call",
    keywords: ["Awaken", "Decide", "Rise"],
    upright: "You already know what must be answered. This is the moment to stop postponing it.",
    reversed: "Self-judgment is louder than truth right now. Listen for the call beneath the shame.",
  },
  {
    id: "world",
    numeral: "XXI",
    name: "The World",
    glyph: "◌",
    essence: "Completion, wholeness, earned arrival",
    keywords: ["Completion", "Mastery", "Arrival"],
    upright: "A cycle is completing. Let yourself recognize what you've already become.",
    reversed: "You're close to completion, but a final loose thread still needs your attention.",
  },
  ...minorSuits.flatMap((suit) =>
    minorRanks.map((rank) => ({
      id: `${rank.id}-of-${suit.id}`,
      numeral: rank.numeral,
      name: `${rank.name} of ${suit.id.charAt(0).toUpperCase()}${suit.id.slice(1)}`,
      glyph: suit.glyph,
      essence: suit.essence,
      keywords: [rank.keywords[0], rank.keywords[1], suit.keywords[0]],
      upright: `${rank.upright} In ${suit.lens}, this points toward ${suit.keywords[1].toLowerCase()} and ${suit.keywords[2].toLowerCase()}.`,
      reversed: `${rank.reversed} In ${suit.lens}, it can show strain around ${suit.keywords[1].toLowerCase()} or ${suit.keywords[2].toLowerCase()}.`,
    })),
  ),
];

const orientationCopy = (card: DrawnTarotCard) =>
  card.orientation === "upright" ? card.upright : card.reversed;

const minorSuitFocus: Record<string, string> = {
  cups: "feelings, love, and intuition",
  pentacles: "work, money, home, and stability",
  swords: "thoughts, communication, and conflict",
  wands: "desire, action, and momentum",
};

const minorRankTone: Record<string, string> = {
  ace: "a fresh start",
  two: "a choice that needs to be made",
  three: "growth that is starting to show",
  four: "the need to slow down or get steady",
  five: "stress, friction, or discomfort",
  six: "movement away from what has been heavy",
  seven: "mixed signals or a test of judgment",
  eight: "momentum that is building",
  nine: "pressure that has been building for a while",
  ten: "a cycle hitting its peak",
  page: "news, curiosity, or someone learning as they go",
  knight: "fast-moving energy that wants action",
  queen: "steady, mature energy",
  king: "control, authority, or firm boundaries",
};

const positionOpeners: Record<string, string> = {
  "Present current": "Right now",
  "Past influence": "What you are still carrying from the past",
  "Present truth": "What feels most true right now",
  "Near future": "What is coming next",
  "Heart of the matter": "At the center of all this",
  "What blocks you": "What is making this harder",
  "What helps you": "What helps most",
  "What changes next": "What is already starting to shift",
  "Best next move": "Your best next move",
};

const splitMinorCardId = (cardId: string) => {
  const [rank, suit] = cardId.split("-of-");
  return { rank, suit };
};

const describeCardPersonally = (card: DrawnTarotCard) => {
  const cardLabel =
    card.orientation === "reversed" ? `${card.name} reversed` : card.name;

  if (majorArtKeyById[card.id]) {
    if (card.orientation === "upright") {
      return `${cardLabel} feels like one of the main things shaping this situation. To me, it says this is really about ${card.essence.toLowerCase()}. ${orientationCopy(card)}`;
    }

    return `${cardLabel} tells me this part of the situation is tangled, delayed, or being pushed inward. It usually points back to ${card.essence.toLowerCase()}. ${orientationCopy(card)}`;
  }

  const { rank, suit } = splitMinorCardId(card.id);
  const focus = minorSuitFocus[suit] ?? "this part of your life";
  const tone = minorRankTone[rank] ?? "something important that needs attention";

  if (card.orientation === "upright") {
    return `${cardLabel} makes me think of ${tone} around ${focus}. ${orientationCopy(card)}`;
  }

  return `${cardLabel} tells me ${focus} is where things feel off, blocked, or heavier than they need to be right now. ${orientationCopy(card)}`;
};

const buildPositionParagraph = (card: DrawnTarotCard) => {
  const opener = positionOpeners[card.position] ?? card.position;
  return `${opener}, ${describeCardPersonally(card)}`;
};

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const prepareTarotDeck = (): PreparedTarotCard[] =>
  shuffle(tarotDeck).map((card) => ({
    ...card,
    orientation: Math.random() > 0.7 ? "reversed" as const : "upright" as const,
  }));

export const getTarotArtKey = (cardId: string): string | null => {
  if (majorArtKeyById[cardId]) {
    return majorArtKeyById[cardId];
  }

  const [rank, suit] = cardId.split("-of-");
  if (!rank || !suit) {
    return null;
  }

  const suitCode = minorSuits.find((entry) => entry.id === suit)?.code;
  const rankCode = minorRanks.find((entry) => entry.id === rank)?.code;

  if (!suitCode || !rankCode) {
    return null;
  }

  return `${suitCode}${rankCode}`;
};

export const buildTarotReading = (
  spreadId: string,
  selectedCards: PreparedTarotCard[],
  question?: string,
): TarotReading => {
  const spread = tarotSpreads.find((entry) => entry.id === spreadId) ?? tarotSpreads[1];
  const cards = selectedCards.slice(0, spread.cardCount).map((card, index) => ({
    ...card,
    position: spread.positions[index],
  }));

  const openingParagraph = question?.trim()
    ? `You asked about "${question.trim()}," and the spread feels pretty clear to me.`
    : "I pulled your cards, and the message is coming through pretty clearly.";

  const cardParagraphs = cards.map((card) => buildPositionParagraph(card));

  const closing =
    spread.id === "single"
      ? "If I were reading this for you in person, I would tell you to trust the part that hit you right away. That is usually where the truth is."
      : "Taken together, this spread feels more straightforward than your mind wants to make it. Follow the part that feels honest, even if it is not the easiest part.";

  const summary = [openingParagraph, ...cardParagraphs, closing]
    .filter(Boolean)
    .join("\n\n");

  return {
    spread,
    cards,
    headline: "What your cards are saying",
    summary,
    guidance: [],
    closing,
  };
};

export const drawTarotReading = (spreadId: string, question?: string): TarotReading => {
  const spread = tarotSpreads.find((entry) => entry.id === spreadId) ?? tarotSpreads[1];
  return buildTarotReading(
    spread.id,
    prepareTarotDeck().slice(0, spread.cardCount),
    question,
  );
};
