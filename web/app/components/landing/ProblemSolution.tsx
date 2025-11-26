import { CheckCircle2 } from "lucide-react";

export function ProblemSolution() {
  const problems = [
    {
      emoji: "😩",
      title: "I have nothing to wear",
      subtitle: "but your closet is overflowing",
    },
    {
      emoji: "⏰",
      title: "23 minutes wasted",
      subtitle: "deciding what to wear every morning",
    },
    {
      emoji: "🌍",
      title: "10% of global emissions",
      subtitle: "from fashion, but you don't know your impact",
    },
  ];

  const solutions = [
    {
      text: "AI finds outfit combos you never thought of",
      icon: "✨",
    },
    {
      text: "Weather + event-aware suggestions in 3 seconds",
      icon: "⚡",
    },
    {
      text: "See your fashion carbon footprint in real-time",
      icon: "📊",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-12 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            The Wardrobe Paradox
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Sound familiar? You're not alone.
          </p>
        </header>

        {/* Problems - Vertical on mobile, Horizontal on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 sm:p-5 flex lg:flex-col items-start lg:items-center gap-4 lg:gap-3 lg:text-center hover:border-destructive/50 transition-colors cursor-default"
            >
              <span className="text-3xl sm:text-4xl flex-shrink-0">{problem.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                  {problem.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {problem.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="flex flex-col items-center">
            <div className="h-8 sm:h-12 w-0.5 bg-primary mb-2" />
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 011.414-1.414L10 15.586l6.293-6.293a1 1 0 011.414 1.414l-7 7A1 1 0 0110 18z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Solutions - Vertical on mobile, Horizontal on desktop */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="flex lg:flex-col items-start lg:items-center gap-3 sm:gap-4 lg:text-center"
              >
                <span className="text-xl sm:text-2xl flex-shrink-0">{solution.icon}</span>
                <div className="flex items-start gap-2 flex-1">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-foreground font-medium">
                    {solution.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
