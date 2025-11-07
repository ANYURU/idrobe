import { createClient } from './supabase.server'
import { getDailyOutfitData } from './daily-outfit.server'

/**
 * Load user profile
 */
export async function loadUserProfile(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to load profile')
  }

  return data || null
}

/**
 * Load all clothing items for user
 */
export async function loadClothingItems(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data || []
}

/**
 * Load single clothing item
 */
export async function loadClothingItem(userId: string, itemId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error('Clothing item not found')
  }

  // Return item with file path for client-side URL generation

  return data
}

/**
 * Load outfit recommendations with clothing item details
 */
export async function loadOutfitRecommendations(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('outfit_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error('Failed to load recommendations')
  }

  // Fetch clothing items for each recommendation
  const recommendationsWithItems = await Promise.all(
    (data || []).map(async (rec) => {
      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, image_url, primary_color')
        .in('id', rec.clothing_item_ids)
        .eq('user_id', userId)
      
      return { ...rec, clothing_items: items || [] }
    })
  )

  return recommendationsWithItems
}

/**
 * Load single outfit recommendation
 */
export async function loadOutfitRecommendation(userId: string, recommendationId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('outfit_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error('Recommendation not found')
  }

  return data
}

/**
 * Load outfit collections with clothing item details
 */
export async function loadOutfitCollections(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('outfit_collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to load collections')
  }

  // Fetch clothing items for each collection
  const collectionsWithItems = await Promise.all(
    (data || []).map(async (collection) => {
      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, image_url, primary_color')
        .in('id', collection.clothing_item_ids)
        .eq('user_id', userId)
      
      return { ...collection, clothing_items: items || [] }
    })
  )

  return collectionsWithItems
}

/**
 * Load single outfit collection
 */
export async function loadOutfitCollection(userId: string, collectionId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('outfit_collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error('Collection not found')
  }

  return data
}

/**
 * Load wardrobe gaps
 */
export async function loadWardrobeGaps(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('wardrobe_gaps')
    .select('*')
    .eq('user_id', userId)
    .eq('is_addressed', false)
    .order('priority', { ascending: false })

  if (error) {
    console.error('Wardrobe gaps query error:', error)
    return []
  }

  return data || []
}

/**
 * Load seasonal trends
 */
export async function loadSeasonalTrends(request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('seasonal_trends')
    .select('*')
    .eq('region', 'global')
    .order('valid_from', { ascending: false })

  if (error) {
    throw new Error('Failed to load trends')
  }

  return data || []
}

/**
 * Load clothing categories
 */
export async function loadClothingCategories(request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('clothing_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error('Failed to load categories')
  }

  return data || []
}

/**
 * Load style tags
 */
export async function loadStyleTags(request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('style_tags')
    .select('*')
    .eq('is_active', true)
    .order('popularity_score', { ascending: false })

  if (error) {
    throw new Error('Failed to load style tags')
  }

  return data || []
}

/**
 * Load wardrobe analytics
 */
export async function loadWardrobeAnalytics(userId: string, request: Request) {
  const { supabase } = createClient(request)
  const { data, error } = await supabase
    .from('user_wardrobe_analytics')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to load analytics')
  }

  return data || null
}

/**
 * Parallel loader for dashboard with timeout protection
 */
export async function loadDashboardData(userId: string, request: Request) {
  try {
    // Add timeout wrapper to prevent hanging
    return await Promise.race([
      loadDashboardDataInternal(userId, request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard data timeout')), 20000) // 20 second timeout
      )
    ]);
  } catch (error) {
    console.error('❌ Dashboard data error:', error);
    // Return minimal fallback data on timeout/error
    return {
      profile: null,
      items: [],
      recommendations: [],
      collections: [],
      gaps: [],
      analytics: null,
      dailyOutfit: {
        weather: null,
        recommendations: [],
        hasWeatherMatch: false
      },
    };
  }
}

async function loadDashboardDataInternal(userId: string, request: Request) {
  const [profile, items, recommendations, collections, gaps, analytics] = await Promise.all([
    loadUserProfile(userId, request),
    loadClothingItems(userId, request),
    loadOutfitRecommendations(userId, request),
    loadOutfitCollections(userId, request),
    loadWardrobeGaps(userId, request),
    loadWardrobeAnalytics(userId, request),
  ])

  // Get daily outfit recommendations based on weather
  const dailyOutfit = await getDailyOutfitData(userId, profile, request)

  return {
    profile,
    items,
    recommendations,
    collections,
    gaps,
    analytics,
    dailyOutfit,
  }
}
