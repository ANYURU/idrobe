import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useClothingItems } from '@/lib/hooks'
import { useAuth } from '@/lib/hooks'

export default function TagsPage() {
  const { user } = useAuth()
  const { items } = useClothingItems(user?.id)

  // Collect all tags and their frequencies
  const tagStats = items.reduce((acc, item) => {
    if (item.style_tags) {
      item.style_tags.forEach((tag) => {
        if (!acc[tag]) {
          acc[tag] = {
            count: 0,
            items: [],
          }
        }
        acc[tag].count += 1
        acc[tag].items.push(item)
      })
    }
    return acc
  }, {} as Record<string, { count: number; items: any[] }>)

  const sortedTags = Object.entries(tagStats).sort((a, b) => b[1].count - a[1].count)

  const maxCount = sortedTags.length > 0 ? sortedTags[0][1].count : 1

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Style Tags</h1>
        <p className="text-slate-600 mt-1">Explore your wardrobe by style tags</p>
      </div>

      {sortedTags.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-600">No style tags yet</p>
            <p className="text-sm text-slate-500 mt-2">
              Add items to your wardrobe to see style tags
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tag Cloud */}
          <Card>
            <CardHeader>
              <CardTitle>Tag Cloud</CardTitle>
              <CardDescription>Visual representation of your style tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 justify-center">
                {sortedTags.map(([tag, stats]) => {
                  const size = Math.max(0.8, (stats.count / maxCount) * 2)
                  return (
                    <div
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                      style={{
                        fontSize: `${size}rem`,
                        fontWeight: stats.count > maxCount / 2 ? 'bold' : 'normal',
                      }}
                    >
                      {tag}
                      <span className="text-xs ml-1 opacity-70">({stats.count})</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tag Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedTags.map(([tag, stats]) => (
              <Card key={tag}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize text-lg">{tag}</CardTitle>
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(stats.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-2">Sample items:</p>
                    <div className="flex gap-2 flex-wrap">
                      {stats.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-12 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          title={item.name}
                        >
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {stats.items.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium">
                          +{stats.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
