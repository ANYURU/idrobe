import { createClient } from '@/lib/supabase.server'

export async function action({ request }: { request: Request }) {
  const { supabase } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Get current tryon image path
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('virtual_tryon_image_url')
      .eq('user_id', user.id)
      .single()

    if (profile?.virtual_tryon_image_url) {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('tryon')
        .remove([profile.virtual_tryon_image_url])

      if (deleteError) {
        console.error('Failed to delete tryon image:', deleteError)
      }
    }

    // Clear from database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ virtual_tryon_image_url: null })
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { 
      success: true, 
      message: 'Try-on photo removed successfully' 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove photo' 
    }
  }
}