import { useNavigate, Link, useFetcher } from "react-router";
import { Suspense, use, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Heart,
  Trash2,
  Archive,
  ArrowLeft,
  MoreVertical,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClothingImage } from "@/components/ClothingImage";
import { WearHistory } from "@/components/WearHistory";
import { createClient } from "@/lib/supabase.server";
import type { Route } from "./+types/$itemId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  const { data: item, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("id", params.itemId)
    .eq("user_id", user.id)
    .single();

  if (error || !item) {
    throw new Response("Item not found", { status: 404 });
  }

  const imageUrl = item.image_url
    ? await supabase.storage
        .from("clothing")
        .createSignedUrl(item.image_url, 3600)
        .then((result) => result.data?.signedUrl || "")
    : "";

  return {
    itemPromise: Promise.resolve({ user, item, imageUrl }),
    wearHistoryPromise: (async () => {
      const { data, count } = await supabase
        .from("wear_history")
        .select("id, worn_date, created_at, occasion_name, notes, weather", {
          count: "exact",
        })
        .eq("item_id", params.itemId)
        .eq("user_id", user.id)
        .order("worn_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, 9);
      return { history: data || [], totalCount: count || 0 };
    })(),
    relatedItemsPromise: (async () => {
      const { data: item } = await supabase
        .from("clothing_items")
        .select("category_id, primary_color")
        .eq("id", params.itemId)
        .single();

      if (!item) return [];

      const { data } = await supabase
        .from("clothing_items")
        .select("id, name, image_url, primary_color, times_worn")
        .eq("user_id", user.id)
        .neq("id", params.itemId)
        .or(
          `category_id.eq.${item.category_id},primary_color.eq.${item.primary_color}`
        )
        .limit(4);

      const items = data || [];
      return Promise.all(
        items.map(async (relatedItem) => {
          const imageUrl = relatedItem.image_url
            ? await supabase.storage
                .from("clothing")
                .createSignedUrl(relatedItem.image_url, 3600)
                .then((result) => result.data?.signedUrl || "")
            : "";
          return {
            ...relatedItem,
            imageUrl,
          };
        })
      );
    })(),
    outfitsPromise: (async () => {
      const { data } = await supabase
        .from("outfit_collections")
        .select("id, name, clothing_item_ids")
        .eq("user_id", user.id)
        .contains("clothing_item_ids", [params.itemId])
        .limit(3);

      return data || [];
    })(),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  // Only keep DELETE action here since it redirects
  if (request.method === "DELETE") {
    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", params.itemId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: "Failed to delete item",
      };
    }

    return {
      success: true,
      message: "Item deleted successfully!",
      data: { redirect: "/wardrobe" },
    };
  }

  return null;
}

export default function ItemDetailPage({ loaderData }: Route.ComponentProps) {

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
          >
            <Link to="/wardrobe" className='flex items-center'>
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
                  <Link to="/wardrobe">Wardrobe</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Suspense
                  fallback={<BreadcrumbPage>Loading...</BreadcrumbPage>}
                >
                  <BreadcrumbItemName itemPromise={loaderData.itemPromise} />
                </Suspense>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetailContent
          itemPromise={loaderData.itemPromise}
          wearHistoryPromise={loaderData.wearHistoryPromise}
          relatedItemsPromise={loaderData.relatedItemsPromise}
          outfitsPromise={loaderData.outfitsPromise}
        />
      </Suspense>
    </div>
  );
}

function BreadcrumbItemName({ itemPromise }: { itemPromise: Promise<any> }) {
  const { item } = use(itemPromise);
  return <BreadcrumbPage>{item.name}</BreadcrumbPage>;
}

function ItemDetailContent({
  itemPromise,
  wearHistoryPromise,
  relatedItemsPromise,
  outfitsPromise,
}: {
  itemPromise: Promise<any>;
  wearHistoryPromise: Promise<any>;
  relatedItemsPromise: Promise<any>;
  outfitsPromise: Promise<any>;
}) {
  const { item, imageUrl } = use(itemPromise);
  const relatedItems = use(relatedItemsPromise);
  const outfits = use(outfitsPromise);
  const navigate = useNavigate();
  const toast = useToast();
  const hasShownToast = useRef(false);
  const fetcher = useFetcher();

  const daysSinceWorn = item.last_worn_date
    ? Math.floor(
        (Date.now() - new Date(item.last_worn_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const costPerWear =
    item.cost && item.times_worn > 0
      ? (item.cost / item.times_worn).toFixed(2)
      : null;

  useEffect(() => {
    if (fetcher.state === "loading" && fetcher.data && !hasShownToast.current) {
      if (fetcher.data.success && fetcher.data.message) {
        toast.success(fetcher.data.message);
        hasShownToast.current = true;
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
        hasShownToast.current = true;
      }
    }
    if (fetcher.state === "idle") {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toast]);

  const handleMarkAsWorn = () => {
    fetcher.submit(
      {},
      { method: "POST", action: `/api/items/${item.id}/worn` }
    );
  };

  const handleToggleFavorite = () => {
    const formData = new FormData();
    formData.append("isFavorite", (!item.is_favorite).toString());
    fetcher.submit(formData, {
      method: "POST",
      action: `/api/items/${item.id}/favorite`,
    });
  };

  // Optimistic UI state
  const isFavorite =
    fetcher.formData?.get("isFavorite") === "true"
      ? true
      : fetcher.formData?.get("isFavorite") === "false"
        ? false
        : item.is_favorite;

  const handleArchive = () => {
    const formData = new FormData();
    formData.append("isArchived", "true");
    fetcher.submit(formData, {
      method: "POST",
      action: `/api/items/${item.id}/archive`,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      fetcher.submit({}, { method: "DELETE" });
      setTimeout(() => navigate("/wardrobe"), 500);
    }
  };
  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile Hero Section */}
      <div className="relative bg-muted/30 md:hidden">
        <div className="py-12 px-4">
          <Suspense
            fallback={
              <div className="w-full h-[400px] bg-muted animate-pulse" />
            }
          >
            <ClothingImage
              imageUrlPromise={Promise.resolve(imageUrl)}
              alt={item.name}
              className="w-full h-[400px] object-contain"
            />
          </Suspense>
        </div>

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  onClick={handleMarkAsWorn}
                  disabled={fetcher.state !== "idle"}
                  className="shadow-lg"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Wore This Today</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={fetcher.state !== "idle"}
                  className={`shadow-lg bg-background ${isFavorite ? "text-destructive" : ""}`}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shadow-lg bg-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Two-Column Layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 p-6">
        {/* Left: Image */}
        <div className="relative">
          <div className="sticky top-24 bg-muted/30 rounded-lg">
            <Suspense
              fallback={
                <div className="w-full h-[600px] bg-muted animate-pulse" />
              }
            >
              <ClothingImage
                imageUrlPromise={Promise.resolve(imageUrl)}
                alt={item.name}
                className="w-full h-[600px] object-contain"
              />
            </Suspense>
            <div className="absolute top-4 right-4 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleMarkAsWorn}
                      disabled={fetcher.state !== "idle"}
                      className="shadow-lg"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Wore This Today</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleFavorite}
                      disabled={fetcher.state !== "idle"}
                      className={`shadow-lg bg-background ${isFavorite ? "text-destructive" : ""}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isFavorite
                        ? "Remove from Favorites"
                        : "Add to Favorites"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shadow-lg bg-background"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <p className="text-muted-foreground capitalize mt-1">
              {item.brand && `${item.brand} • `}
              {item.category?.name}
              {item.subcategory && ` • ${item.subcategory.name}`}
            </p>
          </div>

          {/* Wear Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-medium">Times Worn</p>
              </div>
              <p className="text-xl font-semibold">{item.times_worn || 0}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-medium">Last Worn</p>
              </div>
              <p className="text-xl font-semibold">
                {daysSinceWorn !== null ? `${daysSinceWorn}d` : "Never"}
              </p>
              {daysSinceWorn !== null && (
                <p className="text-xs text-muted-foreground mt-1">ago</p>
              )}
            </div>
            {item.cost && (
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <p className="text-xs font-medium">Cost/Wear</p>
                </div>
                <p className="text-xl font-semibold">
                  {costPerWear ? `$${costPerWear}` : "$" + item.cost}
                </p>
              </div>
            )}
          </div>
          <Separator />

          {/* Style Tags */}
          {Array.isArray(item.style_tags) && item.style_tags.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {item.style_tags.map((tag: any) => (
                  <Badge key={tag.style_tag?.id || tag.id} variant="secondary">
                    {tag.style_tag?.name || tag.name}
                  </Badge>
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {item.notes && (
            <>
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.notes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Details Grid */}
          <div>
            <h2 className="text-base font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {item.size && (
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{item.size}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge>{item.primary_color}</Badge>
                  {Array.isArray(item.secondary_colors) &&
                    item.secondary_colors.slice(0, 2).map((color: string) => (
                      <Badge key={color} variant="outline">
                        {color}
                      </Badge>
                    ))}
                </div>
              </div>
              {Array.isArray(item.material) && item.material.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.material.slice(0, 2).map((mat: string) => (
                      <Badge key={mat} variant="secondary">
                        {mat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.pattern && (
                <div>
                  <p className="text-sm text-muted-foreground">Pattern</p>
                  <p className="font-medium capitalize">{item.pattern}</p>
                </div>
              )}
            </div>
          </div>
          <Separator />

          {/* Wear History */}
          <Suspense
            fallback={<div className="h-32 bg-muted animate-pulse rounded" />}
          >
            <WearHistory
              wearHistoryPromise={wearHistoryPromise}
              itemId={item.id}
            />
          </Suspense>
          <Separator />

          {/* Outfits featuring this item */}
          {outfits.length > 0 && (
            <>
              <div>
                <h2 className="text-base font-semibold mb-4">
                  Featured in Outfits
                </h2>
                <div className="space-y-2">
                  {outfits.map((outfit: any) => (
                    <Link key={outfit.id} to={`/outfits/${outfit.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{outfit.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {outfit.clothing_item_ids.length} items
                          </p>
                        </div>
                        <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-4">Pairs Well With</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedItems.map((related: any) => (
                  <Link key={related.id} to={`/wardrobe/${related.id}`}>
                    <div className="group cursor-pointer">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 mb-2">
                        <Suspense
                          fallback={
                            <div className="w-full h-full bg-muted animate-pulse" />
                          }
                        >
                          <ClothingImage
                            imageUrlPromise={Promise.resolve(related.imageUrl)}
                            alt={related.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </Suspense>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {related.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Worn {related.times_worn}x
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="px-4 py-6 space-y-6 pb-24 md:hidden">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-muted-foreground capitalize mt-1">
            {item.brand && `${item.brand} • `}
            {item.category?.name}
            {item.subcategory && ` • ${item.subcategory.name}`}
          </p>
        </div>

        {/* Wear Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-medium">Times Worn</p>
            </div>
            <p className="text-xl font-semibold">{item.times_worn || 0}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-medium">Last Worn</p>
            </div>
            <p className="text-xl font-semibold">
              {daysSinceWorn !== null ? `${daysSinceWorn}d` : "Never"}
            </p>
            {daysSinceWorn !== null && (
              <p className="text-xs text-muted-foreground mt-1">ago</p>
            )}
          </div>
          {item.cost && (
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <p className="text-xs font-medium">Cost/Wear</p>
              </div>
              <p className="text-xl font-semibold">
                {costPerWear ? `$${costPerWear}` : "$" + item.cost}
              </p>
            </div>
          )}
        </div>
        <Separator />

        {/* Style Tags */}
        {Array.isArray(item.style_tags) && item.style_tags.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {item.style_tags.map((tag: any) => (
                <Badge key={tag.style_tag?.id || tag.id} variant="secondary">
                  {tag.style_tag?.name || tag.name}
                </Badge>
              ))}
            </div>
            <Separator />
          </>
        )}

        {/* Notes */}
        {item.notes && (
          <>
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.notes}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Details Grid */}
        <div>
          <h2 className="text-base font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {item.size && (
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{item.size}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge>{item.primary_color}</Badge>
                {Array.isArray(item.secondary_colors) &&
                  item.secondary_colors.slice(0, 2).map((color: string) => (
                    <Badge key={color} variant="outline">
                      {color}
                    </Badge>
                  ))}
              </div>
            </div>
            {Array.isArray(item.material) && item.material.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Material</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.material.slice(0, 2).map((mat: string) => (
                    <Badge key={mat} variant="secondary">
                      {mat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {item.pattern && (
              <div>
                <p className="text-sm text-muted-foreground">Pattern</p>
                <p className="font-medium capitalize">{item.pattern}</p>
              </div>
            )}
          </div>
        </div>
        <Separator />

        {/* Wear History */}
        <Suspense
          fallback={<div className="h-32 bg-muted animate-pulse rounded" />}
        >
          <WearHistory
            wearHistoryPromise={wearHistoryPromise}
            itemId={item.id}
          />
        </Suspense>
        <Separator />

        {/* Outfits featuring this item */}
        {outfits.length > 0 && (
          <>
            <div>
              <h2 className="text-base font-semibold mb-4">
                Featured in Outfits
              </h2>
              <div className="space-y-2">
                {outfits.map((outfit: any) => (
                  <Link key={outfit.id} to={`/outfits/${outfit.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{outfit.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {outfit.clothing_item_ids.length} items
                        </p>
                      </div>
                      <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4">Pairs Well With</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedItems.map((related: any) => (
                <Link key={related.id} to={`/wardrobe/${related.id}`}>
                  <div className="group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 mb-2">
                      <Suspense
                        fallback={
                          <div className="w-full h-full bg-muted animate-pulse" />
                        }
                      >
                        <ClothingImage
                          imageUrlPromise={related.imageUrlPromise}
                          alt={related.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </Suspense>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {related.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Worn {related.times_worn}x
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemDetailSkeleton() {
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
      <div className="hidden md:grid md:grid-cols-2 gap-6 p-6">
        <div className="relative">
          <div className="sticky top-24 bg-muted/30 rounded-lg">
            <Skeleton className="w-full h-[600px]" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Separator />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Separator />
          <Skeleton className="h-16 w-full" />
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
