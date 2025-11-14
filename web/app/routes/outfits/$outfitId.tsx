import { redirect, useSubmit, Link, useNavigate, useFetcher } from "react-router";
import { useState, Suspense, use, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle, Heart, Trash2, Share2, ArrowLeft, ExternalLink, Check, Calendar } from "lucide-react";
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
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        {/* Mobile: Back button only */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="-ml-2 md:hidden mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {/* Desktop: Breadcrumb only */}
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
              <Suspense fallback={<BreadcrumbPage>Loading...</BreadcrumbPage>}>
                <OutfitBreadcrumbName outfitPromise={loaderData.outfitPromise} />
              </Suspense>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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

function OutfitBreadcrumbName({ outfitPromise }: { outfitPromise: Promise<any> }) {
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
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {isRecommendation
              ? `${outfit.occasion ? outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1) : ""} Outfit`
              : outfit.name || "Untitled Outfit"}
          </h1>
          {(outfit.description || outfit.recommendation_reason) && (
            <p className="text-muted-foreground mt-2">
              {outfit.description || outfit.recommendation_reason}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMarkAsWorn}
            disabled={fetcher.state !== "idle"}
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Wore This Today
          </Button>
          <Button
            variant={outfit.is_favorite ? "default" : "outline"}
            onClick={handleToggleFavorite}
            size="sm"
          >
            <Heart
              className={`h-4 w-4 ${outfit.is_favorite ? "fill-current" : ""}`}
            />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="destructive" onClick={handleDelete} size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item: any) => (
          <Link key={item.id} to={`/wardrobe/${item.id}`}>
            <Card className="overflow-hidden cursor-pointer group">
              <div className="relative">
                <ClothingImageCard
                  filePath={item.image_url}
                  alt={item.name}
                  className="w-full h-40 object-contain bg-muted/30"
                  fallbackClassName="w-full h-40"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {item.primary_color}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle>Outfit Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </CardContent>
      </Card>

      {/* Occasion Context */}
      <Card className="border">
        <CardHeader>
          <CardTitle>Occasion Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Best for:</p>
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
        </CardContent>
      </Card>

      {/* Wear History */}
      {wearHistory.length > 0 && (
        <Card className="border">
          <CardHeader>
            <CardTitle>Wear History</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Similar Outfits */}
      {similarOutfits.length > 0 && (
        <Card className="border">
          <CardHeader>
            <CardTitle>You might also like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarOutfits.map((similar: any) => (
                <Link key={similar.id} to={`/outfits/${similar.id}`}>
                  <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-sm truncate">
                      {similar.name || `${similar.occasion} outfit`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {similar.clothing_item_ids.length} items
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Back Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Link to="/outfits">
          <Button size="lg" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </>
  );
}

function OutfitDetailSkeleton() {
  return (
    <>
      {/* Back Navigation Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-96 animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="w-full h-40 bg-muted animate-pulse" />
            <CardContent className="pt-3">
              <div className="h-4 bg-muted rounded w-20 mb-2 animate-pulse" />
              <div className="h-5 bg-muted rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted rounded w-16 mb-1 animate-pulse" />
              <div className="h-8 bg-muted rounded w-12 animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
