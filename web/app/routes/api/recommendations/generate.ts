import type { ActionFunctionArgs } from 'react-router'
// import { createClient } from '@/lib/supabase.server'
import { generateOnboardingRecommendations } from '@/lib/outfit-recommendations'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { requireAuth } = await import('@/lib/protected-route')
    const { user } = await requireAuth(request)
    
    const result = await generateOnboardingRecommendations(user.id, request)
    
    return Response.json(result)
  } catch (error) {
    console.error('API recommendation generation error:', error)
    return Response.json(
      { error: 'Unable to generate recommendations right now. Please try again.' },
      { status: 500 }
    )
  }
}