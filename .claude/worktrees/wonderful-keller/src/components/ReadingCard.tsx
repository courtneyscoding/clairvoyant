import { useState, useEffect } from "react";

interface ReadingCardProps {
  reading: string;
  category: string;
  visible: boolean;
}

const ReadingCard = ({ reading, category, visible }: ReadingCardProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`w-full max-w-sm mx-auto transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="relative rounded-2xl border border-purple-dim bg-mystic p-6 glow-purple overflow-hidden">
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-purple-dim opacity-60" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-purple-dim opacity-60" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-purple-dim opacity-60" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-purple-dim opacity-60" />

        <p className="text-purple-glow font-display text-xs tracking-[0.3em] uppercase mb-4 text-center">
          {category}
        </p>
        <p className="font-display text-foreground text-xl leading-relaxed text-center italic">
          "{reading}"
        </p>
      </div>
    </div>
  );
};

export default ReadingCard;