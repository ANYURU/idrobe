import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Suspense, use } from "react";
import type { Tables } from "@/lib/database.types";

type SubscriptionPlan = Tables<"subscription_plans"> & {
  limits?: Array<Tables<"plan_limits">>;
};

interface PricingProps {
  plansPromise: Promise<SubscriptionPlan[]>;
}

function PricingContent({ plansPromise }: PricingProps) {
  const plans = use(plansPromise);

  // Map plans to display format
  const displayPlans = plans
    .filter((plan) => ["Free", "Premium", "Pro"].includes(plan.name))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, 3) // Only show monthly plans
    .map((plan) => {
      const features: string[] = [];
      const limits = plan.limits || [];

      // Build feature list from limits
      const uploadsLimit = limits.find((l) => l.limit_type === "uploads");
      const recsLimit = limits.find((l) => l.limit_type === "recs");
      const storageLimit = limits.find((l) => l.limit_type === "storage_gb");

      if (uploadsLimit) {
        features.push(
          uploadsLimit.limit_value === -1
            ? "Unlimited clothing items"
            : `${uploadsLimit.limit_value} clothing items`
        );
      }

      if (recsLimit) {
        features.push(
          recsLimit.limit_value === -1
            ? "Unlimited AI outfits"
            : `${recsLimit.limit_value} AI outfits per ${recsLimit.period}`
        );
      }

      if (storageLimit) {
        features.push(`${storageLimit.limit_value}GB storage`);
      }

      // Add plan-specific features
      if (plan.name === "Free") {
        features.push("Basic trends access", "Community support");
      } else if (plan.name === "Premium") {
        features.push(
          "Sustainability tracking",
          "Real-time fashion trends",
          "Wardrobe gap analysis",
          "14-day free trial"
        );
      } else if (plan.name === "Pro") {
        features.push(
          "Everything in Premium",
          "Social sharing",
          "API access",
          "Custom AI prompts",
          "Priority support",
          "14-day free trial"
        );
      }

      return {
        name: plan.name,
        price: plan.price === 0 ? "$0" : `$${plan.price}`,
        period: plan.billing_interval === "year" ? "per year" : plan.price === 0 ? "forever" : "per month",
        description: plan.description || "",
        features,
        cta: plan.price === 0 ? "Start Free" : "Try Free for 14 Days",
        href: plan.price === 0 ? "/auth/signup" : `/auth/signup?plan=${plan.name.toLowerCase()}`,
        popular: plan.name === "Premium",
      };
    });

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Choose Your Plan
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Start free, upgrade anytime. All plans include core AI features.
          </p>
          <p className="text-sm text-primary font-medium">
            💡 Save 20% with annual billing
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayPlans.map((plan, index) => (
            <article
              key={index}
              className={`relative bg-card border-2 rounded-xl p-8 flex flex-col ${
                plan.popular
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              } transition-all cursor-default`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <header className="text-center mb-6">
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
              </header>

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
                className="w-full cursor-pointer"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link to={plan.href}>{plan.cta}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing({ plansPromise }: PricingProps) {
  return (
    <Suspense
      fallback={
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="h-12 w-64 bg-muted animate-pulse rounded mx-auto mb-4" />
              <div className="h-6 w-96 bg-muted animate-pulse rounded mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      }
    >
      <PricingContent plansPromise={plansPromise} />
    </Suspense>
  );
}
