import {
  redirect,
  useSubmit,
  Link,
  useFetcher,
  useLocation,
} from "react-router";
import { useState, Suspense, use, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Trash2,
  Share2,
  ArrowLeft,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { WearTrackingButton } from "@/components/shared/WearTrackingButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ClothingImageCard } from "@/components/ClothingImageCard";
import type { Route } from "./+types/$outfitId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  if (!params.outfitId) {
    throw new Error("Outfit ID is required");
  }

  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  return {
    outfitPromise: (async () => {
      // Try to find in collections first
      let { data: outfit, error: collectionError } = await supabase
        .from("outfit_collections")
        .select("*")
        .eq("id", params.outfitId)
        .eq("user_id", user.id)
        .single();

      let isRecommendation = false;

      // If not found in collections, try recommendations
      if (collectionError) {
        const { data: recData, error: recError } = await supabase
          .from("outfit_recommendations")
          .select("*")
          .eq("id", params.outfitId)
          .eq("user_id", user.id)
          .single();

        if (recError) {
          throw new Response("Outfit not found", { status: 404 });
        }

        outfit = recData;
        isRecommendation = true;
      }

      // Fetch clothing items with cost data
      const { data: items } = await supabase
        .from("clothing_items")
        .select(
          "id, name, image_url, primary_color, category_id, cost, times_worn, created_at"
        )
        .in("id", outfit.clothing_item_ids)
        .eq("user_id", user.id);

      // Find similar outfits (same category items or similar occasions)
      const { data: similarOutfits } = await supabase
        .from(
          isRecommendation ? "outfit_recommendations" : "outfit_collections"
        )
        .select("id, name, occasion, clothing_item_ids")
        .eq("user_id", user.id)
        .neq("id", params.outfitId)
        .limit(3);

      // Calculate total cost and cost per wear
      const totalCost =
        items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
      const costPerWear =
        outfit.times_worn > 0 ? totalCost / outfit.times_worn : totalCost;

      return {
        outfit,
        items: items || [],
        isRecommendation,
        similarOutfits: similarOutfits || [],
        totalCost,
        costPerWear,
      };
    })(),
    wearHistoryPromise: (async () => {
      const { data } = await supabase
        .from("wear_history")
        .select("id, worn_date, occasion_name, notes")
        .eq("outfit_id", params.outfitId)
        .eq("user_id", user.id)
        .order("worn_date", { ascending: false })
        .limit(5);
      return data || [];
    })(),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  if (request.method === "POST") {
    const { error } = await supabase.rpc("mark_outfit_worn", {
      p_outfit_id: params.outfitId,
    });

    if (error) {
      return {
        success: false,
        error: "Failed to mark outfit as worn",
      };
    }

    return {
      success: true,
      message: "Outfit marked as worn today!",
    };
  }

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "toggle_favorite") {
    const isFavorite = formData.get("is_favorite") === "true";
    await supabase
      .from("outfit_collections")
      .update({ is_favorite: !isFavorite })
      .eq("id", params.outfitId)
      .eq("user_id", user.id);
  } else if (action === "delete") {
    await supabase
      .from("outfit_collections")
      .delete()
      .eq("id", params.outfitId)
      .eq("user_id", user.id);

    return redirect("/outfits");
  }

  return { success: true };
}

export default function OutfitDetailPage({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const backTo = location.state?.from || "/outfits";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm">
            <Link to={backTo} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/outfits">Outfits</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Suspense
                  fallback={<BreadcrumbPage>Loading...</BreadcrumbPage>}
                >
                  <OutfitBreadcrumbName
                    outfitPromise={loaderData.outfitPromise}
                  />
                </Suspense>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <Suspense fallback={<OutfitDetailSkeleton />}>
        <OutfitDetailContent
          outfitPromise={loaderData.outfitPromise}
          wearHistoryPromise={loaderData.wearHistoryPromise}
        />
      </Suspense>
    </div>
  );
}

function OutfitBreadcrumbName({
  outfitPromise,
}: {
  outfitPromise: Promise<any>;
}) {
  const { outfit, isRecommendation } = use(outfitPromise);
  const name = isRecommendation
    ? `${outfit.occasion_name ? outfit.occasion_name.charAt(0).toUpperCase() + outfit.occasion_name.slice(1) : ""} Outfit`
    : outfit.name || "Untitled Outfit";
  return <BreadcrumbPage>{name}</BreadcrumbPage>;
}

function OutfitDetailContent({
  outfitPromise,
  wearHistoryPromise,
}: {
  outfitPromise: Promise<any>;
  wearHistoryPromise: Promise<any>;
}) {
  const submit = useSubmit();
  const fetcher = useFetcher();
  const toast = useToast();
  const hasShownToast = useRef(false);
  const {
    outfit,
    items,
    isRecommendation,
    similarOutfits,
    totalCost,
    costPerWear,
  } = use(outfitPromise);
  const wearHistory = use(wearHistoryPromise);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if (fetcher.data.success && fetcher.data.message) {
        toast.success(fetcher.data.message);
        hasShownToast.current = true;
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
        hasShownToast.current = true;
      }
    }
    if (fetcher.state === "idle" && hasShownToast.current) {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toast]);

  const handleMarkAsWorn = () => {
    fetcher.submit({}, { method: "POST" });
  };

  const handleToggleFavorite = () => {
    submit(
      { action: "toggle_favorite", is_favorite: outfit.is_favorite.toString() },
      { method: "POST" }
    );
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this outfit?")) return;
    submit({ action: "delete" }, { method: "POST" });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mobile Hero Section */}
      <div className="relative bg-muted/30 md:hidden">
        <div className="py-12 px-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold mb-2">
              {isRecommendation
                ? `${outfit.occasion ? outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1) : ""} Outfit`
                : outfit.name || "Untitled Outfit"}
            </h1>
            {(outfit.description || outfit.recommendation_reason) && (
              <p className="text-sm text-muted-foreground">
                {outfit.description || outfit.recommendation_reason}
              </p>
            )}
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <WearTrackingButton
            onMarkAsWorn={handleMarkAsWorn}
            disabled={fetcher.state !== "idle"}
            variant="mobile"
          />
          <FavoriteButton
            onToggleFavorite={handleToggleFavorite}
            isFavorite={outfit.is_favorite}
            variant="mobile"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shadow-lg bg-background"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Outfit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  size="icon"
                  className="shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Outfit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block p-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold">
            {isRecommendation
              ? `${outfit.occasion ? outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1) : ""} Outfit`
              : outfit.name || "Untitled Outfit"}
          </h1>
          <div className="flex gap-2">
            <WearTrackingButton
              onMarkAsWorn={handleMarkAsWorn}
              disabled={fetcher.state !== "idle"}
              variant="desktop"
            />
            <FavoriteButton
              onToggleFavorite={handleToggleFavorite}
              isFavorite={outfit.is_favorite}
              variant="desktop"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share Outfit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Outfit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {(outfit.description || outfit.recommendation_reason) && (
          <p className="text-sm text-muted-foreground mb-6">
            {outfit.description || outfit.recommendation_reason}
          </p>
        )}

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Items in this outfit</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/wardrobe/${item.id}`}
                  state={{ from: `/outfits/${outfit.id}` }}
                >
                  <article className="bg-muted/30 rounded-lg overflow-hidden cursor-pointer group hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <ClothingImageCard
                        filePath={item.image_url}
                        alt={item.name}
                        className="w-full h-40 object-contain bg-background"
                        fallbackClassName="w-full h-40"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">
                        {item.name}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-2">
                        {item.primary_color}
                      </Badge>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Outfit Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Times Worn</p>
                <p className="text-2xl font-bold">{outfit.times_worn || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost per Wear</p>
                <p className="text-2xl font-bold">
                  {outfit.times_worn > 0 ? `$${costPerWear.toFixed(0)}` : "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Occasion Context</h2>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Best for:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {outfit.occasion || "Any occasion"}
                </Badge>
                {outfit.mood && (
                  <Badge variant="outline" className="capitalize">
                    {outfit.mood} mood
                  </Badge>
                )}
                {outfit.activity_level && (
                  <Badge variant="outline" className="capitalize">
                    {outfit.activity_level} activity
                  </Badge>
                )}
              </div>
            </div>
          </section>

          {wearHistory.length > 0 && (
            <section className="bg-muted/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Wear History</h2>
              <div className="space-y-2">
                {wearHistory.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(entry.worn_date).toLocaleDateString()}
                    </span>
                    {entry.occasion_name && (
                      <Badge variant="outline" className="text-xs">
                        {entry.occasion_name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {similarOutfits.length > 0 && (
            <section className="bg-muted/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                You might also like
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarOutfits.map((similar: any) => (
                  <Link key={similar.id} to={`/outfits/${similar.id}`}>
                    <article className="bg-background rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <p className="font-medium text-sm truncate">
                        {similar.name || `${similar.occasion} outfit`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {similar.clothing_item_ids.length} items
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="px-4 py-6 space-y-6 pb-24 md:hidden">
        <section>
          <h2 className="text-lg font-semibold mb-4">Items in this outfit</h2>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item: any) => (
              <Link
                key={item.id}
                to={`/wardrobe/${item.id}`}
                state={{ from: `/outfits/${outfit.id}` }}
              >
                <article className="bg-muted/30 rounded-lg overflow-hidden cursor-pointer group hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-32 object-contain bg-background"
                      fallbackClassName="w-full h-32"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {item.primary_color}
                    </Badge>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Outfit Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Times Worn</p>
              <p className="text-2xl font-bold">{outfit.times_worn || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost per Wear</p>
              <p className="text-2xl font-bold">
                {outfit.times_worn > 0 ? `$${costPerWear.toFixed(0)}` : "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Occasion Context</h2>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Best for:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {outfit.occasion || "Any occasion"}
              </Badge>
              {outfit.mood && (
                <Badge variant="outline" className="capitalize">
                  {outfit.mood} mood
                </Badge>
              )}
              {outfit.activity_level && (
                <Badge variant="outline" className="capitalize">
                  {outfit.activity_level} activity
                </Badge>
              )}
            </div>
          </div>
        </section>

        {wearHistory.length > 0 && (
          <section className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Wear History</h2>
            <div className="space-y-2">
              {wearHistory.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(entry.worn_date).toLocaleDateString()}</span>
                  {entry.occasion_name && (
                    <Badge variant="outline" className="text-xs">
                      {entry.occasion_name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {similarOutfits.length > 0 && (
          <section className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">You might also like</h2>
            <div className="space-y-4">
              {similarOutfits.map((similar: any) => (
                <Link key={similar.id} to={`/outfits/${similar.id}`}>
                  <article className="bg-background rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-sm truncate">
                      {similar.name || `${similar.occasion} outfit`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {similar.clothing_item_ids.length} items
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OutfitDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile Skeleton */}
      <div className="md:hidden">
        <div className="relative bg-muted/30">
          <div className="py-12 px-4">
            <Skeleton className="w-full h-[400px]" />
          </div>
        </div>
        <div className="px-4 py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Separator />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Separator />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block p-6">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-6" />

        <div className="space-y-6">
          <section>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted/30 rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-40" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
