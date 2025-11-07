import { useLoaderData } from 'react-router'
import type { Route } from './+types/_index'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  await requireAuth(request)
  const { createClient } = await import('@/lib/supabase.server')
  const { supabase } = createClient(request)

  const { data: trends } = await supabase
    .from('seasonal_trends')
    .select('*')
    .order('valid_from', { ascending: false })

  return { trends: trends || [] }
}

export default function TrendsPage() {
  const { trends } = useLoaderData<typeof loader>()

  const currentTrends = trends.filter(trend => {
    const now = new Date()
    return new Date(trend.valid_from) <= now && now <= new Date(trend.valid_until)
  })

  const upcomingTrends = trends.filter(trend => {
    const now = new Date()
    return new Date(trend.valid_from) > now
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fashion Trends</h1>
        <p className="text-slate-600 mt-1">Stay updated with current and upcoming fashion trends</p>
      </div>

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
              <Card key={trend.id}>
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

                  {trend.trending_category_ids && trend.trending_category_ids.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Trending Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {trend.trending_category_ids.map((cat: string) => (
                          <Badge key={cat} variant="secondary" className="capitalize">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <Card key={trend.id} className="opacity-75">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}