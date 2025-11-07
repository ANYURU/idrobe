import { useLoaderData, useRevalidator } from 'react-router'
import { Suspense, use, useEffect } from 'react'
import type { Route } from './+types/_index'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Clock, Globe } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

type SeasonalTrend = Tables<'seasonal_trends'>
type EnrichedTrend = SeasonalTrend & {
  trending_category_names: string[]
}

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

  // Set up real-time subscription
  useEffect(() => {
    const { createClient } = require('@/lib/supabase.client')
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
  }, [revalidator])

  const handleSyncTrends = async () => {
    try {
      const response = await fetch('/api/sync-trends', { method: 'POST' })
      if (response.ok) {
        revalidator.revalidate()
      }
    } catch (error) {
      console.error('Failed to sync trends:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            Fashion Trends
          </h1>
          <p className="text-slate-600 mt-1">Real-time fashion trends powered by AI and social data</p>
        </div>
        <Button onClick={handleSyncTrends} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Sync Latest
        </Button>
      </div>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent trendsPromise={trendsPromise} />
      </Suspense>
    </div>
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
      {/* Current Trends */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Current Trends
        </h2>
        {currentTrends.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center text-slate-600">
              No current trends available
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Trends */}
      {upcomingTrends.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} upcoming />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function TrendCard({ trend, upcoming = false }: { trend: EnrichedTrend; upcoming?: boolean }) {
  const isExternal = trend.external_source !== 'manual'
  const trendScore = trend.trend_score || 0.5
  const popularityScore = trend.popularity_score || 50
  
  return (
    <Card className={upcoming ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="capitalize flex items-center gap-2">
              {trend.season_name} {trend.year}
              {isExternal && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {trend.region && `${trend.region} • `}
              {new Date(trend.valid_from).toLocaleDateString()} - {new Date(trend.valid_until).toLocaleDateString()}
              {trend.last_synced_at && (
                <span className="block text-xs mt-1">
                  Updated: {new Date(trend.last_synced_at).toLocaleString()}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">
              {Math.round(trendScore * 100)}% trend
            </Badge>
            <Badge variant="outline">
              {popularityScore}% popular
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {trend.trend_description && (
          <p className="text-sm text-slate-700">{trend.trend_description}</p>
        )}

        {trend.trending_colors && trend.trending_colors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Trending Colors</p>
            <div className="flex flex-wrap gap-2">
              {trend.trending_colors.map((color: string) => (
                <Badge key={color} variant="outline" className="capitalize">
                  {color}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trend.trending_patterns && trend.trending_patterns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Trending Patterns</p>
            <div className="flex flex-wrap gap-2">
              {trend.trending_patterns.map((pattern: string) => (
                <Badge key={pattern} variant="outline" className="capitalize">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trend.trending_styles && trend.trending_styles.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Trending Styles</p>
            <div className="flex flex-wrap gap-2">
              {trend.trending_styles.map((style: string) => (
                <Badge key={style} variant="outline" className="capitalize">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trend.trending_category_names && trend.trending_category_names.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Trending Categories</p>
            <div className="flex flex-wrap gap-2">
              {trend.trending_category_names.map((categoryName: string) => (
                <Badge key={categoryName} variant="secondary" className="capitalize">
                  {categoryName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trend.keywords && trend.keywords.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {trend.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trend.external_source && trend.external_source !== 'manual' && (
          <div className="pt-2 border-t">
            <p className="text-xs text-slate-500">
              Source: {trend.external_source.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrendsSkeleton() {
  return (
    <>
      <div>
        <div className="h-8 bg-slate-200 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-12 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-6 bg-slate-200 rounded w-16 animate-pulse" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}