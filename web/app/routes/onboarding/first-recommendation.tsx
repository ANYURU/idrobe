import { useState, useEffect, Suspense, use } from "react";
import { useNavigate, Form } from "react-router";
import type { Route } from "./+types/first-recommendation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import type { Tables } from "@/lib/database.types";
import { Heart, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase.server";
import { generateOnboardingRecommendations } from "@/lib/outfit-recommendations";
import { ClothingImageCard } from "@/components/ClothingImageCard";

type ClothingItem = Tables<"clothing_items">;
type UserInteraction = Tables<"user_interactions">;
type OutfitRecommendation = Tables<"outfit_recommendations">;

interface RecommendationWithItems extends OutfitRecommendation {
  name: string;
  description: string;
  styling_reason: string;
  items: ClothingItem[];
  userInteraction: UserInteraction | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  return {
    recommendationsPromise: (async () => {
      const { supabase } = createClient(request);

      const { data: items } = await supabase
        .from("clothing_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .limit(10);

      let recommendations: any[] = [];
      let error = null;

      const { data: existingRecs } = await supabase
        .from("outfit_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (existingRecs && existingRecs.length > 0) {
        const { data: interactions } = await supabase
          .from("user_interactions")
          .select("recommendation_id, interaction_type_name, interacted_at")
          .eq("user_id", user.id)
          .in(
            "recommendation_id",
            existingRecs.map((r) => r.id)
          );

        recommendations = await Promise.all(
          existingRecs.map(async (rec) => {
            const { data: items } = await supabase
              .from("clothing_items")
              .select("*")
              .in("id", rec.clothing_item_ids || [])
              .eq("user_id", user.id);

            const userInteraction = interactions?.find(
              (i) => i.recommendation_id === rec.id
            );

            return {
              ...rec,
              name: `${rec.occasion_name || "Daily"} Outfit`,
              description: `Perfect for ${rec.occasion_name?.toLowerCase() || "everyday wear"}${rec.mood_name ? ` with a ${rec.mood_name} vibe` : ""}`,
              styling_reason: rec.recommendation_reason,
              items: items || [],
              userInteraction: userInteraction || null,
            };
          })
        );
      } else if (items && items.length >= 2) {
        try {
          const result = await generateOnboardingRecommendations(
            user.id,
            request
          );
          if (result.error) {
            error = result.error;
          } else {
            recommendations = result.recommendations || [];
          }
        } catch (err) {
          error = "Failed to generate recommendations";
        }
      }

      return {
        items: items || [],
        recommendations: recommendations || [],
        error,
      };
    })(),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);
  const formData = await request.formData();

  const liked = formData.get("liked") === "true";
  const recommendationId = formData.get("recommendation_id") as string;

  if (!recommendationId) {
    throw new Error("Missing recommendation ID");
  }

  const { error } = await supabase.from("user_interactions").insert({
    user_id: user.id,
    recommendation_id: recommendationId,
    interaction_type_name: liked ? "liked" : "disliked",
  });

  if (error) {
    throw new Error("Failed to save interaction");
  }

  return {
    success: true,
    message: liked ? "Thanks for the feedback! 💚" : "Feedback saved! 👍",
  };
}

export default function OnboardingFirstRecommendation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <Suspense fallback={<RecommendationsSkeleton />}>
      <RecommendationsContent
        recommendationsPromise={loaderData.recommendationsPromise}
        actionData={actionData}
        navigate={navigate}
        toast={toast}
      />
    </Suspense>
  );
}

function RecommendationsContent({
  recommendationsPromise,
  actionData,
  navigate,
  toast,
}: {
  recommendationsPromise: Promise<any>;
  actionData: any;
  navigate: any;
  toast: any;
}) {
  const { recommendations, error } = use(recommendationsPromise) as {
    recommendations: RecommendationWithItems[];
    error: string | null;
    items: ClothingItem[];
  };

  const [currentRecommendation, setCurrentRecommendation] = useState(0);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        action: {
          label: "Retry",
          onClick: () => window.location.reload(),
        },
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (actionData?.success && actionData?.message) {
      toast.success(actionData.message);
    }
  }, [actionData, toast]);

  const recommendation = recommendations?.[currentRecommendation];
  const currentInteraction =
    recommendation?.userInteraction?.interaction_type_name;

  const handleContinue = () => {
    navigate("/onboarding/complete");
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <main className="px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <header>
            <div className="flex items-center justify-center gap-3 max-w-md mx-auto mb-6">
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-muted rounded"></div>
            </div>
            <h1 className="text-2xl font-semibold text-center">
              Almost there!
            </h1>
            <p className="text-muted-foreground mt-1 text-center">
              Upload a few more items to see your first AI recommendation
            </p>
          </header>

          <section
            className="bg-muted/50 rounded-lg p-4 text-center space-y-4 border border-border"
            aria-label="Upload prompt"
          >
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              We need at least 2 clothing items to create your first outfit
              recommendation.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/onboarding/upload")}
                className="flex-1 cursor-pointer"
              >
                Upload more items
              </Button>
              <Button
                variant="outline"
                onClick={handleContinue}
                className="cursor-pointer"
              >
                Skip to dashboard
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <header>
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto mb-6">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
          </div>
          <h1 className="text-2xl font-semibold text-center">
            Your first AI recommendation!
          </h1>
          <p className="text-muted-foreground mt-1 text-center">
            Here's what you could wear using your uploaded pieces
          </p>
        </header>

        <section
          className="bg-muted/50 rounded-lg p-4 border border-border"
          aria-label="Outfit recommendations"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Your AI Outfit Recommendations</h2>
            </div>
            {recommendations.length > 1 && (
              <p className="text-sm text-muted-foreground">
                {currentRecommendation + 1} of {recommendations.length}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <header className="bg-background rounded-lg p-4">
                <h3 className="font-semibold capitalize">
                  {recommendation?.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {recommendation?.description}
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                {recommendation?.items?.map((item: any) => (
                  <article key={item.id} className="group cursor-pointer">
                    <div className="relative">
                      <ClothingImageCard
                        filePath={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-contain rounded-lg bg-muted/30 group-hover:scale-105 transition-transform"
                        fallbackClassName="w-full h-48 rounded-lg"
                      />
                    </div>
                    <header className="pt-3">
                      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {item.primary_color}
                      </p>
                    </header>
                  </article>
                )) || []}
              </div>

              {recommendation?.styling_reason &&
                recommendation.styling_reason !==
                  recommendation.description && (
                  <div className="bg-background rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                      Why this works
                    </p>
                    <p className="text-sm">{recommendation.styling_reason}</p>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentRecommendation((prev) => Math.max(0, prev - 1))
                }
                disabled={currentRecommendation === 0}
              >
                ← Previous
              </Button>

              <div className="flex gap-2">
                {recommendations.map((_, index: number) => {
                  const rec = recommendations[index];
                  const hasInteraction =
                    rec?.userInteraction?.interaction_type_name;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentRecommendation(index)}
                      className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                        index === currentRecommendation
                          ? "bg-primary scale-110"
                          : hasInteraction
                            ? hasInteraction === "liked"
                              ? "bg-green-500"
                              : "bg-muted"
                            : "bg-muted-foreground hover:bg-muted"
                      }`}
                    />
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentRecommendation((prev) =>
                    Math.min(recommendations.length - 1, prev + 1)
                  )
                }
                disabled={currentRecommendation === recommendations.length - 1}
              >
                Next →
              </Button>
            </div>

            <footer className="space-y-4 pt-4 border-t border-border">
              <header className="bg-background rounded-lg p-4 text-center">
                <p className="font-semibold">
                  What do you think of this outfit?
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your feedback helps us learn your style (optional)
                </p>
              </header>

              <div className="flex gap-4 justify-center">
                <Form method="post" className="contents">
                  <input
                    type="hidden"
                    name="recommendation_id"
                    value={recommendation.id}
                  />
                  <input type="hidden" name="liked" value="true" />
                  <Button
                    type="submit"
                    disabled={!!currentInteraction}
                    variant={
                      currentInteraction === "liked" ? "default" : "outline"
                    }
                    size="lg"
                  >
                    <Heart
                      className={`h-5 w-5 mr-2 ${currentInteraction === "liked" ? "fill-white" : ""}`}
                    />
                    {currentInteraction === "liked" ? "Loved!" : "Love it"}
                  </Button>
                </Form>

                <Form method="post" className="contents">
                  <input
                    type="hidden"
                    name="recommendation_id"
                    value={recommendation.id}
                  />
                  <input type="hidden" name="liked" value="false" />
                  <Button
                    type="submit"
                    disabled={!!currentInteraction}
                    variant={
                      currentInteraction === "disliked" ? "default" : "outline"
                    }
                    size="lg"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {currentInteraction === "disliked" ? "Not for me" : "Pass"}
                  </Button>
                </Form>
              </div>

              {currentInteraction && (
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-sm">
                    {currentInteraction === "liked"
                      ? "💚 We'll remember you love this style combination!"
                      : "👍 Thanks for the feedback - we'll learn from this!"}
                  </p>
                </div>
              )}

              {(() => {
                const ratedCount = recommendations.filter(
                  (r) => r.userInteraction
                ).length;
                if (ratedCount >= 1) {
                  return (
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Thanks for the feedback! This helps us learn your
                        style preferences.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <Button
                onClick={handleContinue}
                className="w-full cursor-pointer"
                variant={
                  recommendations.filter((r) => r.userInteraction).length >= 1
                    ? "default"
                    : "outline"
                }
              >
                {recommendations.filter((r) => r.userInteraction).length >= 1
                  ? "Continue to Dashboard"
                  : "Skip for now"}
              </Button>
            </footer>
          </div>
        </section>

        <footer className="text-center text-sm text-muted-foreground">
          <p>
            This is just the beginning - your recommendations will get better as
            we learn your style!
          </p>
        </footer>
      </div>
    </main>
  );
}

function RecommendationsSkeleton() {
  return (
    <main className="px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto mb-6">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <Skeleton className="flex-1 h-1 rounded" />
          </div>
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        <section
          className="bg-muted/50 rounded-lg p-4 border border-border"
          aria-label="Loading recommendations"
        >
          <div className="text-center mb-6">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-40 mx-auto" />
                <Skeleton className="h-4 w-56 mx-auto" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                {[1, 2].map((i) => (
                  <article key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
