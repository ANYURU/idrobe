import { Link, useSubmit, redirect } from 'react-router'
import type { Route } from './+types/collections.$collectionId'
import { Suspense, use, useState } from 'react'
import { createClient } from '@/lib/supabase.server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { OutfitPreview } from '@/components/OutfitPreview'
import { ClothingImage } from '@/components/ClothingImage'
import { ArrowLeft, Edit, Trash2, Heart, AlertCircle } from 'lucide-react'

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { supabase } = createClient(request)

  const collectionPromise = supabase
    .from('outfit_collections')
    .select('*')
    .eq('id', params.collectionId)
    .eq('user_id', user.id)
    .single()
    .then(async ({ data: collection, error }) => {
      if (error || !collection) throw new Error('Collection not found')
      
      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, image_url, primary_color')
        .in('id', collection.clothing_item_ids)
        .eq('user_id', user.id)
      
      return { ...collection, clothing_items: items || [] }
    })

  return { collectionPromise }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { supabase } = createClient(request)
  
  const formData = await request.formData()
  const actionType = formData.get('action')
  
  if (actionType === 'delete') {
    const { error } = await supabase
      .from('outfit_collections')
      .delete()
      .eq('id', params.collectionId)
      .eq('user_id', user.id)
    
    if (error) return { error: error.message }
    return redirect('/outfits?tab=collections')
  }
  
  if (actionType === 'toggle_favorite') {
    const isFavorite = formData.get('is_favorite') === 'true'
    const { error } = await supabase
      .from('outfit_collections')
      .update({ is_favorite: !isFavorite })
      .eq('id', params.collectionId)
      .eq('user_id', user.id)
    
    if (error) return { error: error.message }
    return { success: true }
  }
  
  return null
}

export default function CollectionDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const submit = useSubmit()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    const formData = new FormData()
    formData.append('action', 'delete')
    submit(formData, { method: 'post' })
  }

  const handleToggleFavorite = (isFavorite: boolean) => {
    const formData = new FormData()
    formData.append('action', 'toggle_favorite')
    formData.append('is_favorite', isFavorite.toString())
    submit(formData, { method: 'post' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/outfits?tab=collections" 
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Link>
      </div>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to delete this collection? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDelete} className="flex-1">
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function CollectionDetail({ collectionPromise, onToggleFavorite, onDelete }: {
  collectionPromise: Promise<any>
  onToggleFavorite: (isFavorite: boolean) => void
  onDelete: () => void
}) {
  const collection = use(collectionPromise)

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            {collection.is_favorite && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Heart className="mr-1 h-3 w-3 fill-current" />
                Favorite
              </Badge>
            )}
          </div>
          {collection.description && (
            <p className="text-slate-600">{collection.description}</p>
          )}
          <div className="flex gap-4 text-sm text-slate-500 mt-2">
            <span>{collection.clothing_item_ids?.length || 0} items</span>
            {collection.times_worn > 0 && (
              <span>Worn {collection.times_worn} times</span>
            )}
            <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={collection.is_favorite ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleFavorite(collection.is_favorite)}
          >
            <Heart className={`h-4 w-4 ${collection.is_favorite ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/outfits/collections/${collection.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outfit Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <OutfitPreview items={collection.clothing_items} maxItems={6} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items ({collection.clothing_items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {collection.clothing_items.map((item: any) => (
                <div key={item.id} className="space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <ClothingImage
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.primary_color}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function CollectionDetailSkeleton() {
  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-96 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-24 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}