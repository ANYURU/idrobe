import { useSearchParams, useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, Suspense, use } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Heart, Filter, X, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ClothingImage } from "@/components/ClothingImage";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";
import type { Route } from "./+types/_index";
import type { Tables } from "@/lib/database.types";

type Category = Tables<"clothing_categories">;
type Subcategory = Tables<"clothing_subcategories">;



interface WardrobeFilters {
  search: string;
  category: string;
  subcategory: string;
  sortBy: string;
  page: number;
  limit: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const filters: WardrobeFilters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    sortBy: searchParams.get("sortBy") || "recent",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "12"),
  };

  // Build query with category join
  let query = supabase
    .from("clothing_items")
    .select(`
      *,
      clothing_categories!category_id(
        id,
        name
      )
    `, { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .is("deleted_at", null);

  // Apply search filter
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  // Apply category filter
  if (filters.category && filters.category !== "all") {
    const { data: categoryData } = await supabase
      .from("clothing_categories")
      .select("id")
      .eq("name", filters.category)
      .single();

    if (categoryData) {
      query = query.eq("category_id", categoryData.id);
    }
  }

  // Apply subcategory filter
  if (filters.subcategory && filters.subcategory !== "all") {
    const { data: subcategoryData } = await supabase
      .from("clothing_subcategories")
      .select("id")
      .eq("name", filters.subcategory)
      .single();

    if (subcategoryData) {
      query = query.eq("subcategory_id", subcategoryData.id);
    }
  }

  // Apply sorting
  switch (filters.sortBy) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "worn":
      query = query.order("times_worn", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  query = query.range(from, to);

  const { data: items, error, count } = await query;

  if (error) {
    throw new Error("Failed to load items");
  }

  const totalPages = Math.ceil((count || 0) / filters.limit);

  // Fetch categories and subcategories for filter dropdown
  const { data: categories } = await supabase
    .from("clothing_categories")
    .select(`
      id, 
      name,
      clothing_subcategories(
        id,
        name
      )
    `)
    .eq("is_active", true)
    .is("parent_category_id", null)
    .order("display_order", { ascending: true });

  return {
    itemsPromise: Promise.resolve({
      items: items || [],
      total: count || 0,
      page: filters.page,
      totalPages,
      limit: filters.limit,
    }),
    categories: (categories || []) as (Category & { clothing_subcategories: Subcategory[] })[],
    filters,
  };
}

export default function WardrobePage() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const fetcher = useFetcher<typeof loader>();

  // Use fetcher data if available, otherwise use initial loader data
  const itemsPromise = fetcher.data?.itemsPromise || loaderData.itemsPromise;

  const filters: WardrobeFilters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    sortBy: searchParams.get("sortBy") || "recent",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "12"),
  };

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, []);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilters({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  // Fetch new data when URL params change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetcher.load(`/wardrobe?${params.toString()}`);
  }, [searchParams]);



  const updateFilters = (newFilters: Partial<WardrobeFilters>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== 0) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = filters.search || filters.category || filters.subcategory || filters.sortBy !== 'recent' || filters.limit !== 12;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Wardrobe</h1>
          <Suspense
            fallback={<p className="text-muted-foreground text-sm mt-0.5">Loading...</p>}
          >
            <ItemCountWrapper itemsPromise={itemsPromise} />
          </Suspense>
        </div>
        <div className="flex gap-2">
          <Link to="/wardrobe/analytics">
            <Button variant="outline" className="whitespace-nowrap">
              Analytics
            </Button>
          </Link>
          <Link to="/wardrobe/add">
            <Button className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border ">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-10 ${searchInput ? 'pr-10' : ''}`}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground w-4 h-4"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <SearchableSelect
                    value={filters.category || "all"}
                    onChange={(value) =>
                      updateFilters({
                        category: value === "all" ? "" : value,
                        subcategory: "",
                        page: 1,
                      })
                    }
                    options={[
                      { value: "all", label: "All categories" },
                      ...loaderData.categories.map(cat => ({
                        value: cat.name,
                        label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
                      }))
                    ]}
                    placeholder="All categories"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subcategory
                  </label>
                  <SearchableSelect
                    value={filters.subcategory || "all"}
                    onChange={(value) =>
                      updateFilters({
                        subcategory: value === "all" ? "" : value,
                        page: 1,
                      })
                    }
                    options={[
                      { value: "all", label: "All subcategories" },
                      ...(filters.category ? 
                        loaderData.categories
                          .find(cat => cat.name === filters.category)
                          ?.clothing_subcategories?.map(sub => ({
                            value: sub.name,
                            label: sub.name.charAt(0).toUpperCase() + sub.name.slice(1)
                          })) || []
                        : [])
                    ]}
                    placeholder="All subcategories"
                    disabled={!filters.category}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sort By
                  </label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      updateFilters({ sortBy: value, page: 1 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently added</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="worn">Most worn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Items per page
                  </label>
                  <Select
                    value={filters.limit.toString()}
                    onValueChange={(value) =>
                      updateFilters({ limit: parseInt(value), page: 1 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 items</SelectItem>
                      <SelectItem value="24">24 items</SelectItem>
                      <SelectItem value="48">48 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={<WardrobeSkeleton />}>
        <WardrobeGrid itemsPromise={itemsPromise} />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-16 bg-muted rounded animate-pulse"></div>
        }
      >
        <PaginationWrapper
          itemsPromise={itemsPromise}
          onPageChange={handlePageChange}
        />
      </Suspense>
    </div>
  );
}

function ItemCountWrapper({ itemsPromise }: { itemsPromise: Promise<any> }) {
  const data = use(itemsPromise);
  return (
    <p className="text-muted-foreground text-sm mt-0.5">{data.total} items in your wardrobe</p>
  );
}

function WardrobeGrid({ itemsPromise }: { itemsPromise: Promise<any> }) {
  const data = use(itemsPromise);

  if (data.items.length === 0) {
    return (
      <Card className="border">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground mb-4">No items found</p>
          <Button>
            <Link to="/wardrobe/add">Add your first item</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.items.map((item: any) => (
        <Link key={item.id} to={`/wardrobe/${item.id}`}>
          <Card className="border cursor-pointer h-full hover:bg-muted/50 transition-colors">
            <div className="relative">
              <Suspense fallback={
                <div className="w-full h-48 bg-muted rounded-t-lg animate-pulse" />
              }>
                <ClothingImage
                  filePath={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-contain rounded-t-lg bg-muted/30"
                />
              </Suspense>
              <div className="absolute top-2 right-2 flex gap-2">
                {item.is_favorite && (
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                )}
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {item.clothing_categories?.name || "Uncategorized"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {item.primary_color}
                </Badge>
                {item.times_worn > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Worn {item.times_worn}x
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function PaginationWrapper({
  itemsPromise,
  onPageChange,
}: {
  itemsPromise: Promise<any>;
  onPageChange: (page: number) => void;
}) {
  const data = use(itemsPromise);

  return (
    <Pagination
      currentPage={data.page}
      totalPages={data.totalPages}
      totalItems={data.total}
      pageSize={data.limit}
      onPageChange={onPageChange}
    />
  );
}

function WardrobeSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => (
        <Card key={i} className="border">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg"></div>
            <CardContent className="pt-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div className="flex gap-1">
                <div className="h-5 bg-muted rounded w-12"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
