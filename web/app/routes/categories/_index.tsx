import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useClothingItems } from '@/lib/hooks'
import { useAuth } from '@/lib/hooks'

const CATEGORY_ICONS: Record<string, string> = {
  'tops': '👕',
  'bottoms': '👖',
  'dresses': '👗',
  'outerwear': '🧥',
  'shoes': '👞',
  'accessories': '✨',
  'bags': '👜',
  'jewelry': '💍',
  'hats': '🎩',
  'scarves': '🧣',
  'belts': '⌛',
  'eyewear': '👓',
  'watches': '⌚',
  'activewear': '🏃',
  'swimwear': '🩱',
  'underwear': '🩲',
  'sleepwear': '😴',
  'formalwear': '🎩',
  'casualwear': '👕',
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const { items } = useClothingItems(user?.id)

  // Group items by category
  const categoryStats = items.reduce((acc, item) => {
    const categoryName = 'uncategorized' // TODO: Add proper category join
    if (!acc[categoryName]) {
      acc[categoryName] = {
        count: 0,
        colors: new Set<string>(),
        wears: 0,
      }
    }
    acc[categoryName].count += 1
    acc[categoryName].colors.add(item.primary_color)
    acc[categoryName].wears += (item.times_worn || 0)
    return acc
  }, {} as Record<string, { count: number; colors: Set<string>; wears: number }>)

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-slate-600 mt-1">Overview of your wardrobe by category</p>
      </div>

      {sortedCategories.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-600">No items in your wardrobe yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map(([category, stats]) => (
            <Card key={category} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="capitalize flex items-center gap-2">
                      <span className="text-2xl">
                        {CATEGORY_ICONS[category] || '📦'}
                      </span>
                      {category}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary">{stats.count}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Items</p>
                    <p className="text-2xl font-bold">{stats.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Wears</p>
                    <p className="text-2xl font-bold">{stats.wears}</p>
                  </div>
                </div>

                {stats.colors.size > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Colors</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(stats.colors)
                        .slice(0, 5)
                        .map((color) => (
                          <Badge key={color} variant="outline" className="text-xs capitalize">
                            {color}
                          </Badge>
                        ))}
                      {stats.colors.size > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{stats.colors.size - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-600">
                    Avg {(stats.wears / stats.count).toFixed(1)} wears per item
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
