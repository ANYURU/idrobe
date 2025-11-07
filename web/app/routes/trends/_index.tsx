import { useLoaderData } from 'react-router'
import { Suspense, use } from 'react'
import type { Route } from './+types/_index'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

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
        .order('valid_from', { ascending: false })

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fashion Trends</h1>
        <p className="text-slate-600 mt-1">Stay updated with current and upcoming fashion trends</p>
      </div>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent trendsPromise={trendsPromise} />
      </Suspense>
    </div>
  )
}

function TrendsContent({ trendsPromise }: { trendsPromise: Promise<any> }) {
  const trends = use(trendsPromise)

  const currentTrends = trends.filter(trend => {
    const now = new Date()
    return new Date(trend.valid_from) <= now && now <= new Date(trend.valid_until)
  })

  const upcomingTrends = trends.filter(trend => {
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

function TrendCard({ trend, upcoming = false }: { trend: any; upcoming?: boolean }) {
  return (
    <Card className={upcoming ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="capitalize">
              {trend.season_name} {trend.year}
            </CardTitle>
            <CardDescription>
              {trend.region && `${trend.region} • `}
              {new Date(trend.valid_from).toLocaleDateString()} - {new Date(trend.valid_until).toLocaleDateString()}
            </CardDescription>
          </div>
          {trend.confidence_score && (
            <Badge variant="secondary">
              {Math.round(trend.confidence_score * 100)}%
            </Badge>
          )}
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