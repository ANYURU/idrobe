import { Button } from "@/components/ui/button";
import {
  Shirt,
  TrendingUp,
  Sparkles,
  Star,
  AlertCircle,
  DollarSign,
  Activity,
  ArrowRight,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { Link, redirect, useSearchParams, useNavigate } from "react-router";
import { loadDashboardData } from "@/lib/loaders";
import { ClothingThumbnail } from "@/components/ClothingThumbnail";
import { OutfitRecommendation } from "@/components/OutfitRecommendation";
import { createClient } from "@/lib/supabase.server";
import { Suspense, use, useEffect, useRef } from "react";
import type { Route } from "./+types/_index";
import type { Tables } from "@/lib/database.types";
import { useToast } from "@/lib/use-toast";

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
    interaction_type_name: "liked" | "disliked";
  } | null;
};

function mapRecommendationToComponent(
  rec: OutfitRecommendation | any
): RecommendationForComponent {
  return {
    id: rec.id,
    name: rec.name || `${rec.occasion_name || "Daily"} Outfit`,
    description:
      rec.description ||
      rec.recommendation_reason ||
      "AI-generated outfit recommendation",
    items: rec.items || rec.clothing_items || [],
    userInteraction: null,
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Handle auth callback
  if (code) {
    const { createClient } = await import("@/lib/supabase.server");

    const { supabase } = createClient(request);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect("/onboarding/welcome");
    } else {
      return redirect("/auth/login?error=confirmation_failed");
    }
  }

  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  // Check if user has completed onboarding
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .single();

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    return redirect("/onboarding/welcome");
  }

  // Return individual promises for streaming
  return loadDashboardData(user.id, request);
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

  // Save interaction
  await supabase.from("user_interactions").insert({
    user_id: user.id,
    recommendation_id: recommendationId,
    interaction_type_name: liked ? "liked" : "disliked",
  });

  return { success: true };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (searchParams.get("login") === "success" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    }
    if (searchParams.get("recovery") === "success" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success("Account recovered successfully!");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  return (
    <main className="@container/main px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <DashboardContent promises={loaderData} />
    </main>
  );
}

function DashboardContent({ promises }: { promises: DashboardPromises }) {
  return (
    <>
      <header className="mb-2">
        <h1 className="text-xl font-semibold">Welcome back!</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here's what's happening with your wardrobe
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Wardrobe statistics">
        <Suspense fallback={<StatCardSkeleton />}>
          <TopPerformerCard p={promises.itemsPromise} />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <UnderutilizedCard p={promises.itemsPromise} />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <BestValueCard p={promises.itemsPromise} />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <WardrobeHealthCard p={promises.itemsPromise} />
        </Suspense>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Recent activity">
        <Suspense fallback={<RecentItemsSkeleton />}>
          <RecentItemsCard p={promises.itemsPromise} />
        </Suspense>

        <Suspense fallback={<WeatherOutfitSkeleton />}>
          <WeatherOutfitCard p={promises.dailyOutfitPromise} />
        </Suspense>
      </section>
    </>
  );
}

function TopPerformerCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);
  const topItem = items
    ?.filter(item => (item.times_worn || 0) > 0)
    .sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0))[0];

  return (
    <article className="bg-linear-to-br from-muted/20 to-muted/40 border border-border/50 rounded-lg p-4 relative">
      <div className="absolute top-2 right-2">
        <Star className="h-4 w-4 text-primary fill-current" />
      </div>
      <header className="flex items-center gap-2 text-muted-foreground mb-3">
        <TrendingUp className="h-4 w-4" />
        <h3 className="text-xs font-medium uppercase tracking-wide">Top Performer</h3>
      </header>
      <div className="space-y-3">
        <p className="text-lg font-bold truncate">
          {topItem?.name || 'No items worn yet'}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">
            {topItem ? topItem.times_worn : '0'}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {topItem ? 'wears' : 'start tracking'}
          </p>
        </div>
      </div>
    </article>
  );
}

function UnderutilizedCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);
  const underutilized = items?.filter(item => 
    (item.times_worn || 0) === 0 && 
    new Date(item.created_at || '').getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000)
  ).length || 0;

  const hasIssues = underutilized > 0;

  return (
    <article className={`bg-linear-to-br from-muted/20 to-muted/40 border rounded-lg p-4 relative ${
      hasIssues ? 'border-destructive/30' : 'border-border/50'
    }`}>
      <div className="absolute top-2 right-2">
        {hasIssues ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Activity className="h-4 w-4 text-primary" />
        )}
      </div>
      <header className="flex items-center gap-2 text-muted-foreground mb-3">
        <Shirt className="h-4 w-4" />
        <h3 className="text-xs font-medium uppercase tracking-wide">Underutilized</h3>
      </header>
      <div className="space-y-3">
        <p className="text-3xl font-bold">
          {underutilized}
        </p>
        <p className="text-sm font-medium">
          {hasIssues ? 'Items never worn' : 'All items used!'}
        </p>
        {hasIssues && (
          <Button size="sm" className="text-xs h-7" asChild>
            <Link to="/wardrobe/analytics" className="flex items-center gap-1">
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function BestValueCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);
  const bestValue = items
    ?.filter(item => (item.times_worn || 0) > 0 && item.cost)
    .map(item => ({ ...item, costPerWear: item.cost! / item.times_worn! }))
    .sort((a, b) => a.costPerWear - b.costPerWear)[0];

  return (
    <article className="bg-linear-to-br from-muted/20 to-muted/40 border border-border/50 rounded-lg p-4 relative">
      <div className="absolute top-2 right-2">
        <DollarSign className="h-4 w-4 text-primary" />
      </div>
      <header className="flex items-center gap-2 text-muted-foreground mb-3">
        <TrendingUp className="h-4 w-4" />
        <h3 className="text-xs font-medium uppercase tracking-wide">Best Value</h3>
      </header>
      <div className="space-y-3">
        <p className="text-sm font-bold truncate">
          {bestValue?.name || 'Add item costs'}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold">
            {bestValue ? `$${bestValue.costPerWear.toFixed(2)}` : '—'}
          </p>
          {bestValue && (
            <p className="text-xs text-muted-foreground font-medium">
              per wear
            </p>
          )}
        </div>
        {!bestValue && (
          <Button size="sm" className="text-xs h-7" asChild>
            <Link to="/wardrobe" className="flex items-center gap-1">
              Add costs <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function WardrobeHealthCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);
  const totalItems = items?.length || 0;
  const wornItems = items?.filter(item => (item.times_worn || 0) > 0).length || 0;
  const healthScore = totalItems > 0 ? Math.round((wornItems / totalItems) * 100) : 0;

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { icon: CheckCircle, color: 'text-primary', status: 'Excellent' };
    if (score >= 60) return { icon: Activity, color: 'text-primary', status: 'Good' };
    if (score >= 40) return { icon: TrendingDown, color: 'text-destructive', status: 'Needs attention' };
    return { icon: AlertCircle, color: 'text-destructive', status: 'Poor' };
  };

  const { icon: StatusIcon, color } = getHealthStatus(healthScore);
  const needsImprovement = healthScore < 70;

  return (
    <article className="bg-linear-to-br from-muted/20 to-muted/40 border border-border/50 rounded-lg p-4 relative">
      <div className="absolute top-2 right-2">
        <StatusIcon className={`h-4 w-4 ${color} ${healthScore >= 80 ? 'fill-current' : ''}`} />
      </div>
      <header className="flex items-center gap-2 text-muted-foreground mb-3">
        <Activity className="h-4 w-4" />
        <h3 className="text-xs font-medium uppercase tracking-wide">Wardrobe Health</h3>
      </header>
      <div className="space-y-3">
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-bold">
            {healthScore}
          </p>
          <p className="text-lg font-semibold text-muted-foreground">%</p>
        </div>
        <p className="text-sm font-medium">
          {wornItems} of {totalItems} items worn
        </p>
        {needsImprovement && (
          <Button size="sm" className="text-xs h-7" asChild>
            <Link to="/wardrobe/analytics" className="flex items-center gap-1">
              Improve <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function RecentItemsCard({ p }: { p: Promise<ClothingItem[]> }) {
  const items = use(p);
  const recentItems = items?.slice(0, 3) || [];

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Recent Items</h2>
          <p className="text-sm text-muted-foreground">Your latest wardrobe additions</p>
        </div>
        {recentItems.length > 0 && (
          <Button size="sm" asChild>
            <Link to="/wardrobe" className="flex items-center gap-1 text-xs">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {recentItems.map((item: ClothingItem) => (
          <Link 
            key={item.id} 
            to={`/wardrobe/${item.id}`}
            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-background/50 transition-colors group"
          >
            <ClothingThumbnail
              filePath={item.image_url}
              alt={item.name}
              className="w-12 h-12 bg-background rounded-lg ring-1 ring-border"
            />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Added {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
        {recentItems.length === 0 && (
          <div className="text-center py-8">
            <Shirt className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No items yet</p>
            <Button size="sm" asChild>
              <Link to="/wardrobe/add">Add Your First Item</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function WeatherOutfitCard({ p }: { p: Promise<DailyOutfitData> }) {
  const dailyOutfitData = use(p);
  const recommendation = dailyOutfitData?.recommendations?.[0];
  const hasError = dailyOutfitData?.error;

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-1">Today's Outfit</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {dailyOutfitData?.weather
          ? `Perfect for ${dailyOutfitData.weather.description}, ${dailyOutfitData.weather.temperature}°C`
          : "AI-curated for your day"}
      </p>
      <div>
        {recommendation ? (
          <OutfitRecommendation
            recommendation={mapRecommendationToComponent(recommendation)}
            showInteractions={false}
          />
        ) : (
          <div className="text-center py-8 space-y-4">
            {hasError ? (
              <>
                <div className="text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                </div>
                <div>
                  <p className="font-medium mb-1">
                    Let's create your perfect look!
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Having trouble generating today's outfit. Try adding more
                    items or create one manually.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm">
                    <Link to="/outfits">Generate Outfit</Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Link to="/wardrobe/add">Add Items</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                </div>
                <div>
                  <p className="font-medium mb-1">Ready to get styled?</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Let our AI create the perfect outfit for your day
                  </p>
                </div>
                <Button>
                  <Link to="/outfits">Create Today's Look</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-6 w-20 bg-muted animate-pulse rounded mb-1" />
      <div className="h-4 w-16 bg-muted animate-pulse rounded mb-1" />
      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
    </div>
  );
}

function RecentItemsSkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherOutfitSkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="space-y-4">
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}