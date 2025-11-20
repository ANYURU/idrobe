import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find accounts scheduled for hard deletion
    const { data: scheduledDeletions, error: fetchError } = await supabaseClient
      .from('account_deletion_logs')
      .select('user_id, email')
      .eq('deletion_type', 'soft')
      .lte('scheduled_hard_delete_at', new Date().toISOString())
      .is('completed_at', null)

    if (fetchError) {
      throw fetchError
    }

    const results = []
    
    for (const deletion of scheduledDeletions || []) {
      try {
        // Execute hard deletion
        const { error } = await supabaseClient.rpc('execute_hard_deletion', {
          target_user_id: deletion.user_id
        })

        if (error) {
          console.error(`Failed to delete user ${deletion.user_id}:`, error)
          results.push({ user_id: deletion.user_id, status: 'failed', error: error.message })
        } else {
          console.log(`Successfully deleted user ${deletion.user_id}`)
          results.push({ user_id: deletion.user_id, status: 'deleted' })
        }
      } catch (err) {
        console.error(`Error processing deletion for ${deletion.user_id}:`, err)
        results.push({ user_id: deletion.user_id, status: 'error', error: err.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
