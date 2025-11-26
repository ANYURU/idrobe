import { Brain, Cloud, Leaf, TrendingUp, Target, Calendar } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Brain,
      title: "Smart Organization",
      description: "Upload once, never manually tag again. AI detects duplicates & suggests decluttering.",
    },
    {
      icon: Cloud,
      title: "Weather-Aware Outfits",
      description: "Rain? Cold snap? AI adjusts automatically. Never caught underdressed again.",
    },
    {
      icon: Leaf,
      title: "Sustainability Dashboard",
      description: "Track CO₂, water usage, waste reduction. See impact of wearing vs. buying new.",
    },
    {
      icon: TrendingUp,
      title: "Real-Time Fashion Trends",
      description: "Google Trends + social media integration. Know what's trending before you shop.",
    },
    {
      icon: Target,
      title: "Wardrobe Gap Analysis",
      description: "AI identifies missing pieces in your closet. Smart shopping suggestions, not impulse buys.",
    },
    {
      icon: Calendar,
      title: "Event Planning",
      description: "Wedding? Interview? Date night? Get occasion-specific outfit suggestions.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-12 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Everything You Need
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make getting dressed effortless and sustainable
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-default"
            >
              {/* Icon */}
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>

              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
