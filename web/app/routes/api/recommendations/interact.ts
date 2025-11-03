import type { Route } from './+types/interact'
import { createClient } from '@/lib/supabase.server'

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { supabase } = createClient(request)
  const formData = await request.formData()
  
  const liked = formData.get('liked') === 'true'
  const recommendationId = formData.get('recommendation_id') as string
  
  if (!recommendationId) {
    return Response.json({ error: 'Missing recommendation ID' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Save interaction
  const { error } = await supabase
    .from('user_interactions')
    .insert({
      user_id: user.id,
      recommendation_id: recommendationId,
      interaction_type_name: liked ? 'liked' : 'disliked',
    })

  if (error) {
    console.error('Failed to save interaction:', error)
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return Response.json({ success: true, liked })
}