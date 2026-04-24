import { Eye, Heart, Star } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Life Line",
    description: "Discover insights about your vitality, health, and major life changes ahead.",
  },
  {
    icon: Heart,
    title: "Heart Line",
    description: "Uncover the emotional landscape of your relationships and inner feelings.",
  },
  {
    icon: Star,
    title: "Fate Line",
    description: "Explore the path destiny has carved and the choices that shape your future.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-6 gradient-glow">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground text-glow text-center mb-16">
          What the Lines Reveal
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="text-center p-8 rounded-lg bg-card/50 border border-border hover:border-primary/40 hover:box-glow transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <f.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
