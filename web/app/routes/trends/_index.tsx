import { useLoaderData, useRevalidator } from 'react-router'
import { Suspense, use, useEffect, useState } from 'react'
import type { Route } from './+types/_index'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Clock, Globe, Loader2 } from 'lucide-react'
import type { Tables } from '@/lib/database.types'
import { useToast } from '@/lib/use-toast'

type SeasonalTrend = Tables<'seasonal_trends'>
type EnrichedTrend = SeasonalTrend & {
  trending_category_names: string[]
}

export const meta = () => {
  return [
    { title: "Current Fashion Trends 2024 - Idrobe" },
    { name: "description", content: "Discover the latest fashion trends, colors, and styles. Real-time trend analysis powered by AI." },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  await requireAuth(request)
  
  return {
    trendsPromise: (async () => {
      const { createClient } = await import('@/lib/supabase.server')
      const { supabase } = createClient(request)
      const { data: trends } = await supabase
        .from('seasonal_trends')
        .select('*')
        .order('trend_score', { ascending: false })
        .order('last_synced_at', { ascending: false })

      // Fetch category names for trends that have category IDs
      const enrichedTrends = await Promise.all(
        (trends || []).map(async (trend) => {
          if (trend.trending_category_ids && trend.trending_category_ids.length > 0) {
            const { data: categories } = await supabase
              .from('clothing_categories')
              .select('name')
              .in('id', trend.trending_category_ids)
            
            return {
              ...trend,
              trending_category_names: categories?.map(cat => cat.name) || []
            }
          }
          return { ...trend, trending_category_names: [] }
        })
      )

      return enrichedTrends
    })()
  }
}

export default function TrendsPage() {
  const { trendsPromise } = useLoaderData<typeof loader>()
  const revalidator = useRevalidator()
  const toast = useToast()
  const [isSyncing, setIsSyncing] = useState(false)

  // Set up real-time subscription
  useEffect(() => {
    const setupSubscription = async () => {
      const { createClient } = await import('@/lib/supabase.client')
      const supabase = createClient()
      
      const subscription = supabase
        .channel('trends-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seasonal_trends'
          },
          () => revalidator.revalidate()
        )
        .subscribe()

      return () => subscription.unsubscribe()
    }
    
    let cleanup: (() => void) | undefined
    setupSubscription().then(fn => { cleanup = fn })
    
    return () => cleanup?.()
  }, [revalidator])

  const handleSyncTrends = async () => {
    setIsSyncing(true)
    
    toast.promise(
      fetch('/api/sync-trends', { method: 'POST' }).then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to sync trends')
        }
        revalidator.revalidate()
        return data
      }),
      {
        loading: 'Syncing trends with AI...',
        success: (data) => data.message || 'Trends synced successfully!',
        error: (err) => err.message || 'Failed to sync trends',
        finally: () => setIsSyncing(false)
      }
    )
  }

  return (
    <main className="@container/main px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold">Fashion Trends</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time trends powered by AI and social data</p>
        </div>
        <Button onClick={handleSyncTrends} variant="outline" size="sm" disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Clock className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </header>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent trendsPromise={trendsPromise} />
      </Suspense>
    </main>
  )
}

function TrendsContent({ trendsPromise }: { trendsPromise: Promise<EnrichedTrend[]> }) {
  const trends = use(trendsPromise)

  const currentTrends = trends.filter((trend: EnrichedTrend) => {
    const now = new Date()
    return new Date(trend.valid_from) <= now && now <= new Date(trend.valid_until)
  })

  const upcomingTrends = trends.filter((trend: EnrichedTrend) => {
    const now = new Date()
    return new Date(trend.valid_from) > now
  })

  return (
    <>
      <section aria-label="Current trends">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Current Trends
        </h2>
        {currentTrends.length === 0 ? (
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No current trends available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}
      </section>

      {upcomingTrends.length > 0 && (
        <section aria-label="Upcoming trends">
          <h2 className="text-lg font-semibold mb-4">Upcoming Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} upcoming />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function TrendCard({ trend, upcoming = false }: { trend: EnrichedTrend; upcoming?: boolean }) {
  const isExternal = trend.external_source !== 'manual'
  const trendScore = trend.trend_score || 0.5
  const popularityScore = trend.popularity_score || 50
  
  return (
    <article className={`bg-muted/30 rounded-lg p-6 space-y-4 ${upcoming ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2 mb-1">
            {trend.season_name} {trend.year}
            {isExternal && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {trend.region && `${trend.region} • `}
            {new Date(trend.valid_from).toLocaleDateString()} - {new Date(trend.valid_until).toLocaleDateString()}
          </p>
          {trend.last_synced_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {new Date(trend.last_synced_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Badge variant="secondary" className="justify-center">
            {Math.round(trendScore * 100)}%
          </Badge>
          <Badge variant="outline" className="justify-center">
            {popularityScore}%
          </Badge>
        </div>
      </div>
      {trend.trend_description && (
        <p className="text-sm leading-relaxed">{trend.trend_description}</p>
      )}

      {trend.trending_colors && trend.trending_colors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Colors</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.trending_colors.map((color: string) => (
              <Badge key={color} variant="outline" className="capitalize text-xs">
                {color}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trend.trending_patterns && trend.trending_patterns.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Patterns</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.trending_patterns.map((pattern: string) => (
              <Badge key={pattern} variant="outline" className="capitalize text-xs">
                {pattern}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trend.trending_styles && trend.trending_styles.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Styles</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.trending_styles.map((style: string) => (
              <Badge key={style} variant="outline" className="capitalize text-xs">
                {style}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trend.trending_category_names && trend.trending_category_names.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.trending_category_names.map((categoryName: string) => (
              <Badge key={categoryName} variant="secondary" className="capitalize text-xs">
                {categoryName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trend.keywords && trend.keywords.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.keywords.map((keyword: string) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trend.external_source && trend.external_source !== 'manual' && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Source: {trend.external_source.replace('_', ' ').toUpperCase()}
          </p>
        </div>
      )}
    </article>
  )
}

function TrendsSkeleton() {
  return (
    <section>
      <div className="h-6 bg-muted rounded w-48 mb-4 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                <div className="h-4 bg-muted rounded w-48 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-6 bg-muted rounded w-12 animate-pulse" />
                <div className="h-6 bg-muted rounded w-12 animate-pulse" />
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-16 animate-pulse" />
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-5 bg-muted rounded w-14 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}