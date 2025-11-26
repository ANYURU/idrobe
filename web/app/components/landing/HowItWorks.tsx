import { Camera, Sparkles, Shirt } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Camera,
      number: "1",
      title: "Upload Your Clothes",
      description: "Snap photos or upload from your phone. No manual tagging required.",
    },
    {
      icon: Sparkles,
      number: "2",
      title: "AI Organizes Everything",
      description: "Auto-categorized by type, color, season, and style. Detects duplicates too.",
    },
    {
      icon: Shirt,
      number: "3",
      title: "Get Daily Outfit Ideas",
      description: "Personalized to weather, events, and your style. Track your impact.",
    },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            From chaos to curated in three simple steps
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step card */}
              <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all cursor-pointer">
                {/* Number badge */}
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mb-6 mt-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-center">
                  {step.description}
                </p>
              </div>

              {/* Arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 011.414-1.414L10 15.586l6.293-6.293a1 1 0 011.414 1.414l-7 7A1 1 0 0110 18z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
