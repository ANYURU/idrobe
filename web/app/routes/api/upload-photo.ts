import { createClient } from '@/lib/supabase.server'

export async function action({ request }: { request: Request }) {
  const { supabase } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const bucket = formData.get('bucket') as string || 'clothing'

    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Generate filename with user folder
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) {
      return { success: false, error: error.message }
    }

    // For tryon bucket (private), update database and return signed URL
    if (bucket === 'tryon') {
      console.log('Tryon upload - fileName:', fileName)
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ virtual_tryon_image_url: fileName })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
      } else {
        console.log('Successfully updated profile with fileName:', fileName)
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 3600)
      
      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError)
        return { success: false, error: signedUrlError.message }
      }
      
      console.log('Generated signed URL:', signedUrlData.signedUrl)
      
      return { 
        success: true, 
        message: 'Photo uploaded successfully',
        data: { url: signedUrlData.signedUrl }
      }
    }

    // Get public URL for public buckets
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    // Update user profile with new avatar URL (for avatars bucket)
    if (bucket === 'avatars') {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        // Don't fail the upload, just log the error
      }
    }

    return { 
      success: true, 
      message: 'Photo uploaded successfully',
      data: { url: publicUrl }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}