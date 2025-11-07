import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Shirt, Palette, TrendingUp } from "lucide-react";
import { Link, redirect } from "react-router";
import { loadDashboardData } from "@/lib/loaders";
import { ClothingThumbnail } from "@/components/ClothingThumbnail";
import { OutfitRecommendation } from "@/components/OutfitRecommendation";
import { createClient } from '@/lib/supabase.server';
import { Suspense, use } from "react";
import type { Route } from "./+types/_index";
import type { Tables } from "@/lib/database.types";

type ClothingItem = Tables<"clothing_items">;
type OutfitRecommendationType = Tables<"outfit_recommendations">;

// Map database recommendation to component props
type RecommendationForComponent = {
  id: string;
  name: string;
  description: string;
  items?: Array<{
    id: string;
    name: string;
    image_url: string;
  }>;
  userInteraction?: {
    interaction_type_name: 'liked' | 'disliked';
  } | null;
};

function mapRecommendationToComponent(rec: any): RecommendationForComponent {
  // The daily outfit recommendations already have the correct structure
  return {
    id: rec.id,
    name: rec.name || `${rec.occasion_name || 'Daily'} Outfit`,
    description: rec.description || rec.recommendation_reason || 'AI-generated outfit recommendation',
    items: rec.items || [],
    userInteraction: null // TODO: Add user interaction data if available
  };
}
type OutfitRecommendation = Tables<"outfit_recommendations">;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  // Handle auth callback
  if (code) {
    const { createClient } = await import('@/lib/supabase.server');

    const { supabase } = createClient(request);
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return redirect('/onboarding/welcome');
    } else {
      return redirect('/auth/login?error=confirmation_failed');
    }
  }
  
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);
  
  // Check if user has completed onboarding
  const { createClient } = await import('@/lib/supabase.server');
  const { supabase } = createClient(request);
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single();
  
  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    return redirect('/onboarding/welcome');
  }
  
  // Return promises instead of awaited data for faster navigation
  return {
    dashboardPromise: loadDashboardData(user.id, request)
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);
  
  const { supabase } = createClient(request);
  const formData = await request.formData();
  
  const liked = formData.get('liked') === 'true';
  const recommendationId = formData.get('recommendation_id') as string;
  
  if (!recommendationId) {
    throw new Error('Missing recommendation ID');
  }

  // Save interaction
  await supabase
    .from('user_interactions')
    .insert({
      user_id: user.id,
      recommendation_id: recommendationId,
      interaction_type_name: liked ? 'liked' : 'disliked',
    });

  return { success: true };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="text-slate-600 mt-2">
            Here's what's happening with your wardrobe
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent dashboardPromise={loaderData.dashboardPromise} />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardContent({ dashboardPromise }: { dashboardPromise: Promise<any> }) {
  const data = use(dashboardPromise);

  const totalItems = data.items?.length || 0;
  const totalOutfits = data.recommendations?.length || 0;
  const likedRecommendations = data.analytics?.liked_recommendations || 0;
  const wardrobeScore = data.analytics?.recommendation_acceptance_rate || 0;
  const categoryDiversity = data.analytics?.category_diversity || 
    new Set(data.items?.map((item: ClothingItem) => item.category_id).filter(Boolean)).size;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Shirt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {categoryDiversity} categories
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Recommendations
            </CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOutfits}</div>
            <div className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {likedRecommendations} liked
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wardrobe Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(wardrobeScore)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recommendation acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Your latest wardrobe additions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.items?.slice(0, 3).map((item: ClothingItem) => (
              <div key={item.id} className="flex items-center space-x-4">
                <ClothingThumbnail
                  filePath={item.image_url}
                  alt={item.name}
                  className="w-12 h-12 bg-muted rounded-lg"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Added {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground">
                No items yet. Add your first clothing item!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {data.dailyOutfit?.weather ? (
                <>
                  <span className="text-lg">
                    {data.dailyOutfit.weather.condition === 'sunny' ? '☀️' : 
                     data.dailyOutfit.weather.condition === 'cloudy' ? '☁️' :
                     data.dailyOutfit.weather.condition === 'rainy' ? '🌧️' : '🌤️'}
                  </span>
                  Today's Outfit
                </>
              ) : (
                "Today's Outfit Suggestions"
              )}
            </CardTitle>
            <CardDescription>
              {data.dailyOutfit?.weather ? (
                `${data.dailyOutfit.weather.temperature}°C, ${data.dailyOutfit.weather.description}`
              ) : (
                'AI-powered recommendations for you'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.dailyOutfit?.recommendations?.length > 0 ? (
              <>
                {data.dailyOutfit.recommendations.map((rec: OutfitRecommendationType) => (
                  <div key={rec.id} className="space-y-2">
                    <OutfitRecommendation 
                      recommendation={mapRecommendationToComponent(rec)}
                      showInteractions={true}
                    />
                    
                    {data.dailyOutfit?.hasWeatherMatch && (
                      <div className="px-3">
                        <Badge variant="secondary" className="text-xs">
                          {data.dailyOutfit?.isGenerated ? 'Fresh AI pick for today' : 'Perfect for today\'s weather'}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  No recommendations yet
                </p>
                <Button size="sm" variant="outline">
                  <Link to="/wardrobe/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add items to get started
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Today's Outfit Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-40 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-56 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div>
                <div className="h-4 bg-muted rounded w-32 mb-1 animate-pulse" />
                <div className="h-3 bg-muted rounded w-48 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, k) => (
                  <div key={k} className="w-10 h-10 bg-muted rounded border animate-pulse" />
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
