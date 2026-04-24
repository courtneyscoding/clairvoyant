import heroImage from "@/assets/psychic-hero.jpg";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStartReading: () => void;
}

const HeroSection = ({ onStartReading }: HeroSectionProps) => {
  return (
    <section className="relative flex flex-col items-center px-6">
      <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground text-glow-purple leading-tight mb-6">
          Courtney's Palm Reading 
        </h1>
      {/* Courtney portrait */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-primary/30 glow-purple mb-8">
        <img
          src={heroImage}
          alt="Clairvoyant Courtney reading a palm"
          className="w-full h-full object-cover object-top"
        />
      </div>

      {/* Content */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-accent font-body tracking-[0.3em] uppercase text-xs mb-4 animate-pulse">
          ✦ Unveil Your Destiny ✦
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground text-glow-purple leading-tight mb-6">
          Palm Readings 
        </h1>
        </p>
        <p className="text-muted-foreground font-body text-lg md:text-xl mb-10 leading-relaxed max-w-lg mx-auto">
          Upload a photo of your palm and let Clairvoyant Courtney reveal the secrets written in your lines.
        </p>
        <Button variant="mystic" size="lg" onClick={onStartReading}>
          Begin Your Reading
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
