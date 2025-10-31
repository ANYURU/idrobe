import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Integration test that hits real Supabase
describe('Recommendation Interaction Integration', () => {
  let supabase: any
  let testUserId: string
  let testRecommendationId: string

  beforeEach(async () => {
    // Use test Supabase instance
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )

    // Create test data
    testUserId = 'test-user-' + Date.now()
    testRecommendationId = 'test-rec-' + Date.now()
  })

  it('should save interaction to Supabase when love button is clicked', async () => {
    // Mock the interaction handler
    const handleInteraction = async (liked: boolean) => {
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: testUserId,
          recommendation_id: testRecommendationId,
          interaction_type: liked ? 'liked' : 'disliked',
        })

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
    }

    // Test the interaction
    await expect(handleInteraction(true)).resolves.not.toThrow()

    // Verify data was saved
    const { data, error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', testUserId)
      .eq('recommendation_id', testRecommendationId)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0].interaction_type).toBe('liked')
  })

  it('should handle Supabase errors gracefully', async () => {
    const handleInteraction = async (liked: boolean) => {
      // Intentionally cause an error with invalid data
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: null, // This should cause an error
          recommendation_id: testRecommendationId,
          interaction_type: liked ? 'liked' : 'disliked',
        })

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
    }

    await expect(handleInteraction(true)).rejects.toThrow('Supabase error')
  })
})