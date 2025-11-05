import { Link, useSearchParams, useFetcher } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Search, Filter, X, RotateCcw, RefreshCw, MessageCircle } from "lucide-react";
import { OutfitPreview } from "@/components/OutfitPreview";
import { Pagination } from "@/components/ui/pagination";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/useDebounce";
import { Suspense, use, useState, useEffect } from "react";
import type { Route } from "./+types/_index";

interface OutfitFilters {
  search: string;
  occasion: string;
  mood: string;
  sortBy: string;
  page: number;
  limit: number;
}

interface ClothingItem {
  id: string;
  name: string;
  image_url: string;
  primary_color: string;
}

interface OutfitRecommendation {
  id: string;
  occasion_name: string | null;
  mood_name: string | null;
  recommendation_reason: string | null;
  ai_score: number | null;
  clothing_item_ids: string[];
  clothing_items: ClothingItem[];
}

interface RecommendationsData {
  items: OutfitRecommendation[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface OutfitCollection {
  id: string;
  name: string;
  description: string | null;
  clothing_item_ids: string[];
  clothing_items: ClothingItem[];
  times_worn: number;
  is_favorite: boolean;
  created_at: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);
  const { createClient } = await import('@/lib/supabase.server');
  const { supabase } = createClient(request);

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const filters: OutfitFilters = {
    search: searchParams.get("search") || "",
    occasion: searchParams.get("occasion") || "",
    mood: searchParams.get("mood") || "",
    sortBy: searchParams.get("sortBy") || "recent",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "12"),
  };

  // Build recommendations query
  let recQuery = supabase
    .from("outfit_recommendations")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (filters.search) {
    recQuery = recQuery.ilike("recommendation_reason", `%${filters.search}%`);
  }
  if (filters.occasion && filters.occasion !== "all") {
    recQuery = recQuery.eq("occasion_name", filters.occasion);
  }
  if (filters.mood && filters.mood !== "all") {
    recQuery = recQuery.eq("mood_name", filters.mood);
  }

  switch (filters.sortBy) {
    case "score":
      recQuery = recQuery.order("ai_score", { ascending: false });
      break;
    case "recent":
    default:
      recQuery = recQuery.order("generated_at", { ascending: false });
      break;
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  recQuery = recQuery.range(from, to);

  // Fetch unique occasions and moods
  const [occasionsRes, moodsRes] = await Promise.all([
    supabase.from("outfit_recommendations").select("occasion_name").eq("user_id", user.id).not("occasion_name", "is", null),
    supabase.from("outfit_recommendations").select("mood_name").eq("user_id", user.id).not("mood_name", "is", null)
  ]);

  const occasions = [...new Set(occasionsRes.data?.map(item => item.occasion_name) || [])].filter(Boolean).sort();
  const moods = [...new Set(moodsRes.data?.map(item => item.mood_name) || [])].filter(Boolean).sort();

  const { loadOutfitCollections } = await import("@/lib/loaders");

  const recommendationsPromise: Promise<RecommendationsData> = Promise.resolve(recQuery.then(async ({ data: recs, error, count }) => {
    if (error) throw new Error("Failed to load recommendations");
    
    const recsWithItems = await Promise.all(
      (recs || []).map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('id, name, image_url, primary_color')
          .in('id', rec.clothing_item_ids)
          .eq('user_id', user.id);
        
        return { ...rec, clothing_items: items || [] };
      })
    );
    
    return {
      items: recsWithItems,
      total: count || 0,
      page: filters.page,
      totalPages: Math.ceil((count || 0) / filters.limit),
      limit: filters.limit,
    };
  }));

  return {
    recommendationsPromise,
    collectionsPromise: loadOutfitCollections(user.id, request),
    occasions,
    moods,
    filters,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);
  
  const formData = await request.formData();
  const actionType = formData.get('action');
  
  if (actionType === 'generate_recommendations') {
    const { generateOutfitRecommendations } = await import('@/lib/outfit-recommendations');
    
    const context = formData.get('context')?.toString();
    const isRefresh = formData.get('refresh') === 'true';
    const isSurprise = formData.get('surprise') === 'true';
    
    const result = await generateOutfitRecommendations(user.id, request, {
      weather: 'current',
      season: getCurrentSeason(),
      context: context || undefined,
      refresh: isRefresh,
      surprise: isSurprise
    });
    
    return { 
      success: true, 
      type: 'recommendations_generated',
      generatedIds: result.generatedIds || [],
      count: result.generatedIds?.length || 0
    };
  }
  
  return null;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export default function OutfitsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'recommendations';
  const sharedGenerateFetcher = useFetcher();
  
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'recommendations') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params);
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Outfits</h1>
          <p className="text-slate-600 mt-1">
            Manage your outfit recommendations and collections
          </p>
        </div>
        {activeTab === "recommendations" ? (
          <GenerateOutfitDialog generateFetcher={sharedGenerateFetcher} />
        ) : (
          <Button className="whitespace-nowrap">
            <Link to="/outfits/create" className="flex items-center">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              Create Collection
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<OutfitsSkeleton />}>
        <OutfitsContent 
          recommendationsPromise={loaderData.recommendationsPromise} 
          collectionsPromise={loaderData.collectionsPromise}
          occasions={loaderData.occasions}
          moods={loaderData.moods}
          filters={loaderData.filters}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          generateFetcher={sharedGenerateFetcher}
        />
      </Suspense>
    </div>
  );
}

function GenerateOutfitDialog({ generateFetcher }: { generateFetcher: any }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [showMore, setShowMore] = useState(false);
  
  const quickSuggestions = [
    "I have a job interview tomorrow",
    "Going on a casual date this weekend", 
    "Need something for a work presentation",
    "Attending a wedding as a guest",
    "Casual day out with friends",
    "Beach wedding - pastels and light fabrics",
    "Black tie formal event",
    "80s themed party - bright colors and fun patterns",
    "Client dinner - conservative but stylish",
    "Date night but might go dancing after",
    "Corporate networking event",
    "Brunch with the girls - cute and comfortable",
    "Art gallery opening - creative and sophisticated"
  ];
  
  const visibleSuggestions = showMore ? quickSuggestions : quickSuggestions.slice(0, 5);
  
  const handleGenerate = () => {
    const formData = new FormData();
    formData.append('action', 'generate_recommendations');
    formData.append('context', context);
    generateFetcher.submit(formData, { method: 'POST' });
  };
  
  const handleSurpriseMe = () => {
    const formData = new FormData();
    formData.append('action', 'generate_recommendations');
    formData.append('context', 'Create personalized outfit recommendations based on my style preferences and wardrobe');
    formData.append('surprise', 'true');
    generateFetcher.submit(formData, { method: 'POST' });
  };
  
  const handleClose = () => {
    setOpen(false);
    setContext("");
    setShowMore(false);
  };
  
  // Reset dialog state when it closes
  useEffect(() => {
    if (!open) {
      // Clear any previous generation data when dialog closes
      if (generateFetcher.data?.success) {
        generateFetcher.data = null;
      }
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="whitespace-nowrap">
          <Sparkles className="mr-2 h-4 w-4 shrink-0" />
          Generate New Outfits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            What kind of outfit are you looking for?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {generateFetcher.data?.success ? (
            <div className="text-center py-4">
              <div className="text-green-600 mb-2">
                <Sparkles className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">
                  {generateFetcher.data?.count || 0} New Outfits Generated!
                </p>
                <p className="text-sm text-slate-600">Check the highlighted recommendations below</p>
              </div>
            </div>
          ) : (
            <Textarea
              placeholder="Describe the occasion, mood, colors, or any specific needs..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-24"
              disabled={generateFetcher.state === 'submitting'}
            />
          )}
          
          {!generateFetcher.data?.success && generateFetcher.state !== 'submitting' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Quick suggestions:</p>
                {quickSuggestions.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMore(!showMore)}
                    className="text-xs text-slate-500 cursor-pointer"
                  >
                    {showMore ? 'Show less' : `+${quickSuggestions.length - 5} more`}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setContext(suggestion)}
                    className="text-xs cursor-pointer"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            {generateFetcher.data?.success ? (
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleGenerate}
                  disabled={!context.trim() || generateFetcher.state !== 'idle'}
                  className="flex-1"
                >
                  {generateFetcher.state === 'submitting' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {generateFetcher.state === 'submitting' ? 'Generating...' : 'Generate Outfits'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSurpriseMe}
                  disabled={generateFetcher.state !== 'idle'}
                  className="whitespace-nowrap"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Surprise Me
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface OutfitsContentProps {
  recommendationsPromise: Promise<RecommendationsData>;
  collectionsPromise: Promise<OutfitCollection[]>;
  occasions: string[];
  moods: string[];
  filters: OutfitFilters;
  activeTab: string;
  onTabChange: (tab: string) => void;
  generateFetcher: any;
}

function OutfitsContent({ recommendationsPromise, collectionsPromise, occasions, moods, filters, activeTab, onTabChange, generateFetcher }: OutfitsContentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [newlyGeneratedIds, setNewlyGeneratedIds] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchInput, 500);
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, []);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilters({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetcher.load(`/outfits?${params.toString()}`);
  }, [searchParams]);

  // Track newly generated recommendations
  useEffect(() => {
    if (generateFetcher.data?.generatedIds) {
      setNewlyGeneratedIds(generateFetcher.data.generatedIds);
    }
  }, [generateFetcher.data?.generatedIds]);
  
  // Clear highlighting when user interacts (searches, filters, or navigates)
  useEffect(() => {
    if (newlyGeneratedIds.length > 0 && (searchInput || showFilters)) {
      setNewlyGeneratedIds([]);
    }
  }, [searchInput, showFilters]);

  const updateFilters = (newFilters: Partial<OutfitFilters>) => {
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

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleGenerateRecommendations = () => {
    const formData = new FormData();
    formData.append('action', 'generate_recommendations');
    formData.append('context', 'Generate fresh outfit suggestions with different combinations');
    formData.append('refresh', 'true');
    generateFetcher.submit(formData, { method: 'POST' });
  };

  const hasActiveFilters = Boolean(filters.search) || Boolean(filters.occasion) || Boolean(filters.mood) || filters.sortBy !== 'recent' || filters.limit !== 12;
  const currentOccasions = fetcher.data?.occasions || occasions;
  const currentMoods = fetcher.data?.moods || moods;
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="recommendations" className="cursor-pointer">
          <Sparkles className="mr-2 h-4 w-4" />
          Recommendations
        </TabsTrigger>
        <TabsTrigger value="collections" className="cursor-pointer">Collections</TabsTrigger>
      </TabsList>

      <TabsContent value="recommendations" className="space-y-4">
        <Suspense fallback={<RecommendationsSkeleton />}>
          <RecommendationsContent 
            recommendationsPromise={recommendationsPromise}
            currentOccasions={currentOccasions}
            currentMoods={currentMoods}
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            updateFilters={updateFilters}
            resetFilters={resetFilters}
            handleGenerateRecommendations={handleGenerateRecommendations}
            generateFetcher={generateFetcher}
            newlyGeneratedIds={newlyGeneratedIds}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="collections" className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">My Collections</h3>
          <p className="text-sm text-slate-600">Your saved outfit combinations</p>
        </div>
        
        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsContent collectionsPromise={collectionsPromise} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

interface RecommendationsContentProps {
  recommendationsPromise: Promise<RecommendationsData>;
  currentOccasions: string[];
  currentMoods: string[];
  filters: OutfitFilters;
  hasActiveFilters: boolean;
  searchInput: string;
  setSearchInput: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  updateFilters: (filters: Partial<OutfitFilters>) => void;
  resetFilters: () => void;
  handleGenerateRecommendations: () => void;
  generateFetcher: any;
  newlyGeneratedIds: string[];
}

function RecommendationsContent({ recommendationsPromise, currentOccasions, currentMoods, filters, hasActiveFilters, searchInput, setSearchInput, showFilters, setShowFilters, updateFilters, resetFilters, handleGenerateRecommendations, generateFetcher, newlyGeneratedIds }: RecommendationsContentProps) {
  const currentData = use(recommendationsPromise) as RecommendationsData;
  
  return (
    <>
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search recommendations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-10 ${searchInput ? 'pr-10' : ''}`}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 cursor-pointer"
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
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Occasion
                  </label>
                  <SearchableSelect
                    value={filters.occasion || ""}
                    onChange={(value) => updateFilters({ occasion: value, page: 1 })}
                    options={[
                      { value: "", label: "All occasions" },
                      ...currentOccasions.map((occasion: string) => ({
                        value: occasion,
                        label: occasion.charAt(0).toUpperCase() + occasion.slice(1)
                      }))
                    ]}
                    placeholder="Search occasions..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mood
                  </label>
                  <SearchableSelect
                    value={filters.mood || ""}
                    onChange={(value) => updateFilters({ mood: value, page: 1 })}
                    options={[
                      { value: "", label: "All moods" },
                      ...currentMoods.map((mood: string) => ({
                        value: mood,
                        label: mood.charAt(0).toUpperCase() + mood.slice(1)
                      }))
                    ]}
                    placeholder="Search moods..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                      <SelectItem value="recent">Most recent</SelectItem>
                      <SelectItem value="score">Highest score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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

      {currentData.items.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600 mb-4">No recommendations found</p>
              <p className="text-sm text-slate-500 mb-4">
                Try adjusting your filters or add items to your wardrobe
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleGenerateRecommendations}
                  disabled={generateFetcher.state !== 'idle'}
                >
                  <RefreshCw className={`mr-2 w-4 h-4 ${generateFetcher.state === 'submitting' ? 'animate-spin' : ''}`} />
                  {generateFetcher.state === 'submitting' ? 'Generating...' : 'Get Fresh Suggestions'}
                </Button>
                <Button variant="outline">
                  <Link to="/wardrobe/add">Add items</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">
                {currentData.total} recommendations found
              </p>
              <Button
                onClick={handleGenerateRecommendations}
                disabled={generateFetcher.state !== 'idle'}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`mr-2 w-4 h-4 ${generateFetcher.state === 'submitting' ? 'animate-spin' : ''}`} />
                {generateFetcher.state === 'submitting' ? 'Generating...' : 'Get Fresh Suggestions'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentData.items.map((rec: any) => {
                const isNew = newlyGeneratedIds.includes(rec.id);
                return (
                  <Link key={rec.id} to={`/outfits/${rec.id}`} className="cursor-pointer">
                    <Card className={`hover:shadow-lg transition-all cursor-pointer h-full ${
                      isNew ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="capitalize flex items-center gap-2">
                            {rec.occasion_name || 'Outfit'}
                            {isNew && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                New
                              </Badge>
                            )}
                          </CardTitle>
                          {rec.mood_name && (
                            <CardDescription className="capitalize">
                              Mood: {rec.mood_name}
                            </CardDescription>
                          )}
                        </div>
                        {rec.ai_score && (
                          <Badge variant="secondary">
                            {Math.round(rec.ai_score * 100)}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {rec.recommendation_reason && (
                        <p className="text-sm text-slate-600">
                          {rec.recommendation_reason}
                        </p>
                      )}
                      <OutfitPreview items={rec.clothing_items || []} />
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>
            
            <Suspense fallback={<div className="h-16 bg-slate-100 rounded animate-pulse" />}>
              <Pagination
                currentPage={currentData.page}
                totalPages={currentData.totalPages}
                totalItems={currentData.total}
                pageSize={currentData.limit}
                onPageChange={(page) => updateFilters({ page })}
              />
            </Suspense>
        </>
      )}
    </>
  );
}

function CollectionsContent({ collectionsPromise }: { collectionsPromise: Promise<OutfitCollection[]> }) {
  const collections = use(collectionsPromise) as OutfitCollection[];
  
  return (
    <>
      {collections.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-600 mb-4">No collections yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Create a collection to save your favorite outfit combinations
            </p>
            <Button>
              <Link to="/outfits/create">Create collection</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection: any) => (
            <Link key={collection.id} to={`/outfits/collections/${collection.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{collection.name}</CardTitle>
                  {collection.description && (
                    <CardDescription>
                      {collection.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <OutfitPreview items={collection.clothing_items || []} />
                  <div className="flex gap-2 text-sm text-slate-600">
                    <span>{collection.clothing_item_ids?.length || 0} items</span>
                    {(collection.times_worn ?? 0) > 0 && (
                      <span>• Worn {collection.times_worn}x</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-slate-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-20 h-10 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-slate-200 rounded w-32 mb-2 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="w-12 h-12 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-12 h-12 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OutfitsSkeleton() {
  return (
    <Tabs defaultValue="recommendations" className="w-full">
      <TabsList>
        <TabsTrigger value="recommendations">
          <Sparkles className="mr-2 h-4 w-4" />
          Recommendations
        </TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
      </TabsList>

      <TabsContent value="recommendations" className="space-y-4">
        <RecommendationsSkeleton />
      </TabsContent>
      
      <TabsContent value="collections" className="space-y-4">
        <CollectionsSkeleton />
      </TabsContent>
    </Tabs>
  );
}