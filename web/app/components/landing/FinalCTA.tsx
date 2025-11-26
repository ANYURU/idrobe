import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
          Ready to Transform Your Wardrobe?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands making smarter, more sustainable fashion choices
        </p>

        <Button size="lg" className="text-lg px-8 py-6 group" asChild>
          <Link to="/auth/signup">
            Create Free Account
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day Pro trial
        </p>
      </div>
    </section>
  );
}
