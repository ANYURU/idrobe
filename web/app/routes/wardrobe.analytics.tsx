import { Link } from 'react-router'
import type { Route } from './+types/wardrobe.analytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Star,
  Zap,
} from 'lucide-react'
import { ClothingImageCard } from '@/components/ClothingImageCard'
import { Suspense, use } from 'react'
import type { Tables } from '@/lib/database.types'

type ClothingItem = Tables<'clothing_items'> & {
  clothing_categories?: { id: string; name: string } | null
}

type ItemWithCostPerWear = ClothingItem & {
  costPerWear: number
}

type CategoryStats = {
  count: number
  totalWears: number
  totalCost: number
}

type AnalyticsData = {
  overview: {
    totalItems: number
    totalCost: number
    totalWears: number
    avgCostPerWear: number
    avgWearsPerItem: number
    favoriteItems: number
  }
  mostWorn: ClothingItem[]
  leastWorn: ClothingItem[]
  bestROI: ItemWithCostPerWear[]
  worstROI: ItemWithCostPerWear[]
  categoryStats: Record<string, CategoryStats>
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { createClient } = await import('@/lib/supabase.server')
  const { supabase } = createClient(request)

  return {
    analyticsPromise: (async () => {
      // Fetch clothing items with category data
      const { data: items } = await supabase
        .from('clothing_items')
        .select(`
          *,
          clothing_categories!category_id(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .is('deleted_at', null)

      const itemsData = items || []
      const totalItems = itemsData.length
      const totalCost = itemsData.reduce((sum, item) => sum + (item.cost || 0), 0)
      const totalWears = itemsData.reduce((sum, item) => sum + (item.times_worn || 0), 0)
      const avgCostPerWear = totalWears > 0 ? totalCost / totalWears : 0

      // Most worn items (top performers)
      const mostWorn = itemsData
        .filter(item => (item.times_worn || 0) > 0)
        .sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0))
        .slice(0, 8)

      // Least worn items (underutilized)
      const leastWorn = itemsData
        .filter(item => (item.times_worn || 0) === 0 && 
          new Date(item.created_at).getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000)) // older than 30 days
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)

      // Best ROI items (cost per wear)
      const bestROI = itemsData
        .filter(item => (item.times_worn || 0) > 0 && item.cost)
        .map(item => ({
          ...item,
          costPerWear: item.cost! / item.times_worn!
        }))
        .sort((a, b) => a.costPerWear - b.costPerWear)
        .slice(0, 8)

      // Worst ROI items
      const worstROI = itemsData
        .filter(item => (item.times_worn || 0) > 0 && item.cost)
        .map(item => ({
          ...item,
          costPerWear: item.cost! / item.times_worn!
        }))
        .sort((a, b) => b.costPerWear - a.costPerWear)
        .slice(0, 8)

      // Category analysis
      const categoryStats = itemsData.reduce((acc, item) => {
        const categoryName = item.clothing_categories?.name || 'uncategorized'
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, totalWears: 0, totalCost: 0 }
        }
        acc[categoryName].count++
        acc[categoryName].totalWears += item.times_worn || 0
        acc[categoryName].totalCost += item.cost || 0
        return acc
      }, {} as Record<string, { count: number; totalWears: number; totalCost: number }>)

      return {
        overview: {
          totalItems,
          totalCost,
          totalWears,
          avgCostPerWear,
          avgWearsPerItem: totalItems > 0 ? totalWears / totalItems : 0,
          favoriteItems: itemsData.filter(i => i.is_favorite).length
        },
        mostWorn,
        leastWorn,
        bestROI,
        worstROI,
        categoryStats
      }
    })()
  }
}

export default function AnalyticsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm">
            <Link to="/wardrobe" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/wardrobe">Wardrobe</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent analyticsPromise={loaderData.analyticsPromise} />
      </Suspense>
    </div>
  )
}

function AnalyticsContent({ analyticsPromise }: { analyticsPromise: Promise<AnalyticsData> }) {
  const data = use(analyticsPromise)
  const { overview, mostWorn, leastWorn, bestROI, worstROI, categoryStats } = data

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-bold">Wardrobe Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights to optimize your wardrobe usage and spending
        </p>
      </header>

      {/* Overview Stats */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-medium">Total Items</p>
            </div>
            <p className="text-2xl font-bold">{overview.totalItems}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium">Total Value</p>
            </div>
            <p className="text-2xl font-bold">${overview.totalCost.toFixed(0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-medium">Avg Cost/Wear</p>
            </div>
            <p className="text-2xl font-bold">
              {overview.avgCostPerWear > 0 ? `$${overview.avgCostPerWear.toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Star className="h-4 w-4" />
              <p className="text-xs font-medium">Favorites</p>
            </div>
            <p className="text-2xl font-bold">{overview.favoriteItems}</p>
            <p className="text-xs text-muted-foreground">
              {overview.totalItems > 0 ? Math.round((overview.favoriteItems / overview.totalItems) * 100) : 0}% of wardrobe
            </p>
          </div>
        </div>
      </section>

      {/* Most Worn Items */}
      {mostWorn.length > 0 && (
        <section className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Top Performers
              </h2>
              <p className="text-sm text-muted-foreground">Your most worn items</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mostWorn.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`} state={{ from: '/wardrobe/analytics' }}>
                <article className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-background mb-2">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.times_worn} wears
                    </Badge>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.clothing_categories?.name || 'uncategorized'}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Underutilized Items */}
      {leastWorn.length > 0 && (
        <section className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Underutilized Items
              </h2>
              <p className="text-sm text-muted-foreground">Items you haven't worn yet</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {leastWorn.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`} state={{ from: '/wardrobe/analytics' }}>
                <article className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-background mb-2">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs">
                      Never worn
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - new Date(item.created_at || '').getTime()) / (1000 * 60 * 60 * 24))}d ago
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best ROI */}
      {bestROI.length > 0 && (
        <section className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Best Value Items
              </h2>
              <p className="text-sm text-muted-foreground">Lowest cost per wear</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestROI.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`} state={{ from: '/wardrobe/analytics' }}>
                <article className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-background mb-2">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-xs">
                      ${item.costPerWear.toFixed(2)}/wear
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {item.times_worn} wears
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Worst ROI */}
      {worstROI.length > 0 && (
        <section className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Expensive Per Wear
              </h2>
              <p className="text-sm text-muted-foreground">Items with high cost per wear</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {worstROI.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`} state={{ from: '/wardrobe/analytics' }}>
                <article className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-background mb-2">
                    <ClothingImageCard
                      filePath={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="destructive" className="text-xs">
                      ${item.costPerWear.toFixed(2)}/wear
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {item.times_worn} wears
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Performance */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Category Performance</h2>
        <div className="space-y-4">
          {Object.entries(categoryStats)
            .sort((a, b) => b[1].totalWears - a[1].totalWears)
            .slice(0, 6)
            .map(([category, stats]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium capitalize">{category}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.count} items • {stats.totalWears} total wears
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${stats.totalCost.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalWears > 0 ? `$${(stats.totalCost / stats.totalWears).toFixed(2)}/wear` : 'No wears'}
                  </p>
                </div>
              </div>
            ))}
          {Object.keys(categoryStats).length > 6 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              Showing top 6 categories by wear count
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function AnalyticsSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </header>
      
      <section className="bg-muted/30 rounded-lg p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </section>

      {[...Array(3)].map((_, i) => (
        <section key={i} className="bg-muted/30 rounded-lg p-6">
          <div className="mb-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
