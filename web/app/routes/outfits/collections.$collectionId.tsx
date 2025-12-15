import { Link, useSubmit, redirect, useLocation } from "react-router";
import type { Route } from "./+types/collections.$collectionId";
import { Suspense, use, useState } from "react";
import { createClient } from "@/lib/supabase.server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ClothingImageCard } from "@/components/ClothingImageCard";
import { ArrowLeft, Edit, Trash2, Heart, AlertCircle, ExternalLink } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { supabase } = createClient(request);

  const collectionPromise = (async () => {
    const { data: collection, error } = await supabase
      .from("outfit_collections")
      .select("*")
      .eq("id", params.collectionId)
      .eq("user_id", user.id)
      .single();

    if (error || !collection) throw new Error("Collection not found");

    const { data: items } = await supabase
      .from("clothing_items")
      .select("id, name, image_url, primary_color")
      .in("id", collection.clothing_item_ids)
      .eq("user_id", user.id);

    return { ...collection, clothing_items: items || [] };
  })();

  return { collectionPromise };
}

function CollectionBreadcrumbName({
  collectionPromise,
}: {
  collectionPromise: Promise<any>;
}) {
  const collection = use(collectionPromise);
  return <BreadcrumbPage>{collection.name}</BreadcrumbPage>;
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "delete") {
    const { error } = await supabase
      .from("outfit_collections")
      .delete()
      .eq("id", params.collectionId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return redirect("/outfits?tab=collections");
  }

  if (actionType === "toggle_favorite") {
    const isFavorite = formData.get("is_favorite") === "true";
    const { error } = await supabase
      .from("outfit_collections")
      .update({ is_favorite: !isFavorite })
      .eq("id", params.collectionId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return { success: true };
  }

  return null;
}

export default function CollectionDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const submit = useSubmit();
  const location = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const backTo = location.state?.from || "/outfits?tab=collections";

  const handleDelete = () => {
    const formData = new FormData();
    formData.append("action", "delete");
    submit(formData, { method: "post" });
  };

  const handleToggleFavorite = (isFavorite: boolean) => {
    const formData = new FormData();
    formData.append("action", "toggle_favorite");
    formData.append("is_favorite", isFavorite.toString());
    submit(formData, { method: "post" });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" asChild>
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
                  <Link to="/outfits?tab=collections">Collections</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Suspense fallback={<BreadcrumbPage>Loading...</BreadcrumbPage>}>
                  <CollectionBreadcrumbName
                    collectionPromise={loaderData.collectionPromise}
                  />
                </Suspense>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {actionData?.error && (
        <Alert variant="destructive" className="max-w-6xl mx-auto mt-4 mx-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <Suspense fallback={<CollectionDetailSkeleton />}>
        <CollectionDetail
          collectionPromise={loaderData.collectionPromise}
          onToggleFavorite={handleToggleFavorite}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      </Suspense>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle id="delete-dialog-title">Delete Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this collection? This action
                cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function CollectionDetail({
  collectionPromise,
  onToggleFavorite,
  onDelete,
}: {
  collectionPromise: Promise<any>;
  onToggleFavorite: (isFavorite: boolean) => void;
  onDelete: () => void;
}) {
  const collection = use(collectionPromise);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold">{collection.name}</h1>
        <nav className="flex gap-2" aria-label="Collection actions">
          <Button
            variant={collection.is_favorite ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFavorite(collection.is_favorite)}
            aria-label={collection.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${collection.is_favorite ? "fill-current" : ""}`}
            />
          </Button>
          <Link to={`/outfits/collections/${collection.id}/edit`}>
            <Button variant="outline" size="sm" aria-label="Edit collection">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={onDelete} aria-label="Delete collection">
            <Trash2 className="h-4 w-4" />
          </Button>
        </nav>
      </div>
      
      {collection.description && (
        <p className="text-sm text-muted-foreground mb-6">
          {collection.description}
        </p>
      )}

      <div className="space-y-6">
        {/* Items Section */}
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="text-lg font-semibold mb-4">Items in this collection</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collection.clothing_items.map((item: any) => (
              <Link
                key={item.id}
                to={`/wardrobe/${item.id}`}
                state={{ from: `/outfits/collections/${collection.id}` }}
              >
                <article className="bg-muted/30 rounded-lg overflow-hidden cursor-pointer group hover:bg-muted/50 transition-colors">
                  <figure className="relative">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-40 object-contain bg-background"
                      fallbackClassName="w-full h-40"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </figure>
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

        {/* Stats Section */}
        <section className="bg-muted/30 rounded-lg p-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-lg font-semibold mb-4">Collection Stats</h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Items</dt>
              <dd className="text-2xl font-bold">{collection.clothing_item_ids?.length || 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Times Worn</dt>
              <dd className="text-2xl font-bold">{collection.times_worn || 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="text-lg font-semibold">
                {new Date(collection.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 bg-muted rounded w-96 animate-pulse mb-6" />

      <div className="space-y-6">
        {/* Items section skeleton */}
        <section>
          <div className="h-6 bg-muted rounded w-48 animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <article key={i} className="bg-muted/30 rounded-lg overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Stats section skeleton */}
        <section className="bg-muted/30 rounded-lg p-6">
          <div className="h-6 bg-muted rounded w-36 animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-16 animate-pulse mb-2" />
                <div className="h-8 bg-muted rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
