import { BRAND_FIRST_NAME } from "@/lib/brand";

interface ChatMessageProps {
  role: "user" | "oracle";
  text: string;
  category?: string;
}

const ChatMessage = ({ role, text, category }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-[28px] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:max-w-[78%] ${
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-purple-dim bg-[rgba(20,14,33,0.94)] text-foreground"
        }`}
      >
        <p
          className={`mb-2 text-[10px] uppercase tracking-[0.28em] ${
            isUser ? "text-primary-foreground/70" : "text-purple-glow"
          }`}
        >
          {isUser ? "You" : category || BRAND_FIRST_NAME}
        </p>
        <p
          className={`whitespace-pre-wrap break-words text-[15px] leading-7 ${
            isUser ? "font-body text-primary-foreground" : "font-body text-foreground/92"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
