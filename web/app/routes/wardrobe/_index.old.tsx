import { useSearchParams } from "react-router";
import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GridSuspense } from "@/components/suspense-boundaries";
import { loadClothingItems } from "@/lib/loaders";
import { ClothingImage } from "@/components/ClothingImage";
import type { Route } from "./+types/_index";

const CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
  "bags",
  "jewelry",
];

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);
  const items = await loadClothingItems(user.id, request);
  return { items };
}

function WardrobeContent({ items }: { items: any[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recent");

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          !selectedCategory || item.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "recent":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "name":
            return a.name.localeCompare(b.name);
          case "worn":
            return b.times_worn - a.times_worn;
          default:
            return 0;
        }
      });
  }, [items, searchTerm, selectedCategory, sortBy]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    setSearchParams(params);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("category", value);
    else params.delete("category");
    setSearchParams(params);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    setSearchParams(params);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Wardrobe</h1>
          <p className="text-slate-600 mt-1">
            {items.length} items in your wardrobe
          </p>
        </div>
        <Button className="whitespace-nowrap">
          <Link to="/wardrobe/add" className="flex items-center">
            <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
            Add Item
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="worn">Most worn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <GridSuspense count={6}>
        {filteredItems.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600 mb-4">No items found</p>
              <Button>
                <Link to="/wardrobe/add">Add your first item</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative">
                    <ClothingImage
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-48 object-contain rounded-t-lg bg-slate-50"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {item.is_favorite && (
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-slate-600 capitalize">
                      {item.category?.name || 'Uncategorized'}
                      {item.subcategory?.name && ` • ${item.subcategory.name}`}
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
        )}
      </GridSuspense>
    </div>
  );
}

export default function WardrobePage({ loaderData }: Route.ComponentProps) {
  return <WardrobeContent items={loaderData.items} />;
}
