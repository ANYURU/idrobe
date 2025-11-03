import { useNavigate, redirect, useSubmit, Link } from 'react-router'
import { useState, Suspense, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Heart, Trash2, Share2 } from 'lucide-react'
import { ClothingImage } from '@/components/ClothingImage'
import type { Route } from './+types/$outfitId'

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  
  if (!params.outfitId) {
    throw new Error('Outfit ID is required')
  }

  return {
    outfitPromise: (async () => {
      const { createClient } = await import('@/lib/supabase.server')
      const { supabase } = createClient(request)
      
      // Try to find in collections first
      let { data: outfit, error: collectionError } = await supabase
        .from('outfit_collections')
        .select('*')
        .eq('id', params.outfitId)
        .eq('user_id', user.id)
        .single()

      let isRecommendation = false
      
      // If not found in collections, try recommendations
      if (collectionError) {
        const { data: recData, error: recError } = await supabase
          .from('outfit_recommendations')
          .select('*')
          .eq('id', params.outfitId)
          .eq('user_id', user.id)
          .single()
        
        if (recError) {
          throw new Response('Outfit not found', { status: 404 })
        }
        
        outfit = recData
        isRecommendation = true
      }

      // Fetch clothing items with cost data
      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, image_url, primary_color, category_id, cost, times_worn, created_at')
        .in('id', outfit.clothing_item_ids)
        .eq('user_id', user.id)

      // Find similar outfits (same category items or similar occasions)
      const { data: similarOutfits } = await supabase
        .from(isRecommendation ? 'outfit_recommendations' : 'outfit_collections')
        .select('id, name, occasion, clothing_item_ids')
        .eq('user_id', user.id)
        .neq('id', params.outfitId)
        .limit(3)

      // Calculate total cost and cost per wear
      const totalCost = items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0
      const costPerWear = outfit.times_worn > 0 ? totalCost / outfit.times_worn : totalCost

      return { 
        outfit, 
        items: items || [], 
        isRecommendation, 
        similarOutfits: similarOutfits || [],
        totalCost,
        costPerWear
      }
    })()
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { createClient } = await import('@/lib/supabase.server')
  const { supabase } = createClient(request)
  
  const formData = await request.formData()
  const action = formData.get('action')
  
  if (action === 'toggle_favorite') {
    const isFavorite = formData.get('is_favorite') === 'true'
    await supabase
      .from('outfit_collections')
      .update({ is_favorite: !isFavorite })
      .eq('id', params.outfitId)
      .eq('user_id', user.id)
  } else if (action === 'delete') {
    await supabase
      .from('outfit_collections')
      .delete()
      .eq('id', params.outfitId)
      .eq('user_id', user.id)
    
    return redirect('/outfits')
  }
  
  return { success: true }
}

export default function OutfitDetailPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Suspense fallback={<OutfitDetailSkeleton />}>
        <OutfitDetailContent outfitPromise={loaderData.outfitPromise} />
      </Suspense>
    </div>
  )
}

function OutfitDetailContent({ outfitPromise }: { outfitPromise: Promise<any> }) {
  const navigate = useNavigate()
  const submit = useSubmit()
  const { 
    outfit, 
    items, 
    isRecommendation, 
    similarOutfits, 
    totalCost, 
    costPerWear
  } = use(outfitPromise)
  const [error, setError] = useState<string | null>(null)

  const handleToggleFavorite = () => {
    submit(
      { action: 'toggle_favorite', is_favorite: outfit.is_favorite.toString() },
      { method: 'POST' }
    )
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    submit({ action: 'delete' }, { method: 'POST' })
  }

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
          <h1 className="text-3xl font-bold">
            {isRecommendation 
              ? `${outfit.occasion ? outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1) : ''} Outfit`
              : outfit.name || 'Untitled Outfit'
            }
          </h1>
          {(outfit.description || outfit.recommendation_reason) && (
            <p className="text-slate-600 mt-2">
              {outfit.description || outfit.recommendation_reason}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={outfit.is_favorite ? 'default' : 'outline'}
            onClick={handleToggleFavorite}
            size="sm"
          >
            <Heart className={`h-4 w-4 ${outfit.is_favorite ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <ClothingImage
              filePath={item.image_url}
              alt={item.name}
              className="w-full h-40 object-contain bg-slate-50"
            />
            <CardContent className="pt-3">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <Badge variant="secondary" className="text-xs mt-2">
                {item.primary_color}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle>Outfit Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-600">Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">
              {isRecommendation ? 'AI Score' : 'Times Worn'}
            </p>
            <p className="text-2xl font-bold">
              {isRecommendation 
                ? `${Math.round((outfit.ai_score || 0) * 100)}%`
                : outfit.times_worn || 0
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Cost</p>
            <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Cost per Wear</p>
            <p className="text-2xl font-bold">
              {outfit.times_worn > 0 ? `$${costPerWear.toFixed(0)}` : '-'}
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
            <p className="text-sm font-medium text-slate-600 mb-2">Best for:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {outfit.occasion || 'Any occasion'}
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

      {/* Similar Outfits */}
      {similarOutfits.length > 0 && (
        <Card className="border">
          <CardHeader>
            <CardTitle>You might also like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarOutfits.map((similar) => (
                <Link key={similar.id} to={`/outfits/${similar.id}`}>
                  <div className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-sm truncate">
                      {similar.name || `${similar.occasion} outfit`}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {similar.clothing_item_ids.length} items
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function OutfitDetailSkeleton() {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-96 animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="w-full h-40 bg-slate-200 animate-pulse" />
            <CardContent className="pt-3">
              <div className="h-4 bg-slate-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-24 animate-pulse" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-slate-200 rounded w-16 mb-1 animate-pulse" />
              <div className="h-8 bg-slate-200 rounded w-12 animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
