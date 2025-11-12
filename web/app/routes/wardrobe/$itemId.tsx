import { useFetcher, useNavigate } from "react-router";
import { Suspense, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Archive } from "lucide-react";
import { ClothingImage } from "@/components/ClothingImage";
import { createClient } from "@/lib/supabase.server";
import type { Route } from "./+types/$itemId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  return {
    itemPromise: (async () => {
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

      return { user, item };
    })(),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  if (request.method === "PUT") {
    const formData = await request.formData();
    const isFavorite = formData.get("isFavorite") === "true";
    const isArchived = formData.get("isArchived") === "true";

    const updateData: { is_favorite?: boolean; is_archived?: boolean } = {};
    if (formData.has("isFavorite")) updateData.is_favorite = isFavorite;
    if (formData.has("isArchived")) updateData.is_archived = isArchived;

    const { error } = await supabase
      .from("clothing_items")
      .update(updateData)
      .eq("id", params.itemId)
      .eq("user_id", user.id);

    if (error) {
      return { 
        success: false,
        error: "Failed to update item" 
      };
    }

    const action = isFavorite ? 'favorited' : 'unfavorited';
    const archiveAction = isArchived ? 'archived' : 'unarchived';
    const message = formData.has("isFavorite") ? 
      `Item ${action} successfully!` : 
      `Item ${archiveAction} successfully!`;
    
    return { 
      success: true,
      message 
    };
  }

  if (request.method === "DELETE") {
    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", params.itemId)
      .eq("user_id", user.id);

    if (error) {
      return { 
        success: false,
        error: "Failed to delete item" 
      };
    }

    return {
      success: true,
      message: "Item deleted successfully!",
      data: { redirect: "/wardrobe" }
    };
  }

  return null;
}

export default function ItemDetailPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetailContent itemPromise={loaderData.itemPromise} />
      </Suspense>
    </div>
  );
}

function ItemDetailContent({ itemPromise }: { itemPromise: Promise<any> }) {
  const { item } = use(itemPromise);
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const handleToggleFavorite = () => {
    const formData = new FormData();
    formData.append("isFavorite", (!item.is_favorite).toString());
    fetcher.submit(formData, { method: "PUT" });
  };

  const handleArchive = () => {
    const formData = new FormData();
    formData.append("isArchived", "true");
    fetcher.submit(formData, { method: "PUT" });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      fetcher.submit({}, { method: "DELETE" });
      setTimeout(() => navigate("/wardrobe"), 500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Image */}
      <div>
        <ClothingImage
          filePath={item.image_url}
          alt={item.name}
          className="w-full h-96 rounded-lg object-contain bg-muted/30"
        />
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="text-muted-foreground text-sm capitalize mt-0.5">
            {item.category?.name}
            {item.subcategory && ` • ${item.subcategory.name}`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{item.brand}</p>
              </div>
            )}
            {item.size && (
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{item.size}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge>{item.primary_color}</Badge>
                {Array.isArray(item.secondary_colors) &&
                  item.secondary_colors.map((color: string) => (
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
                  {item.material.map((mat: string) => (
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
            <div>
              <p className="text-sm text-muted-foreground">Times Worn</p>
              <p className="font-medium">{item.times_worn}</p>
            </div>
          </CardContent>
        </Card>

        {Array.isArray(item.style_tags) && item.style_tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Style Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.style_tags.map((tag: any) => (
                  <Badge key={tag.style_tag?.id || tag.id} variant="outline">
                    {tag.style_tag?.name || tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {item.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{item.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={item.is_favorite ? "default" : "outline"}
            onClick={handleToggleFavorite}
            disabled={fetcher.state !== "idle"}
          >
            <Heart
              className={`mr-2 h-4 w-4 ${item.is_favorite ? "fill-current" : ""}`}
            />
            {item.is_favorite ? "Favorited" : "Add to Favorites"}
          </Button>
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={fetcher.state !== "idle"}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={fetcher.state !== "idle"}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="w-full h-96 bg-muted rounded-lg animate-pulse" />
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-20 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-16 mb-1 animate-pulse" />
                <div className="h-5 bg-muted rounded w-24 animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-muted rounded w-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
