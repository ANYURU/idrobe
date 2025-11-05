import { Form } from 'react-router'
import { Button } from '@/components/ui/button'
import { Heart, X } from 'lucide-react'
import { ClothingThumbnail } from '@/components/ClothingThumbnail'

interface OutfitRecommendationProps {
  recommendation: {
    id: string
    name: string
    description: string
    items?: Array<{
      id: string
      name: string
      image_url: string
    }>
    userInteraction?: {
      interaction_type_name: 'liked' | 'disliked'
    } | null
  }
  showInteractions?: boolean
  className?: string
}

export function OutfitRecommendation({ 
  recommendation, 
  showInteractions = true,
  className = ""
}: OutfitRecommendationProps) {
  const currentInteraction = recommendation.userInteraction?.interaction_type_name

  return (
    <div className={`p-3 bg-muted/50 rounded-lg space-y-3 ${className}`}>
      <div>
        <p className="font-medium text-sm">{recommendation.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {recommendation.description}
        </p>
      </div>
      
      {/* Outfit Items */}
      {recommendation.items && recommendation.items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {recommendation.items.slice(0, 4).map((item) => (
            <div key={item.id} className="shrink-0">
              <ClothingThumbnail
                filePath={item.image_url}
                alt={item.name}
                className="w-10 h-10 rounded border"
              />
            </div>
          ))}
          {recommendation.items.length > 4 && (
            <div className="shrink-0 w-10 h-10 rounded border bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">+{recommendation.items.length - 4}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Interaction Buttons */}
      {showInteractions && (
        <div className="flex gap-2 justify-end">
          <Form method="post" className="contents">
            <input type="hidden" name="recommendation_id" value={recommendation.id} />
            <input type="hidden" name="liked" value="true" />
            <Button
              type="submit"
              disabled={!!currentInteraction}
              variant={currentInteraction === 'liked' ? 'default' : 'ghost'}
              size="sm"
              className={`transition-all ${
                currentInteraction === 'liked' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : currentInteraction === 'disliked'
                  ? 'opacity-50'
                  : 'hover:text-green-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${
                currentInteraction === 'liked' ? 'fill-white' : ''
              }`} />
            </Button>
          </Form>
          
          <Form method="post" className="contents">
            <input type="hidden" name="recommendation_id" value={recommendation.id} />
            <input type="hidden" name="liked" value="false" />
            <Button
              type="submit"
              disabled={!!currentInteraction}
              variant={currentInteraction === 'disliked' ? 'default' : 'ghost'}
              size="sm"
              className={`transition-all ${
                currentInteraction === 'disliked'
                  ? 'bg-muted-foreground hover:bg-foreground text-background'
                  : currentInteraction === 'liked'
                  ? 'opacity-50'
                  : 'hover:text-muted-foreground'
              }`}
            >
              <X className="h-4 w-4" />
            </Button>
          </Form>
        </div>
      )}
      
      {/* Feedback Message */}
      {currentInteraction && (
        <div className={`text-center p-2 rounded text-xs transition-all duration-300 ${
          currentInteraction === 'liked' 
            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
            : 'bg-muted/50 text-muted-foreground'
        }`}>
          <p>
            {currentInteraction === 'liked' 
              ? "💚 Loved!" 
              : "👍 Thanks for the feedback!"
            }
          </p>
        </div>
      )}
    </div>
  )
}