import { useState, useEffect, Suspense, use } from "react";
import { useNavigate, Form } from "react-router";
import type { Route } from "./+types/first-recommendation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import type { Tables } from "@/lib/database.types";

// Proper types for recommendations
type ClothingItem = Tables<'clothing_items'>;
type UserInteraction = Tables<'user_interactions'>;
type OutfitRecommendation = Tables<'outfit_recommendations'>;

interface RecommendationWithItems extends OutfitRecommendation {
  name: string;
  description: string;
  styling_reason: string;
  items: ClothingItem[];
  userInteraction: UserInteraction | null;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase.server";
import { generateOnboardingRecommendations } from "@/lib/outfit-recommendations";
import { ClothingImage } from "@/components/ClothingImage";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  return {
    recommendationsPromise: (async () => {
      const { supabase } = createClient(request);

      // Get user's uploaded items
      const { data: items } = await supabase
        .from("clothing_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .limit(10);

      let recommendations: any[] = [];
      let error = null;

      // First check for existing recommendations
      const { data: existingRecs } = await supabase
        .from("outfit_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      console.log("🔍 Found existing recommendations:", existingRecs?.length || 0);

      if (existingRecs && existingRecs.length > 0) {
        console.log("✅ Using existing recommendations:", existingRecs.length);

        // Get interactions separately (more reliable than joins)
        const { data: interactions } = await supabase
          .from("user_interactions")
          .select("recommendation_id, interaction_type_name, interacted_at")
          .eq("user_id", user.id)
          .in(
            "recommendation_id",
            existingRecs.map((r) => r.id)
          );

        // Use existing recommendations with items
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
              name: rec.recommendation_reason || "AI Outfit",
              description: rec.recommendation_reason || "AI-curated combination",
              styling_reason: rec.recommendation_reason,
              items: items || [],
              userInteraction: userInteraction || null,
            };
          })
        );
      } else if (items && items.length >= 2) {
        console.log(
          "🤖 Generating new recommendations (found:",
          existingRecs?.length || 0,
          "existing)"
        );
        try {
          const result = await generateOnboardingRecommendations(user.id, request);
          if (result.error) {
            error = result.error;
          } else {
            recommendations = result.recommendations || [];
          }
        } catch (err) {
          console.error("❌ Recommendation generation failed:", err);
          error = "Failed to generate recommendations";
        }
      }

      const hasInteractions = recommendations?.some((r) => r.userInteraction);
      console.log(
        `📊 Loader: ${recommendations?.length || 0} recs, ${hasInteractions ? "with" : "no"} interactions`
      );

      return {
        items: items || [],
        recommendations: recommendations || [],
        error,
      };
    })()
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);
  const formData = await request.formData();

  const liked = formData.get("liked") === "true";
  const recommendationId = formData.get("recommendation_id") as string;

  console.log(`💾 Saving interaction: ${liked ? "LIKED" : "DISLIKED"}`);

  if (!recommendationId) {
    throw new Error("Missing recommendation ID");
  }

  // Save interaction
  const { error } = await supabase.from("user_interactions").insert({
    user_id: user.id,
    recommendation_id: recommendationId,
    interaction_type_name: liked ? "liked" : "disliked",
  });

  if (error) {
    console.error("❌ Failed to save interaction:", error);
    throw new Error("Failed to save interaction");
  }

  console.log("✅ Interaction saved successfully");

  return { 
    success: true, 
    message: liked ? "Thanks for the feedback! 💚" : "Feedback saved! 👍" 
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
  toast 
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

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error, {
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
    }
  }, [error, toast])

  // Show success toast when interaction is saved
  useEffect(() => {
    if (actionData?.success && actionData?.message) {
      toast.success(actionData.message)
    }
  }, [actionData, toast])

  const recommendation = recommendations?.[currentRecommendation];
  const currentInteraction =
    recommendation?.userInteraction?.interaction_type_name;

  const handleContinue = () => {
    navigate("/onboarding/complete");
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-primary rounded"></div>
              <div className="flex-1 h-1 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Almost there!</h1>
              <p className="text-muted-foreground">
                Upload a few more items to see your first AI recommendation
              </p>
            </div>
          </div>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="pt-6 text-center space-y-4">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                We need at least 2 clothing items to create your first outfit
                recommendation.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/onboarding/upload")}
                  className="flex-1"
                >
                  Upload more items
                </Button>
                <Button variant="outline" onClick={handleContinue}>
                  Skip to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Your first AI recommendation!</h1>
            <p className="text-muted-foreground">
              Here's what you could wear using your uploaded pieces
            </p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-card-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Your AI Outfit Recommendations
            </CardTitle>
            <CardDescription>
              {recommendations.length > 1 ? (
                <span>
                  Recommendation {currentRecommendation + 1} of{" "}
                  {recommendations.length}
                </span>
              ) : (
                "Your personalized outfit suggestion"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Recommendation */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold">
                  {recommendation?.name}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {recommendation?.description}
                </p>
              </div>

              {/* Clothing Items Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {recommendation?.items?.map((item: any) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative">
                      <ClothingImage
                        filePath={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.primary_color}
                      </p>
                    </div>
                  </Card>
                )) || []}
              </div>

              {/* Styling Reason */}
              {recommendation?.styling_reason && (
                <div className="p-4 bg-accent rounded-lg border border-border">
                  <p className="text-sm text-accent-foreground">
                    <span className="font-medium text-primary">
                      Why this works:
                    </span>{" "}
                    {recommendation.styling_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentRecommendation((prev) => Math.max(0, prev - 1))
                }
                disabled={currentRecommendation === 0}
                className="flex items-center gap-2"
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
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
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
                className="flex items-center gap-2"
              >
                Next →
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4 border-t">
              <p className="text-center font-medium">
                What do you think of this outfit?
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Your feedback helps us learn your style (optional)
              </p>

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
                    data-testid="love-button"
                    className={`flex items-center gap-2 transition-all ${
                      currentInteraction === "liked"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : currentInteraction === "disliked"
                          ? "opacity-50"
                          : "hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        currentInteraction === "liked" ? "fill-white" : ""
                      }`}
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
                    className={`flex items-center gap-2 transition-all ${
                      currentInteraction === "disliked"
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : currentInteraction === "liked"
                          ? "opacity-50"
                          : "hover:border-muted-foreground hover:text-muted-foreground"
                    }`}
                  >
                    <X className="h-5 w-5" />
                    {currentInteraction === "disliked" ? "Not for me" : "Pass"}
                  </Button>
                </Form>
              </div>

              {/* Feedback Message */}
              {currentInteraction && (
                <div
                  className={`text-center p-3 rounded-lg transition-all duration-300 ${
                    currentInteraction === "liked"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {currentInteraction === "liked"
                      ? "💚 We'll remember you love this style combination!"
                      : "👍 Thanks for the feedback - we'll learn from this!"}
                  </p>
                </div>
              )}

              {/* Feedback Encouragement */}
              {(() => {
                const ratedCount = recommendations.filter(
                  (r) => r.userInteraction
                ).length;
                if (ratedCount >= 1) {
                  return (
                    <div className="text-center p-3 bg-accent rounded-lg border border-border">
                      <p className="text-accent-foreground text-sm">
                        💡 Thanks for the feedback! This helps us learn your
                        style preferences.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Always visible Continue button */}
              <Button
                onClick={handleContinue}
                className="w-full"
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
            </div>
          </CardContent>
        </Card>



        <div className="text-center text-sm text-muted-foreground">
          <p>
            This is just the beginning - your recommendations will get better as
            we learn your style!
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64 mx-auto animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto animate-pulse"></div>
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="text-center">
            <div className="h-6 bg-muted rounded w-48 mx-auto animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="h-6 bg-muted rounded w-40 mx-auto animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-56 mx-auto animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
