import { Lock, Shield, X } from "lucide-react";

export function TrustSignals() {
  const signals = [
    {
      icon: Lock,
      text: "Your photos are private and encrypted",
    },
    {
      icon: X,
      text: "No ads, ever. We don't sell your data.",
    },
    {
      icon: Shield,
      text: "Cancel anytime, no questions asked",
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="flex items-center gap-3 justify-center text-center md:text-left"
            >
              <signal.icon className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {signal.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
