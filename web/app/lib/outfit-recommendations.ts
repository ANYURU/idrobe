import { createClient } from './supabase.server'

// Type definitions
interface OnboardingRecommendation {
  name: string
  description: string
  occasion: string[]
  season: string
  weather_condition?: string
  temperature_celsius?: number
  mood?: string
  style_vibe: string
  clothing_item_ids: string[]
  styling_reason: string
  ai_score: number
  style_coherence_score: number
  occasion_match_score: number
  weather_appropriateness_score: number
  beginner_friendly: boolean
}

interface WardrobeGap {
  gap_type: 'missing_basic' | 'color_variety' | 'versatile_piece'
  priority: 'high' | 'medium'
  description: string
  suggested_item: string
  category: string
  why_helpful: string
  works_with: string[]
}

interface AdvancedRecommendation {
  name: string
  description: string
  occasion: string[]
  season: string
  weather_condition: string
  style_vibe: string
  clothing_item_ids: string[]
  styling_tips: string
  accessory_suggestions: string[]
  confidence_score: number
  trend_alignment: string
  versatility_score: number
}

// Onboarding-specific recommendations (simplified)
export async function generateOnboardingRecommendations(userId: string, request: Request) {
  const { supabase } = createClient(request)
  
  // Get user's clothing items with category relationships
  const { data: items, error: itemsError } = await supabase
    .from('clothing_items')
    .select(`
      *,
      clothing_categories(name),
      clothing_subcategories(name)
    `)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return { error: 'Failed to fetch clothing items' }
  }

  if (!items || items.length < 2) {
    return { error: 'Need at least 2 items to generate outfits' }
  }

  // Get user preferences and location
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get current weather for user's location
  let weatherContext = 'mild weather'
  if (profile?.city && profile?.country) {
    try {
      // You can integrate with weather API here
      // For now, we'll use location info in the prompt
      weatherContext = `${profile.city}, ${profile.country} current conditions`
    } catch (error) {
      console.log('Weather fetch failed, using default')
    }
  }

  // Prepare simplified data for Gemini (onboarding focus)
  const itemsData = items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.clothing_categories?.name || item.category || 'unknown',
    subcategory: item.clothing_subcategories?.name || item.subcategory || 'unknown',
    primary_color: item.primary_color,
    secondary_colors: item.secondary_colors || [],
    style_tags: item.style_tags || [],
    season: item.season || ['all-season'],
    weather_suitable: item.weather_suitable || [],
    fit: item.fit || 'regular',
    material: item.material || []
  }))

  const prompt = `You are an expert fashion stylist creating FIRST-TIME outfit recommendations for a new user. This is their onboarding experience, so focus on:

1. SIMPLE, WEARABLE combinations (2-3 pieces max)
2. VERSATILE outfits for everyday occasions
3. CONFIDENCE-BUILDING styling that works for beginners
4. CLEAR explanations of why items work together

User Context:
- New to AI styling (keep it simple!)
- Location: ${profile?.city || 'Unknown'}, ${profile?.country || 'Unknown'}
- Current Weather: ${weatherContext}
- Body Type: ${profile?.body_type || 'not specified'}
- Preferred Fit: ${profile?.preferred_fit || 'regular'}
- Style Preferences: ${profile?.style_preferences?.join(', ') || 'exploring'}
- Color Preferences: ${profile?.color_preferences?.join(', ') || 'open to suggestions'}
- Activity Level: ${profile?.default_activity_level || 'moderate'}

Available Items (${items.length} total):
${JSON.stringify(itemsData, null, 2)}

Create 2-3 outfit recommendations following these ONBOARDING rules:
✓ Use 2-3 items maximum per outfit
✓ Consider current weather conditions for ${profile?.city || 'their location'}
✓ Focus on color harmony (complementary or matching colors)
✓ Ensure style_tags are compatible (don't mix formal + casual)
✓ Prioritize versatile, everyday occasions
✓ Account for local climate and seasonal appropriateness
✓ Explain WHY the combination works
✓ Build confidence with achievable styling

Return ONLY this JSON structure with EXPLICIT SCORING:
[
  {
    "name": "Simple, appealing outfit name",
    "description": "Why this combination works well together",
    "occasion": ["casual", "everyday", "work"],
    "season": "spring|summer|fall|winter|all-season",
    "weather_condition": "sunny|cloudy|rainy|mild|hot|cold",
    "temperature_celsius": 20,
    "mood": "confident|relaxed|professional|casual",
    "style_vibe": "relaxed|polished|trendy|classic",
    "clothing_item_ids": ["item_id_1", "item_id_2"],
    "styling_reason": "Clear explanation of color/style harmony",
    "ai_score": 0.85,
    "style_coherence_score": 0.90,
    "occasion_match_score": 0.88,
    "weather_appropriateness_score": 0.85,
    "beginner_friendly": true
  }
]

SCORING GUIDELINES (0.0-1.0):
- ai_score: Overall outfit quality and appeal
- style_coherence_score: How well items work together stylistically
- occasion_match_score: How appropriate for the specified occasions
- weather_appropriateness_score: Seasonal/weather suitability`

  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: 'Gemini API key not configured' }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText)
      return { error: `AI service unavailable (${response.status})` }
    }

    const result = await response.json()
    const recommendationsText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!recommendationsText) {
      console.error('Empty response from Gemini:', result)
      return { error: 'AI returned empty response' }
    }

    // Clean and validate JSON
    let cleanText = recommendationsText.replace(/```json\n?|```/g, '').trim()
    
    // Handle case where Gemini returns explanatory text before JSON
    const jsonStart = cleanText.indexOf('[')
    const jsonEnd = cleanText.lastIndexOf(']')
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No valid JSON array found in response:', cleanText)
      return { error: 'AI response format error' }
    }
    
    cleanText = cleanText.substring(jsonStart, jsonEnd + 1)
    
    const recommendations = JSON.parse(cleanText)

    const validRecommendations = (recommendations as OnboardingRecommendation[]).filter(rec => {
      const hasIds = rec.clothing_item_ids && rec.clothing_item_ids.length >= 2 && rec.clothing_item_ids.length <= 3
      const validIds = rec.clothing_item_ids?.every(id => items.find(item => item.id === id))
      return hasIds && validIds
    })

    console.log(`✅ Generated ${validRecommendations.length}/${recommendations.length} valid recommendations`)
    
    if (validRecommendations.length === 0) {
      return { error: 'No valid outfit combinations found' }
    }

    // Save recommendations to database
    const savedRecommendations = await Promise.all(validRecommendations.map(async rec => {
      const recommendationItems = rec.clothing_item_ids.map(id => {
        const item = items.find(item => item.id === id)
        if (!item) return null
        
        return {
          id: item.id,
          name: item.name,
          image_url: item.image_url,
          primary_color: item.primary_color,
          category: item.clothing_categories?.name || item.category || 'unknown',
          subcategory: item.clothing_subcategories?.name || item.subcategory
        }
      }).filter(Boolean)
      
      // Save to database
      const { data: savedRec, error: saveError } = await supabase
        .from('outfit_recommendations')
        .insert({
          user_id: userId,
          occasion_name: rec.occasion?.[0] || 'casual',
          season_name: rec.season || 'all-season',
          mood_name: rec.mood || 'confident',
          weather_condition_name: rec.weather_condition || 'mild',
          temperature_celsius: rec.temperature_celsius || 20,
          clothing_item_ids: rec.clothing_item_ids,
          ai_score: rec.ai_score || 0.8,
          style_coherence_score: rec.style_coherence_score || 0.8,
          occasion_match_score: rec.occasion_match_score || 0.8,
          weather_appropriateness_score: rec.weather_appropriateness_score || 0.8,
          recommendation_reason: rec.styling_reason || rec.description,
          based_on_past_preferences: false
        })
        .select()
        .single()
      
      if (saveError) {
        console.error('❌ Failed to save recommendation:', saveError.message)
        // Return with temp ID as fallback
        return {
          id: crypto.randomUUID(),
          user_id: userId,
          name: rec.name,
          description: rec.description,
          style_vibe: rec.style_vibe,
          styling_reason: rec.styling_reason,
          clothing_item_ids: rec.clothing_item_ids,
          ai_score: rec.ai_score || 0.8,
          items: recommendationItems
        }
      }
      
      return {
        ...savedRec,
        name: rec.name,
        description: rec.description,
        style_vibe: rec.style_vibe,
        styling_reason: rec.styling_reason,
        items: recommendationItems
      }
    }))

    return { 
      recommendations: savedRecommendations,
      total_items: items.length,
      onboarding: true
    }
  } catch (error) {
    console.error('Outfit generation error:', error)
    return { error: 'Failed to generate outfit recommendations' }
  }
}

export async function generateOnboardingGaps(userId: string, request: Request) {
  const { supabase } = createClient(request)
  
  const { data: items } = await supabase
    .from('clothing_items')
    .select(`
      primary_color, 
      style_tags, 
      season,
      categories(name),
      subcategories(name)
    `)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)

  if (!items || items.length === 0) {
    return { gaps: [] }
  }

  const categories = [...new Set(items.map(item => (item as any).categories?.name).filter(Boolean))]
  const colors = [...new Set(items.map(item => item.primary_color))]
  
  const prompt = `Analyze this BEGINNER wardrobe and suggest 2-3 key pieces that would dramatically improve outfit options.

Current Items (${items.length} pieces):
${JSON.stringify(items, null, 2)}

Focus on ONBOARDING priorities:
1. Essential basics missing (white shirt, jeans, etc.)
2. Color gaps that limit combinations
3. Versatile pieces that work with multiple existing items

Return JSON array (max 3 suggestions):
[
  {
    "gap_type": "missing_basic|color_variety|versatile_piece",
    "priority": "high|medium",
    "description": "Simple explanation for beginners",
    "suggested_item": "specific item name",
    "category": "clothing category",
    "why_helpful": "how this expands outfit options",
    "works_with": ["existing item names it pairs with"]
  }
]`

  try {
    if (!process.env.GEMINI_API_KEY) {
      return { gaps: [] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText)
      return { gaps: [] }
    }

    const result = await response.json()
    const gapsText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!gapsText) {
      return { gaps: [] }
    }

    // Clean and validate JSON
    let cleanText = gapsText.replace(/```json\n?|```/g, '').trim()
    
    const jsonStart = cleanText.indexOf('[')
    const jsonEnd = cleanText.lastIndexOf(']')
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1)
    }

    const gaps = JSON.parse(cleanText) as WardrobeGap[]
    
    return { 
      gaps: gaps.slice(0, 3), // Limit to 3 for onboarding
      current_categories: categories,
      current_colors: colors
    }
  } catch (error) {
    console.error('Gap analysis error:', error)
    return { gaps: [] }
  }
}

// Full-featured outfit recommendations for post-onboarding users
export async function generateOutfitRecommendations(userId: string, request: Request, options?: {
  weather?: string;
  season?: string;
  context?: string;
  refresh?: boolean;
  surprise?: boolean;
}) {
  const { supabase } = createClient(request)
  
  // Get user's clothing items
  const { data: items } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)

  if (!items || items.length < 2) {
    return { error: 'Need at least 2 items to generate outfits' }
  }

  // Get user preferences and past interactions
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: pastInteractions } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('interaction_type', 'liked')
    .limit(20)

  // Get recent recommendations to avoid duplicates if refreshing
  const { data: recentRecs } = options?.refresh ? await supabase
    .from('outfit_recommendations')
    .select('clothing_item_ids')
    .eq('user_id', userId)
    .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10) : { data: [] }

  // Get current trends
  const { data: trends } = await supabase
    .from('seasonal_trends')
    .select('*')
    .gte('valid_until', new Date().toISOString())
    .limit(3)

  const itemsData = items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    primary_color: item.primary_color,
    secondary_colors: item.secondary_colors || [],
    style_tags: item.style_tags || [],
    season: item.season || ['all-season'],
    weather_suitable: item.weather_suitable || [],
    fit: item.fit || 'regular',
    material: item.material || [],
    times_worn: item.times_worn || 0,
    last_worn_date: item.last_worn_date
  }))

  const prompt = `You are an expert fashion stylist creating personalized outfit recommendations.

${options?.surprise ? 'SURPRISE MODE: Focus heavily on user profile and past preferences to create delightful, personalized recommendations that feel like you truly know their style.' : ''}

User Profile:
- Body Type: ${profile?.body_type || 'not specified'}
- Preferred Fit: ${profile?.preferred_fit || 'regular'}
- Style Preferences: ${profile?.style_preferences?.join(', ') || 'exploring'}
- Color Preferences: ${profile?.color_preferences?.join(', ') || 'open to all'}
- Activity Level: ${profile?.default_activity_level || 'moderate'}
- Location: ${profile?.city || 'Unknown'}, ${profile?.country || 'Unknown'}

User Request: ${options?.context || 'Create versatile outfit recommendations'}

Context:
- Weather: ${options?.weather || 'mild'}
- Season: ${options?.season || 'current'}

Available Items (${items.length} total):
${JSON.stringify(itemsData, null, 2)}

Current Trends:
${JSON.stringify(trends?.map(t => ({ colors: t.trending_colors, styles: t.trending_styles })) || [], null, 2)}

Past Liked Combinations:
${JSON.stringify(pastInteractions?.slice(0, 5) || [], null, 2)}

${options?.refresh ? `Recent Combinations to Avoid (generate different ones):
${JSON.stringify(recentRecs?.map(r => r.clothing_item_ids) || [], null, 2)}` : ''}

Create 3-5 sophisticated outfit recommendations that directly address the user's request:
✓ Parse their natural language request for occasion, colors, style preferences, and constraints
✓ Use 2-5 items per outfit
✓ Respond specifically to their stated needs and context
${options?.refresh ? '✓ Generate DIFFERENT combinations than recent ones listed above' : ''}
${options?.surprise ? '✓ SURPRISE MODE: Leverage their style preferences, color preferences, and past interactions heavily' : ''}
${options?.surprise ? '✓ Create outfits that feel personally curated based on their profile data' : ''}
${options?.surprise ? '✓ Show you understand their style by referencing their preferences in recommendations' : ''}
✓ Extract color preferences, style requirements, and occasion details from their description
✓ Consider formality level, weather appropriateness, and mood from context
✓ Respect any specific constraints mentioned (colors, categories, themes)
✓ Consider color theory, proportions, and styling
✓ Incorporate current trends when appropriate
✓ Suggest accessories and styling details
✓ Consider item freshness (avoid recently worn pieces)
✓ Learn from past preferences
✓ Be creative with interpreting complex scenarios like themed parties or multi-part events

Return ONLY this JSON structure:
[
  {
    "name": "Sophisticated outfit name",
    "description": "Detailed styling description",
    "occasion": ["specific occasions"],
    "season": "appropriate season",
    "weather_condition": "suitable weather",
    "style_vibe": "aesthetic description",
    "clothing_item_ids": ["item_ids"],
    "styling_tips": "Specific styling advice",
    "accessory_suggestions": ["suggested accessories"],
    "confidence_score": 0.85,
    "trend_alignment": "how it relates to current trends",
    "versatility_score": 0.8
  }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const result = await response.json()
    const recommendationsText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!recommendationsText) {
      return { error: 'Failed to generate recommendations' }
    }

    // Clean and extract JSON from response
    let cleanText = recommendationsText.replace(/```json\n?|```/g, '').trim()
    
    // Find JSON array boundaries
    const jsonStart = cleanText.indexOf('[')
    const jsonEnd = cleanText.lastIndexOf(']')
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No valid JSON array found in response:', cleanText)
      return { error: 'AI response format error' }
    }
    
    cleanText = cleanText.substring(jsonStart, jsonEnd + 1)
    
    const recommendations = JSON.parse(cleanText)

    // Validate and save recommendations
    const validRecommendations = (recommendations as AdvancedRecommendation[]).filter(rec => 
      rec.clothing_item_ids && 
      rec.clothing_item_ids.length >= 2 &&
      rec.clothing_item_ids.every(id => items.find(item => item.id === id))
    )

    const savedRecommendations = []
    for (const rec of validRecommendations) {
      const { data: saved } = await supabase
        .from('outfit_recommendations')
        .insert({
          user_id: userId,
          occasion_name: rec.occasion?.[0] || 'casual',
          mood_name: 'confident',
          weather_condition_name: rec.weather_condition || options?.weather,
          season_name: rec.season || options?.season,
          clothing_item_ids: rec.clothing_item_ids,
          ai_score: rec.confidence_score || 0.8,
          style_coherence_score: rec.confidence_score || 0.8,
          occasion_match_score: rec.versatility_score || 0.8,
          recommendation_reason: rec.styling_tips || rec.description,
          based_on_past_preferences: pastInteractions && pastInteractions.length > 0
        })
        .select()
        .single()

      if (saved) {
        savedRecommendations.push({
          ...saved,
          name: rec.name,
          description: rec.description,
          style_vibe: rec.style_vibe,
          styling_tips: rec.styling_tips,
          accessory_suggestions: rec.accessory_suggestions,
          trend_alignment: rec.trend_alignment,
          items: rec.clothing_item_ids.map(id => items.find(item => item.id === id)).filter(Boolean)
        })
      }
    }

    return { 
      recommendations: savedRecommendations,
      generatedIds: savedRecommendations.map(rec => rec.id),
      total_items: items.length,
      context: options
    }
  } catch (error) {
    console.error('Outfit generation error:', error)
    return { error: 'Failed to generate outfit recommendations' }
  }
}

// Full wardrobe gap analysis for advanced users
export async function analyzeWardrobeGaps(userId: string, request: Request) {
  const { supabase } = createClient(request)
  
  const { data: items } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: interactions } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .limit(50)

  const prompt = `Analyze this comprehensive wardrobe and identify strategic gaps for a sophisticated user.

Wardrobe Analysis (${items?.length || 0} items):
${JSON.stringify(items, null, 2)}

User Profile:
${JSON.stringify(profile, null, 2)}

Interaction History:
${JSON.stringify(interactions?.slice(0, 10) || [], null, 2)}

Provide strategic wardrobe analysis:
1. Missing foundational pieces
2. Seasonal/weather gaps
3. Occasion-specific needs
4. Color palette expansion
5. Style evolution opportunities
6. Quality upgrade suggestions
7. Versatility improvements

Return JSON array (max 8 suggestions):
[
  {
    "gap_type": "foundational|seasonal|occasion|color|style_evolution|quality_upgrade|versatility",
    "priority": "critical|high|medium|low",
    "category": "clothing category",
    "description": "Detailed gap analysis",
    "suggested_items": ["specific items with details"],
    "reasoning": "Strategic reasoning",
    "impact_score": 0.8,
    "investment_level": "low|medium|high",
    "works_with_existing": ["existing item names"],
    "style_evolution": "how this advances their style"
  }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const result = await response.json()
    const gapsText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!gapsText) {
      return { gaps: [] }
    }

    const gaps = JSON.parse(gapsText.replace(/```json\n?|```/g, '').trim())
    
    // Save gaps to database
    for (const gap of gaps.slice(0, 8)) {
      await supabase
        .from('wardrobe_gaps')
        .upsert({
          user_id: userId,
          gap_type: gap.gap_type,
          category: gap.category,
          description: gap.description,
          priority: gap.priority === 'critical' ? 10 : gap.priority === 'high' ? 8 : gap.priority === 'medium' ? 5 : 3,
          suggested_items: gap.suggested_items,
          estimated_cost: gap.investment_level === 'high' ? 200 : gap.investment_level === 'medium' ? 100 : 50
        })
    }
    
    return { 
      gaps: gaps.slice(0, 8),
      wardrobe_size: items?.length || 0,
      analysis_depth: 'comprehensive'
    }
  } catch (error) {
    console.error('Gap analysis error:', error)
    return { gaps: [] }
  }
}