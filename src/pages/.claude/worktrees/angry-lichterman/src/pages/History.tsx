import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CosmicBackground from "@/components/CosmicBackground";

const History = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] flex flex-col px-6 py-8 overflow-hidden">
      <CosmicBackground />

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/chat")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-foreground text-2xl font-light">Private Memory</h1>
      </div>

      <div className="mx-auto mt-16 w-full max-w-xl rounded-[28px] border border-purple-dim bg-mystic/70 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <p className="text-[11px] uppercase tracking-[0.32em] text-purple-light">Hidden History</p>
        <p className="mt-4 font-display text-3xl text-foreground">Courtney still remembers.</p>
        <p className="mt-4 font-body text-sm leading-7 text-muted-foreground">
          Your previous conversations are kept in private memory for future readings, but they
          are not shown back in the public chat window.
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="mt-6 rounded-full border border-purple-dim px-5 py-3 font-body text-sm text-foreground transition-colors hover:border-primary/50"
        >
          Return to chat
        </button>
      </div>
    </div>
  );
};

export default History;
