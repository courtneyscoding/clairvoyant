import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Hand, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import courtneyImg from "@/assets/courtney.png";
import { getApiUrl } from "@/lib/api";

interface UploadSectionProps {
  id: string;
}

const UploadSection = ({ id }: UploadSectionProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setReading(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleReadPalm = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setReading(null);

    try {
      const response = await fetch(getApiUrl("/api/palm-reading"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          question: question.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "The spirits could not be reached. Please try again.");
      }

      if (data?.error) throw new Error(data.error);

      setReading(data.reading);
    } catch (err: unknown) {
      console.error("Palm reading error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "The spirits could not be reached. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id={id} className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <Sparkles className="w-8 h-8 text-accent mx-auto mb-4" />
        <h2 className="font-display text-3xl md:text-4xl text-foreground text-glow mb-4">
          Show Me Your Palm
        </h2>
        <p className="text-muted-foreground font-body mb-12 max-w-md mx-auto">
          Take a clear photo of your open palm under good lighting. The clearer the image, the deeper the reading.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed p-12 transition-all duration-300
            ${dragOver
              ? "border-accent box-glow bg-accent/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
            }
            ${preview ? "p-4" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Your palm"
                className="max-h-80 mx-auto rounded-md"
              />
              <p className="text-muted-foreground text-sm">Click to choose a different photo</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Hand className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-foreground font-body font-medium mb-1">
                  Drop your palm photo here
                </p>
                <p className="text-muted-foreground text-sm">
                  or click to browse
                </p>
              </div>
              <Upload className="w-5 h-5 text-muted-foreground mx-auto" />
            </div>
          )}
        </div>

        {/* Ask a question */}
        {preview && !reading && (
          <div className="mt-6">
            <label htmlFor="palm-question" className="block text-foreground font-display text-sm mb-2">
              ✦ Ask Clairvoyant Courtney a Question (optional) ✦
            </label>
            <textarea
              id="palm-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Will I find love? What does my career path look like? Is there something I should be warned about?"
              className="w-full rounded-lg border border-border bg-muted/50 text-foreground font-body text-sm p-4 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
              rows={3}
              disabled={loading}
            />
          </div>
        )}

        {preview && !reading && (
          <Button
            variant="mystic"
            size="lg"
            className="mt-6"
            onClick={handleReadPalm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                The spirits are reading...
              </>
            ) : (
              "Read My Palm"
            )}
          </Button>
        )}

        {/* Psychic reading animation */}
        {loading && (
          <div className="mt-12 flex flex-col items-center animate-fade-in">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden box-glow mb-6">
              <img
                src={courtneyImg}
                alt="Clairvoyant Courtney reading your palm"
                className="w-full h-full object-cover object-top animate-pulse"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute inset-0 rounded-full border-2 border-accent/40 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <p className="font-display text-foreground text-glow text-lg animate-pulse">
              Courtney is studying your lines...
            </p>
            <div className="flex gap-2 mt-3">
              {['✦', '✧', '✦'].map((star, i) => (
                <span
                  key={i}
                  className="text-accent text-xl animate-bounce"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {star}
                </span>
              ))}
            </div>
          </div>
        )}

        {reading && (
          <div className="mt-12 text-left bg-card/50 border border-border rounded-lg p-8 box-glow">
            <h3 className="font-display text-2xl text-foreground text-glow mb-6 text-center">
              ✦ Your Reading ✦
            </h3>
            <div className="text-foreground/90 font-body leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {reading}
            </div>
            <div className="mt-8 text-center">
              <Button
                variant="mystic"
                size="lg"
                onClick={() => {
                  setReading(null);
                  setPreview(null);
                  setImageBase64(null);
                  setQuestion("");
                }}
              >
                New Reading
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadSection;
