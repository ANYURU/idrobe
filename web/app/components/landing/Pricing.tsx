import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "10 clothing items",
        "3 AI outfits per week",
        "1GB storage",
        "Basic trends access",
        "Community support",
      ],
      cta: "Start Free",
      href: "/auth/signup",
      popular: false,
    },
    {
      name: "Premium",
      price: "$4.99",
      period: "per month",
      description: "Unlimited AI recommendations",
      features: [
        "Unlimited clothing items",
        "Unlimited AI outfits",
        "10GB storage",
        "Sustainability tracking",
        "Real-time fashion trends",
        "Wardrobe gap analysis",
        "14-day free trial",
      ],
      cta: "Try Free for 14 Days",
      href: "/auth/signup?plan=premium",
      popular: true,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      description: "Everything + social & API",
      features: [
        "Everything in Premium",
        "50GB storage",
        "Social sharing",
        "API access",
        "Custom AI prompts",
        "Priority support",
        "14-day free trial",
      ],
      cta: "Try Free for 14 Days",
      href: "/auth/signup?plan=pro",
      popular: false,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Start free, upgrade anytime. All plans include core AI features.
          </p>
          <p className="text-sm text-primary font-medium">
            💡 Save 20% with annual billing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card border-2 rounded-xl p-8 flex flex-col ${
                plan.popular
                  ? "border-primary shadow-xl scale-105"
                  : "border-border hover:border-primary/50"
              } transition-all`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link to={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
