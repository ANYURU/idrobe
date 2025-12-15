import { useFormik } from "formik";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/collections.$collectionId.edit";
import { useState, Suspense, use, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useActionWithToast } from "@/hooks/use-action-with-toast";
import type { Tables } from "@/lib/database.types";

type ClothingItem = {
  id: string;
  name: string;
  image_url: string;
  primary_color: string;
  category?: { name: string }[] | { name: string } | null;
  subcategory?: { name: string }[] | { name: string } | null;
};

type OutfitCollection = Tables<"outfit_collections">;

import { createClient } from "@/lib/supabase.server";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { collectionSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClothingImage, getImageUrl } from "@/components/ClothingImage";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowLeft } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { supabase } = createClient(request);

  // Get the collection
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

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";

  // Get category ID if filtering by category
  let categoryId = null;
  if (category && category !== "all") {
    const { data: categoryData } = await supabase
      .from("clothing_categories")
      .select("id")
      .eq("name", category)
      .single();
    categoryId = categoryData?.id;
  }

  // Build filtered query
  let itemsQuery = supabase
    .from("clothing_items")
    .select(
      `
      id,
      name,
      image_url,
      primary_color,
      category:clothing_categories(name),
      subcategory:clothing_subcategories(name)
    `
    )
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (categoryId) {
    itemsQuery = itemsQuery.eq("category_id", categoryId);
  }

  if (search) {
    itemsQuery = itemsQuery.or(
      `name.ilike.%${search}%,primary_color.ilike.%${search}%`
    );
  }

  // Get unique categories from user's items
  const { data: categoriesData } = await supabase
    .from("clothing_items")
    .select("category:clothing_categories(name)")
    .eq("user_id", user.id)
    .not("category", "is", null);

  const categories = [
    ...new Set(
      categoriesData
        ?.map((item) => {
          const category = item.category as { name: string }[] | { name: string } | null;
          return Array.isArray(category) ? category[0]?.name : category?.name;
        })
        .filter(Boolean) || []
    ),
  ].sort() as string[];

  const itemsResult = await itemsQuery;

  return {
    collectionPromise,
    itemsPromise: Promise.resolve(itemsResult),
    categories,
    filters: { search, category },
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

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Collection "${name}" updated successfully!`,
    data: { redirect: `/outfits/collections/${params.collectionId}` },
  };
}

export default function EditCollectionPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { submit, isSubmitting, data } = useActionWithToast<{
    redirect?: string;
  }>();

  // Handle successful update with redirect
  useEffect(() => {
    if (data?.redirect) {
      navigate(data.redirect);
    }
  }, [data, navigate]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <Link
          to={`/outfits/collections/${params.collectionId}`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Link>
        <h1 className="text-2xl font-bold">Edit Collection</h1>
        <p className="text-muted-foreground mt-1">
          Update your collection details and items
        </p>
      </header>

      <Suspense fallback={<EditFormSkeleton />}>
        <EditFormContent
          collectionPromise={loaderData.collectionPromise}
          itemsPromise={loaderData.itemsPromise}
          categories={loaderData.categories}
          collectionId={params.collectionId}
          submit={submit}
          isSubmitting={isSubmitting}
          navigate={navigate}
        />
      </Suspense>
    </main>
  );
}

function EditFormContent({
  collectionPromise,
  itemsPromise,
  categories,
  collectionId,
  submit,
  isSubmitting,
  navigate,
}: {
  collectionPromise: Promise<OutfitCollection>;
  itemsPromise: Promise<{ data: ClothingItem[] | null; error: any }>;
  categories: string[];
  collectionId: string;
  submit: (data: Record<string, string>) => void;
  isSubmitting: boolean;
  navigate: (path: string) => void;
}) {
  const collection = use(collectionPromise);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    collection.clothing_item_ids || []
  );
  const [showItemModal, setShowItemModal] = useState(false);
  const [hasClosedModal, setHasClosedModal] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: collection.name || "",
      description: collection.description || "",
    },
    validationSchema: toFormikValidationSchema(collectionSchema),
    onSubmit: (values) => {
      submit({
        name: values.name,
        description: values.description,
        selectedItems: JSON.stringify(selectedItems),
      });
    },
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <>
      <section className="bg-muted/30 rounded-lg p-6">
        <header className="mb-6">
          <h2 className="text-lg font-semibold">Collection Details</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Update your collection name, description or items
          </p>
        </header>
        <div>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Casual, Work Outfits"
                  className="bg-background"
                  {...formik.getFieldProps("name")}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">{String(formik.errors.name)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Perfect for warm weather, office meetings, casual dates..."
                  rows={3}
                  className="bg-background"
                  {...formik.getFieldProps("description")}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-sm text-red-500">
                    {String(formik.errors.description)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Items *</Label>
                <div className="bg-background border rounded-lg p-4 min-h-[100px]">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">
                        No items selected yet
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowItemModal(true)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Items
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedItems.length} item
                            {selectedItems.length !== 1 ? "s" : ""}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            selected
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowItemModal(true)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add More
                        </Button>
                      </div>
                      <Suspense fallback={<div>Loading preview...</div>}>
                        <SelectedItemsPreview
                          itemsPromise={itemsPromise}
                          selectedItems={selectedItems}
                          toggleItem={toggleItem}
                          onOpenModal={() => setShowItemModal(true)}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
                {selectedItems.length === 0 &&
                  (hasClosedModal || formik.submitCount > 0) && (
                    <p className="text-sm text-red-500">
                      Please select at least one item
                    </p>
                  )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="flex-1"
              >
                {isSubmitting ? "Updating Collection..." : "Update Collection"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/outfits/collections/${collectionId}`)
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </section>

      <ItemSelectionModal
        open={showItemModal}
        onOpenChange={(open) => {
          setShowItemModal(open);
          if (!open) setHasClosedModal(true);
        }}
        itemsPromise={itemsPromise}
        categories={categories}
        selectedItems={selectedItems}
        onToggleItem={toggleItem}
      />
    </>
  );
}

function SelectedItemsPreview({
  itemsPromise,
  selectedItems,
  toggleItem,
  onOpenModal,
}: {
  itemsPromise: Promise<{ data: ClothingItem[] | null; error: any }>;
  selectedItems: string[];
  toggleItem: (id: string) => void;
  onOpenModal: () => void;
}) {
  const result = use(itemsPromise);
  const items = result?.data || [];
  const selectedItemsData = items.filter((item: any) =>
    selectedItems.includes(item.id)
  );

  return (
    <div className="flex flex-wrap gap-3 p-1">
      {selectedItemsData.map((item: any) => (
        <article key={item.id} className="relative group m-1">
          <div className="relative w-20 h-20 rounded-lg overflow-visible bg-muted/30">
            {item.image_url ? (
              <ClothingImage
                imageUrlPromise={getImageUrl(item.image_url)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
            <button
              onClick={() => toggleItem(item.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer z-10"
              title="Remove from collection"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p
            className="text-xs text-center mt-1 max-w-20 truncate"
            title={item.name}
          >
            {item.name}
          </p>
        </article>
      ))}
      {selectedItems.length < 12 && (
        <button
          onClick={onOpenModal}
          className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          type="button"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
      {selectedItems.length >= 12 && (
        <div className="w-20 h-20 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-xs text-center p-1">
          12+ items
        </div>
      )}
    </div>
  );
}

function ItemSelectionModal({
  open,
  onOpenChange,
  itemsPromise,
  categories,
  selectedItems,
  onToggleItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemsPromise: Promise<{ data: ClothingItem[] | null; error: any }>;
  categories: string[];
  selectedItems: string[];
  onToggleItem: (itemId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Add Items to Collection
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="w-full sm:w-48">
              <SearchableSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.map((category) => ({
                    value: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1),
                  })),
                ]}
                placeholder="Search categories..."
              />
            </div>
          </div>

          {/* Selected Items Preview */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">
                  {selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""} selected
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap max-h-20 overflow-y-auto overflow-x-visible p-1">
                <Suspense fallback={<div>Loading...</div>}>
                  <MiniSelectedPreview
                    itemsPromise={itemsPromise}
                    selectedItems={selectedItems}
                    onRemove={onToggleItem}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<ItemsSkeleton />}>
              <FilteredItemsGrid
                itemsPromise={itemsPromise}
                searchTerm={debouncedSearch}
                category={selectedCategory}
                selectedItems={selectedItems}
                toggleItem={onToggleItem}
              />
            </Suspense>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MiniSelectedPreview({
  itemsPromise,
  selectedItems,
  onRemove,
}: {
  itemsPromise: Promise<{ data: ClothingItem[] | null; error: any }>;
  selectedItems: string[];
  onRemove: (id: string) => void;
}) {
  const result = use(itemsPromise);
  const items = result?.data || [];
  const selectedItemsData = items.filter((item: any) =>
    selectedItems.includes(item.id)
  );

  return (
    <>
      {selectedItemsData.map((item: any) => (
        <div key={item.id} className="relative">
          <div className="w-12 h-12 rounded overflow-hidden bg-muted/30">
            {item.image_url ? (
              <ClothingImage
                imageUrlPromise={getImageUrl(item.image_url)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                No image
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer z-10"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
    </>
  );
}

function FilteredItemsGrid({
  itemsPromise,
  searchTerm,
  category,
  selectedItems,
  toggleItem,
}: {
  itemsPromise: Promise<{ data: ClothingItem[] | null; error: any }>;
  searchTerm: string;
  category: string;
  selectedItems: string[];
  toggleItem: (id: string) => void;
}) {
  const result = use(itemsPromise);
  const items = result?.data || [];
  const navigate = useNavigate();

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.primary_color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      category === "all" ||
      (Array.isArray(item.category) 
        ? item.category[0]?.name?.toLowerCase() === category.toLowerCase()
        : item.category?.name?.toLowerCase() === category.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground text-lg mb-2">
          No items in your wardrobe yet
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          Add some clothing items first to create collections
        </p>
        <Button onClick={() => navigate("/wardrobe/add")} variant="outline">
          Add Your First Item
        </Button>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items match your filters</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredItems.length} items
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-2">
        {filteredItems.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/30"
              }`}
            >
              {item.image_url ? (
                <ClothingImage
                  imageUrlPromise={getImageUrl(item.image_url)}
                  alt={item.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}

              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    ✓
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium truncate">
                  {item.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ItemsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {[...Array(15)].map((_, i) => (
        <div key={i} className="relative rounded-lg overflow-hidden">
          <div className="w-full h-24 bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EditFormSkeleton() {
  return (
    <section className="bg-muted/30 rounded-lg p-6">
      <div className="mb-6">
        <div className="h-6 bg-muted rounded w-40 animate-pulse mb-2" />
        <div className="h-4 bg-muted rounded w-64 animate-pulse" />
      </div>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-40 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
            <div className="h-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
          <div className="h-10 bg-muted rounded w-20 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
