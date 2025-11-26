import { Frown, Clock, Globe } from "lucide-react";

export function ProblemSolution() {
  const problems = [
    {
      icon: Frown,
      title: '"I have nothing to wear"',
      subtitle: "(but your closet is overflowing)",
    },
    {
      icon: Clock,
      title: "23 minutes wasted every morning",
      subtitle: "deciding what to wear",
    },
    {
      icon: Globe,
      title: "Fashion = 10% of global carbon emissions",
      subtitle: "(but you have no idea your personal impact)",
    },
  ];

  const solutions = [
    "✨ AI finds outfit combos you never thought of",
    "⚡ Weather + event-aware suggestions in 3 seconds",
    "📊 See your fashion carbon footprint in real-time",
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            The Wardrobe Paradox
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sound familiar? You're not alone.
          </p>
        </div>

        {/* Problems */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <problem.icon className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {problem.title}
              </h3>
              <p className="text-sm text-muted-foreground">{problem.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center">
            <div className="h-12 w-0.5 bg-primary mb-2" />
            <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 011.414-1.414L10 15.586l6.293-6.293a1 1 0 011.414 1.414l-7 7A1 1 0 0110 18z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Solutions */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <svg className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-foreground font-medium">{solution}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
