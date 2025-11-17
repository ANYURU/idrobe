import { createClient } from '@/lib/supabase.server'

export async function action({ request }: { request: Request }) {
  const { supabase } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Get current avatar URL from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_image_url')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return { success: false, error: 'Failed to get profile' }
    }

    // Clear avatar URL from profile first
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_image_url: null })
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: 'Failed to update profile' }
    }

    // Delete file from storage if it exists
    if (profile.profile_image_url) {
      try {
        // Extract file path from URL
        const url = new URL(profile.profile_image_url)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(part => part === 'avatars')
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath])

          if (deleteError) {
            console.error('Failed to delete file from storage:', deleteError)
            // Don't fail the request - profile is already cleared
          }
        }
      } catch (error) {
        console.error('Error parsing avatar URL:', error)
        // Don't fail the request - profile is already cleared
      }
    }

    return { 
      success: true, 
      message: 'Avatar removed successfully'
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Remove failed' 
    }
  }
}