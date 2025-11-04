import { redirect } from 'react-router'
import { supabase } from './supabase'

/**
 * Create a new clothing item
 */
export async function createClothingItem(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string
    const primaryColor = formData.get('primaryColor') as string
    const brand = formData.get('brand') as string
    const size = formData.get('size') as string
    const imageFile = formData.get('image') as File

    if (!imageFile) throw new Error('Image is required')

    // Upload image
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('clothing')
      .upload(fileName, imageFile)

    if (uploadError) throw uploadError

    // Get public URL
    const { data } = supabase.storage
      .from('clothing')
      .getPublicUrl(fileName)

    // Create clothing item
    const { error: insertError } = await supabase
      .from('clothing_items')
      .insert({
        user_id: user.id,
        name,
        category_id: categoryId || null,
        primary_color: primaryColor,
        brand: brand || null,
        size: size || null,
        image_url: data.publicUrl,
        ai_confidence_score: 0.8,
      })

    if (insertError) throw insertError

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create item',
    }
  }
}

/**
 * Update clothing item
 */
export async function updateClothingItem(itemId: string, formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const isFavorite = formData.get('isFavorite') === 'true'
    const isArchived = formData.get('isArchived') === 'true'
    const timesWorn = formData.get('timesWorn') as string

    const { error } = await supabase
      .from('clothing_items')
      .update({
        is_favorite: isFavorite,
        is_archived: isArchived,
        times_worn: timesWorn ? parseInt(timesWorn) : undefined,
      })
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    }
  }
}

/**
 * Delete clothing item
 */
export async function deleteClothingItem(itemId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete item',
    }
  }
}

/**
 * Create outfit collection
 */
export async function createOutfitCollection(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const itemIds = JSON.parse(formData.get('itemIds') as string) as string[]

    const { error } = await supabase
      .from('outfit_collections')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        clothing_item_ids: itemIds,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create outfit',
    }
  }
}

/**
 * Update outfit collection
 */
export async function updateOutfitCollection(collectionId: string, formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const isFavorite = formData.get('isFavorite') === 'true'
    const timesWorn = formData.get('timesWorn') as string

    const { error } = await supabase
      .from('outfit_collections')
      .update({
        is_favorite: isFavorite,
        times_worn: timesWorn ? parseInt(timesWorn) : undefined,
      })
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update outfit',
    }
  }
}

/**
 * Delete outfit collection
 */
export async function deleteOutfitCollection(collectionId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('outfit_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete outfit',
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const displayName = formData.get('displayName') as string
    const bodyType = formData.get('bodyType') as string
    const preferredFit = formData.get('preferredFit') as string
    const activityLevel = formData.get('activityLevel') as string
    const locationCity = formData.get('locationCity') as string
    const locationCountry = formData.get('locationCountry') as string

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        display_name: displayName || null,
        body_type: bodyType || null,
        preferred_fit: preferredFit || null,
        default_activity_level: activityLevel || null,
        location_city: locationCity || null,
        location_country: locationCountry || null,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}

/**
 * Record user interaction
 */
export async function recordInteraction(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const recommendationId = formData.get('recommendationId') as string
    const clothingItemId = formData.get('clothingItemId') as string
    const interactionType = formData.get('interactionType') as string
    const rating = formData.get('rating') as string
    const feedbackText = formData.get('feedbackText') as string

    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        recommendation_id: recommendationId || null,
        clothing_item_id: clothingItemId || null,
        interaction_type: interactionType,
        rating: rating ? parseInt(rating) : null,
        feedback_text: feedbackText || null,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record interaction',
    }
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const displayName = formData.get('displayName') as string
    const bodyType = formData.get('bodyType') as string
    const preferredFit = formData.get('preferredFit') as string
    const activityLevel = formData.get('activityLevel') as string

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        display_name: displayName || null,
        body_type: bodyType || null,
        preferred_fit: preferredFit || null,
        default_activity_level: activityLevel || null,
        onboarding_completed: true,
      })

    if (error) throw error

    throw redirect('/onboarding/complete')
  } catch (error) {
    if (error instanceof Response) throw error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding',
    }
  }
}
