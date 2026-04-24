import { useState } from "react";

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
  className?: string;
  placeholder?: string;
}

const QuestionInput = ({
  onSubmit,
  loading,
  className = "",
  placeholder = "Message Clairvoyant Courtney...",
}: QuestionInputProps) => {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onSubmit(question.trim());
      setQuestion("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="w-full rounded-[30px] border border-purple-dim bg-[rgba(18,14,28,0.86)] px-5 py-4 pr-16 text-foreground font-body text-sm placeholder:text-muted-foreground/90 shadow-[0_12px_35px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-300 focus:border-primary focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 active:scale-95 hover:shadow-lg disabled:opacity-30"
          aria-label="Submit question"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default QuestionInput;
