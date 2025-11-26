import { Brain, Cloud, Leaf, TrendingUp, Target, Calendar } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Brain,
      title: "Smart Organization",
      description: "Upload once, never manually tag again. AI detects duplicates & suggests decluttering.",
      gradient: "from-primary/10 to-primary/5",
    },
    {
      icon: Cloud,
      title: "Weather-Aware Outfits",
      description: "Rain? Cold snap? AI adjusts automatically. Never caught underdressed again.",
      gradient: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: Leaf,
      title: "Sustainability Dashboard",
      description: "Track CO₂, water usage, waste reduction. See impact of wearing vs. buying new.",
      gradient: "from-green-500/10 to-green-500/5",
    },
    {
      icon: TrendingUp,
      title: "Real-Time Fashion Trends",
      description: "Google Trends + social media integration. Know what's trending before you shop.",
      gradient: "from-purple-500/10 to-purple-500/5",
    },
    {
      icon: Target,
      title: "Wardrobe Gap Analysis",
      description: "AI identifies missing pieces in your closet. Smart shopping suggestions, not impulse buys.",
      gradient: "from-orange-500/10 to-orange-500/5",
    },
    {
      icon: Calendar,
      title: "Event Planning",
      description: "Wedding? Interview? Date night? Get occasion-specific outfit suggestions.",
      gradient: "from-pink-500/10 to-pink-500/5",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make getting dressed effortless and sustainable
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`} />

              {/* Content */}
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
