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
type UserProfile = Tables<"user_profiles">;
type OutfitRecommendation = Tables<"outfit_recommendations"> & {
  clothing_items?: Array<{
    id: string;
    name: string;
    image_url: string;
    primary_color: string;
  }>;
};
type OutfitCollection = Tables<"outfit_collections"> & {
  clothing_items?: Array<{
    id: string;
    name: string;
    image_url: string;
    primary_color: string;
  }>;
};
type WardrobeGap = Tables<"wardrobe_gaps">;
type WardrobeAnalytics = {
  avg_sustainability: number | null;
  category_diversity: number | null;
  last_item_added: string | null;
  total_items: number | null;
  total_wears: number | null;
  user_id: string | null;
};

type DailyOutfitData = {
  weather?: {
    temperature: number;
    description: string;
    condition: string;
  } | null;
  recommendations: OutfitRecommendation[];
  hasWeatherMatch: boolean;
  error?: string;
};

type UserInteraction = {
  interaction_type_name: string | null;
};

type DashboardPromises = {
  profilePromise: Promise<UserProfile | null>;
  itemsPromise: Promise<ClothingItem[]>;
  recommendationsPromise: Promise<OutfitRecommendation[]>;
  collectionsPromise: Promise<OutfitCollection[]>;
  gapsPromise: Promise<WardrobeGap[]>;
  analyticsPromise: Promise<WardrobeAnalytics | null>;
  interactionsPromise: Promise<UserInteraction[]>;
  dailyOutfitPromise: Promise<DailyOutfitData>;
};

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

function mapRecommendationToComponent(rec: OutfitRecommendation | any): RecommendationForComponent {
  return {
    id: rec.id,
    name: rec.name || `${rec.occasion_name || 'Daily'} Outfit`,
    description: rec.description || rec.recommendation_reason || 'AI-generated outfit recommendation',
    items: rec.clothing_items || rec.items || [],
    userInteraction: null
  };
}

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
  
  // Return individual promises for streaming
  return loadDashboardData(user.id, request);
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

        <DashboardContent promises={loaderData} />
      </div>
    </div>
  );
}

function DashboardContent({ promises }: { promises: DashboardPromises }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<StatCardSkeleton />}>
          <ItemsStatCard p={promises.itemsPromise} ap={promises.analyticsPromise} />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <RecommendationsStatCard rp={promises.recommendationsPromise} ip={promises.interactionsPromise} />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <WardrobeScoreCard p={promises.analyticsPromise} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<RecentItemsSkeleton />}>
          <RecentItemsCard p={promises.itemsPromise} />
        </Suspense>
        
        <Suspense fallback={<WeatherOutfitSkeleton />}>
          <WeatherOutfitCard p={promises.dailyOutfitPromise} />
        </Suspense>
      </div>
    </>
  );
}

function ItemsStatCard({ p, ap }: { p: Promise<ClothingItem[]>; ap: Promise<WardrobeAnalytics | null> }) {
  const items = use(p);
  const analytics = use(ap);
  
  const totalItems = items?.length || 0;
  const categoryDiversity = analytics?.category_diversity || 
    new Set(items?.map((item: ClothingItem) => item.category_id).filter(Boolean)).size;

  return (
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
  );
}

function RecommendationsStatCard({ rp, ip }: { rp: Promise<OutfitRecommendation[]>; ip: Promise<UserInteraction[]> }) {
  const recommendations = use(rp);
  const interactions = use(ip);
  
  const totalOutfits = recommendations?.length || 0;
  const likedRecommendations = interactions?.filter(interaction => 
    interaction.interaction_type_name === 'liked'
  ).length || 0;

  return (
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
  );
}

function WardrobeScoreCard({ p }: { p: Promise<WardrobeAnalytics | null> }) {
  const analytics = use(p);
  // Calculate wardrobe score from available analytics data
  const wardrobeScore = analytics?.avg_sustainability ? 
    Math.round(analytics.avg_sustainability * 100) : 0;

  return (
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
  );
}

function RecentItemsCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Items</CardTitle>
        <CardDescription>Your latest wardrobe additions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items?.slice(0, 3).map((item: ClothingItem) => (
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
        ))}
        {(!items || items.length === 0) && (
          <p className="text-sm text-muted-foreground">No items yet</p>
        )}
        <Button className="w-full">
          <Link to="/wardrobe/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function WeatherOutfitCard({ p }: { p: Promise<DailyOutfitData> }) {
  const dailyOutfit = use(p);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Outfit</CardTitle>
        <CardDescription>AI-generated based on weather</CardDescription>
      </CardHeader>
      <CardContent>
        {dailyOutfit ? (
          <OutfitRecommendation
            recommendation={mapRecommendationToComponent(dailyOutfit)}
            showInteractions={false}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No outfit generated yet
            </p>
            <Button>
              <Link to="/recommendations">
                Generate Outfit
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

function RecentItemsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeatherOutfitSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-32 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
