import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Leaf, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <Sparkles className="h-16 w-16 text-primary animate-pulse" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-20">
        <Leaf className="h-20 w-20 text-primary animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI Styling Meets Sustainability</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up">
          Your AI Stylist
          <br />
          <span className="text-primary">with a Conscience</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Get daily outfit ideas while tracking your fashion's environmental impact
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 group" asChild>
            <Link to="/auth/signup">
              Start Free—No Credit Card
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6" asChild>
            <a href="#how-it-works">
              See How It Works
            </a>
          </Button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free forever plan</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>14-day Pro trial</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
