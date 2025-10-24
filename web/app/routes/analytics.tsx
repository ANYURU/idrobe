import { useAuth } from '@/lib/hooks'
import { useClothingItems } from '@/lib/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Shirt, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { items } = useClothingItems(user?.id)

  // Calculate analytics
  const totalItems = items.length
  const categories = new Set(items.map(i => i.category)).size
  const totalWears = items.reduce((sum, item) => sum + item.times_worn, 0)
  const favoriteItems = items.filter(i => i.is_favorite).length
  
  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const colorBreakdown = items.reduce((acc, item) => {
    acc[item.primary_color] = (acc[item.primary_color] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostWornItems = items
    .filter(i => i.times_worn > 0)
    .sort((a, b) => b.times_worn - a.times_worn)
    .slice(0, 5)

  const avgWears = totalItems > 0 ? (totalWears / totalItems).toFixed(1) : '0'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wardrobe Analytics</h1>
        <p className="text-slate-600 mt-1">Insights about your clothing collection</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Shirt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-slate-600">{categories} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wears</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWears}</div>
            <p className="text-xs text-slate-600">Avg {avgWears} per item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoriteItems}</div>
            <p className="text-xs text-slate-600">
              {totalItems > 0 ? Math.round((favoriteItems / totalItems) * 100) : 0}% of wardrobe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversity</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories}</div>
            <p className="text-xs text-slate-600">Different categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
            <CardDescription>Distribution of your wardrobe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / totalItems) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Color Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Items by Color</CardTitle>
            <CardDescription>Your color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(colorBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([color, count]) => (
                <div key={color} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{color}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(count / totalItems) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Most Worn Items */}
      {mostWornItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Worn Items</CardTitle>
            <CardDescription>Your wardrobe favorites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mostWornItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-slate-400 w-8">
                    #{index + 1}
                  </div>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600 capitalize">{item.category}</p>
                  </div>
                  <Badge variant="secondary">{item.times_worn} wears</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
