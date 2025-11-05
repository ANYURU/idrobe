import { useFormik } from 'formik'
import { useSubmit, redirect } from 'react-router'
import type { Route } from './+types/create'
import { useState, Suspense, use, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchParams } from 'react-router'

import { createClient } from '@/lib/supabase.server'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { collectionSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ClothingImage } from '@/components/ClothingImage'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'





export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { createClient } = await import('@/lib/supabase.server')
  const { supabase } = createClient(request)
  
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'all'
  
  // Get category ID if filtering by category
  let categoryId = null
  if (category && category !== 'all') {
    const { data: categoryData } = await supabase
      .from('clothing_categories')
      .select('id')
      .eq('name', category)
      .single()
    categoryId = categoryData?.id
  }

  // Build filtered query
  let itemsQuery = supabase
    .from('clothing_items')
    .select(`
      id,
      name,
      image_url,
      primary_color,
      category:clothing_categories(name),
      subcategory:clothing_subcategories(name)
    `)
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (categoryId) {
    itemsQuery = itemsQuery.eq('category_id', categoryId)
  }
  
  if (search) {
    itemsQuery = itemsQuery.or(`name.ilike.%${search}%,primary_color.ilike.%${search}%`)
  }
  
  // Get unique categories from user's items
  const { data: categoriesData } = await supabase
    .from('clothing_items')
    .select('category:clothing_categories(name)')
    .eq('user_id', user.id)
    .not('category', 'is', null)
  
  const categories = [...new Set(categoriesData?.map(item => {
    const category = item.category as any
    return Array.isArray(category) ? category[0]?.name : category?.name
  }).filter(Boolean) || [])].sort() as string[]
  
  const itemsResult = await itemsQuery
  
  return {
    itemsPromise: Promise.resolve(itemsResult),
    categories,
    filters: { search, category }
  }
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request)
  const formData = await request.formData()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const selectedItems = JSON.parse(formData.get('selectedItems') as string)

  const { error: insertError } = await supabase
    .from('outfit_collections')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      clothing_item_ids: selectedItems,
    })

  if (insertError) {
    return { error: insertError.message }
  }

  return redirect('/outfits?tab=collections')
}

export default function CreateOutfitPage({ actionData, loaderData }: Route.ComponentProps) {
  const submit = useSubmit()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showNaming, setShowNaming] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const updateFilters = (newFilters: { search?: string; category?: string }) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    setSearchParams(params)
  }

  useEffect(() => {
    if (debouncedSearch !== (searchParams.get('search') || '')) {
      updateFilters({ search: debouncedSearch })
    }
  }, [debouncedSearch])

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
    },
    validationSchema: toFormikValidationSchema(collectionSchema),
    onSubmit: (values) => {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('description', values.description)
      formData.append('selectedItems', JSON.stringify(selectedItems))

      submit(formData, { method: 'post' })
    },
  })

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
      
      // Auto-show naming form when user selects first item
      if (newSelection.length === 1 && prev.length === 0) {
        setShowNaming(true)
      }
      // Hide naming form if no items selected
      if (newSelection.length === 0) {
        setShowNaming(false)
        formik.resetForm()
      }
      
      return newSelection
    })
  }

  const handleContinue = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item')
      return
    }
    setShowNaming(true)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Collection</h1>
        <p className="text-muted-foreground mt-1">
          {selectedItems.length === 0 
            ? "Start by selecting items from your wardrobe"
            : showNaming 
              ? "Give your collection a name and description"
              : `${selectedItems.length} items selected - ready to name your collection`
          }
        </p>
      </div>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {/* Collection Preview - Shows when items are selected */}
      {selectedItems.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Collection Preview</CardTitle>
                <CardDescription>{selectedItems.length} items selected</CardDescription>
              </div>
              {!showNaming && (
                <Button onClick={handleContinue} size="sm">
                  Continue to Name
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading preview...</div>}>
              <SelectedItemsPreview 
                itemsPromise={loaderData.itemsPromise}
                selectedItems={selectedItems}
                toggleItem={toggleItem}
              />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Naming Form - Shows after items are selected */}
      {showNaming && selectedItems.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Name Your Collection</CardTitle>
            <CardDescription>Add a name and description for your {selectedItems.length}-item collection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Casual, Work Outfits"
                    {...formik.getFieldProps('name')}
                    autoFocus
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-sm text-red-500">{formik.errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Perfect for warm weather, office meetings, casual dates..."
                    rows={3}
                    {...formik.getFieldProps('description')}
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className="text-sm text-red-500">{formik.errors.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={formik.isSubmitting} className="flex-1">
                  {formik.isSubmitting ? 'Creating Collection...' : 'Create Collection'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNaming(false)}
                  className="px-6"
                >
                  Back to Selection
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Item Selection Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Wardrobe</CardTitle>
          <CardDescription>
            {selectedItems.length === 0 
              ? "Click items to start building your collection"
              : "Click items to add or remove from your collection"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="w-full sm:w-48">
              <CategorySelect 
                categories={loaderData.categories}
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  setSelectedCategory(category)
                  updateFilters({ category })
                }}
              />
            </div>
          </div>
          
          <Suspense fallback={<ItemsSkeleton />}>
            <ItemsGrid 
              itemsPromise={loaderData.itemsPromise}
              selectedItems={selectedItems}
              toggleItem={toggleItem}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function CategorySelect({ categories, selectedCategory, onCategoryChange }: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <SearchableSelect
      value={selectedCategory}
      onChange={onCategoryChange}
      options={[
        { value: "all", label: "All Categories" },
        ...categories.map((category) => ({
          value: category,
          label: category.charAt(0).toUpperCase() + category.slice(1)
        }))
      ]}
      placeholder="Search categories..."
    />
  );
}

function SelectedItemsPreview({ itemsPromise, selectedItems, toggleItem }: { itemsPromise: Promise<any>; selectedItems: string[]; toggleItem: (id: string) => void }) {
  const result = use(itemsPromise);
  const items = result?.data || [];
  const selectedItemsData = items.filter((item: any) => selectedItems.includes(item.id));
  
  return (
    <div className="flex flex-wrap gap-3">
      {selectedItemsData.map((item: any) => (
        <div key={item.id} className="relative group">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/30">
            <ClothingImage
              filePath={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => toggleItem(item.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove from collection"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-center mt-1 max-w-20 truncate" title={item.name}>
            {item.name}
          </p>
        </div>
      ))}
      {selectedItems.length < 10 && (
        <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
          <span className="text-2xl">+</span>
        </div>
      )}
    </div>
  );
}

function ItemsGrid({ itemsPromise, selectedItems, toggleItem }: { 
  itemsPromise: Promise<any>; 
  selectedItems: string[]; 
  toggleItem: (id: string) => void;
}) {
  const result = use(itemsPromise);
  const items = result?.data || [];
  
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-foreground text-lg mb-2">No items in your wardrobe yet</p>
        <p className="text-muted-foreground text-sm">Add some clothing items first to create collections</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="text-sm text-muted-foreground mb-4">
        Showing {Math.min(items?.length || 0, 50)} items
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.slice(0, 50).map((item: any) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary scale-95 shadow-lg'
                  : 'hover:shadow-md hover:scale-105'
              }`}
            >
              <ClothingImage
                filePath={item.image_url}
                alt={item.name}
                className="w-full h-32 object-cover"
              />
              <div className={`absolute inset-0 transition-colors ${
                isSelected ? 'bg-primary/20' : 'bg-black/0 hover:bg-black/5'
              }`} />
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shadow-lg">
                    ✓
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">
                  {item.name}
                </p>
                <p className="text-white/80 text-xs truncate">
                  {item.category?.name} • {item.primary_color}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {items.length > 50 && (
        <div className="text-center mt-4">
          <p className="text-muted-foreground text-sm">Showing first 50 items. Use search to find specific items.</p>
        </div>
      )}
    </>
  );
}

function ItemsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="relative rounded-lg overflow-hidden">
          <div className="w-full h-32 bg-muted animate-pulse" />
          <div className="absolute bottom-0 left-0 right-0 bg-muted/80 h-12 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
