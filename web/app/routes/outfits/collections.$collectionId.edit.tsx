import { useFormik } from "formik";
import { useSubmit, redirect, Link } from "react-router";
import type { Route } from "./+types/collections.$collectionId.edit";
import React, { useState, Suspense, use } from "react";
import { loadClothingItems } from "@/lib/loaders";
import { createClient } from "@/lib/supabase.server";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClothingImage, getImageUrl } from "@/components/ClothingImage";
import { ArrowLeft, AlertCircle } from "lucide-react";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

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
    return collection;
  })();

  return {
    collectionPromise,
    itemsPromise: loadClothingItems(user.id, request),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const selectedItems = JSON.parse(formData.get("selectedItems") as string);

  const { error } = await supabase
    .from("outfit_collections")
    .update({
      name,
      description: description || null,
      clothing_item_ids: selectedItems,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.collectionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return redirect(`/outfits/collections/${params.collectionId}`);
}

export default function EditCollectionPage({
  actionData,
  loaderData,
  params,
}: Route.ComponentProps) {
  const submit = useSubmit();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to={`/outfits/collections/${params.collectionId}`}
          className="inline-flex items-center text-muted-foreground hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Link>
        <h1 className="text-3xl font-bold">Edit Collection</h1>
        <p className="text-muted-foreground mt-1">
          Update your outfit collection
        </p>
      </div>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <Suspense fallback={<EditFormSkeleton />}>
        <EditForm
          collectionPromise={loaderData.collectionPromise}
          itemsPromise={loaderData.itemsPromise}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onSubmit={(values) => {
            if (selectedItems.length === 0) {
              alert("Please select at least one item");
              return;
            }

            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("description", values.description);
            formData.append("selectedItems", JSON.stringify(selectedItems));
            submit(formData, { method: "post" });
          }}
        />
      </Suspense>
    </div>
  );
}

function EditForm({
  collectionPromise,
  itemsPromise,
  selectedItems,
  setSelectedItems,
  onSubmit,
}: {
  collectionPromise: Promise<any>;
  itemsPromise: Promise<any>;
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (values: any) => void;
}) {
  const collection = use(collectionPromise);
  const items = use(itemsPromise);

  const formik = useFormik({
    initialValues: {
      name: collection.name,
      description: collection.description || "",
    },
    validationSchema: toFormikValidationSchema(collectionSchema),
    onSubmit,
  });

  // Initialize selected items
  React.useEffect(() => {
    setSelectedItems(collection.clothing_item_ids || []);
  }, [collection.clothing_item_ids, setSelectedItems]);

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Casual"
                  {...formik.getFieldProps("name")}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">
                    {String(formik.errors.name)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Add notes about this outfit..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  {...formik.getFieldProps("description")}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedItems.length} item(s) selected
              </div>

              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full"
              >
                {formik.isSubmitting ? "Updating..." : "Update Collection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Items</CardTitle>
            <CardDescription>
              Click items to add or remove them from your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items in your wardrobe yet. Add some items first.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`relative rounded-lg overflow-hidden transition-all ${
                      selectedItems.includes(item.id)
                        ? "ring-2 ring-blue-500 scale-95"
                        : "hover:shadow-lg"
                    }`}
                  >
                    <ClothingImage
                      imageUrlPromise={getImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                    {selectedItems.includes(item.id) && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditFormSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
              <div className="h-20 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden">
                  <div className="w-full h-32 bg-slate-200 animate-pulse" />
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-300 h-6 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
