import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Camera, TrendingUp, Shirt } from "lucide-react";
import type { Route } from "./+types/complete";
import { createClient } from "@/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { itemCount: 0 };

  // Mark onboarding as completed
  await supabase
    .from("user_profiles")
    .update({ onboarding_completed: true })
    .eq("user_id", user.id);

  // Get user's uploaded items count
  const { count } = await supabase
    .from("clothing_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return { itemCount: count || 0 };
}

export default function OnboardingComplete({
  loaderData,
}: Route.ComponentProps) {
  const { itemCount } = loaderData;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-4 sm:space-y-6">
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <div className="text-center space-y-6">
            <header>
              <div className="flex justify-center mb-4">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-full p-3">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold">
                Welcome to iDrobe!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your AI stylist is ready to help you look amazing every day.
              </p>
              {itemCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {itemCount} {itemCount === 1 ? "item" : "items"} uploaded and analyzed
                </p>
              )}
            </header>

            <section className="space-y-3" aria-label="What's next">
              <h2 className="text-sm font-semibold text-left">
                What you can do now:
              </h2>
              <div className="grid grid-cols-1 gap-2">
                <article className="bg-background rounded-lg p-3 border border-border text-left">
                  <div className="flex items-start gap-3">
                    <Shirt className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        Browse your wardrobe
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        View and manage all your clothing items
                      </p>
                    </div>
                  </div>
                </article>

                <article className="bg-background rounded-lg p-3 border border-border text-left">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        Get outfit recommendations
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI-powered suggestions for any occasion
                      </p>
                    </div>
                  </div>
                </article>

                <article className="bg-background rounded-lg p-3 border border-border text-left">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Track your style</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Discover trends and wardrobe insights
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <div className="pt-2">
              <Link to="/dashboard" className="block">
                <Button size="lg" className="w-full cursor-pointer">
                  Go to Dashboard
                </Button>
              </Link>

              {itemCount < 5 && (
                <Link to="/wardrobe/add" className="block mt-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full cursor-pointer"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add more items
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {itemCount < 10 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Pro tip</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add at least 10 items to get the best outfit recommendations
                  and style insights.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
