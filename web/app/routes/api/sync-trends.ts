import type { Route } from './+types/sync-trends'

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Call Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sync-trends`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return Response.json({ 
      success: true, 
      message: result.message || 'Trends synced successfully',
      trendsUpdated: result.trendsUpdated || 0
    })

  } catch (error) {
    console.error('Sync trends error:', error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}