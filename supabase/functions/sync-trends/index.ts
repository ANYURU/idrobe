import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'
import { corsHeaders } from '../_shared/cors.ts'

interface TrendData {
  season_name: string
  year: number
  trending_colors: string[]
  trending_patterns: string[]
  trending_styles: string[]
  trending_category_ids: string[]
  trend_description: string
  source: string
  external_source: string
  confidence_score: number
  trend_score: number
  keywords: string[]
  popularity_score: number
  valid_from: string
  valid_until: string
  region: string
  sync_metadata: Record<string, string | number | boolean>
}

// Generate trends using Gemini AI
async function fetchTrendsWithGemini(): Promise<TrendData[]> {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  let season = 'spring'
  let seasonDates = { from: `${currentYear}-03-01`, until: `${currentYear}-05-31` }
  
  if (currentMonth >= 11 || currentMonth <= 1) {
    season = 'winter'
    seasonDates = { from: `${currentYear}-12-01`, until: `${currentYear + 1}-02-28` }
  } else if (currentMonth >= 2 && currentMonth <= 4) {
    season = 'spring'
    seasonDates = { from: `${currentYear}-03-01`, until: `${currentYear}-05-31` }
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    season = 'summer'
    seasonDates = { from: `${currentYear}-06-01`, until: `${currentYear}-08-31` }
  } else if (currentMonth >= 8 && currentMonth <= 10) {
    season = 'fall'
    seasonDates = { from: `${currentYear}-09-01`, until: `${currentYear}-11-30` }
  }

  const prompt = `You are a fashion trend analyst. Generate current fashion trends for ${season} ${currentYear}.

Provide comprehensive trend analysis including:
- Trending colors (5-8 specific color names)
- Trending patterns (3-5 patterns)
- Trending styles (4-6 style aesthetics)
- Trending categories (3-5 clothing categories like "outerwear", "dresses", "boots")
- Fashion keywords (8-10 trending terms)
- Brief trend description

Consider:
- Current season: ${season}
- Year: ${currentYear}
- Global fashion weeks
- Social media trends
- Sustainable fashion movement
- Street style influences

Return ONLY valid JSON:
{
  "trending_colors": ["color1", "color2", ...],
  "trending_patterns": ["pattern1", "pattern2", ...],
  "trending_styles": ["style1", "style2", ...],
  "trending_categories": ["category1", "category2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "trend_description": "Brief overview of ${season} ${currentYear} fashion trends",
  "trend_score": 0.85,
  "popularity_score": 85
}`

  try {
    console.log('Checking GEMINI_API_KEY...')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error('GEMINI_API_KEY not found in environment')
      throw new Error('GEMINI_API_KEY not configured')
    }
    console.log('GEMINI_API_KEY found, length:', geminiKey.length)

    console.log('Calling Gemini API...')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    console.log('Gemini API response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Gemini API result received')
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!text) {
      console.error('Empty text from Gemini, full result:', JSON.stringify(result))
      throw new Error('Empty response from Gemini')
    }

    console.log('Gemini response text length:', text.length)
    const cleanText = text.replace(/```json\n?|```/g, '').trim()
    console.log('Parsing JSON...')
    const trendData = JSON.parse(cleanText)
    console.log('Trend data parsed successfully:', Object.keys(trendData))

    return [{
      season_name: season,
      year: currentYear,
      trending_colors: trendData.trending_colors || [],
      trending_patterns: trendData.trending_patterns || [],
      trending_styles: trendData.trending_styles || [],
      trending_category_ids: [],
      trend_description: trendData.trend_description || `${season} ${currentYear} fashion trends`,
      source: 'ai-analysis',
      external_source: 'gemini_ai',
      confidence_score: trendData.trend_score || 0.8,
      trend_score: trendData.trend_score || 0.8,
      keywords: trendData.keywords || [],
      popularity_score: trendData.popularity_score || 80,
      valid_from: seasonDates.from,
      valid_until: seasonDates.until,
      region: 'global',
      sync_metadata: { 
        source: 'gemini_ai',
        model: 'gemini-2.5-flash',
        sync_time: new Date().toISOString()
      }
    }]
  } catch (error) {
    console.error('Gemini AI error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.log('Falling back to seasonal defaults')
    return getFallbackTrends(season, currentYear, seasonDates)
  }
}

function getFallbackTrends(season: string, year: number, dates: { from: string, until: string }): TrendData[] {
  const seasonalDefaults = {
    winter: {
      colors: ['burgundy', 'forest-green', 'navy', 'camel'],
      patterns: ['plaid', 'houndstooth', 'cable-knit'],
      styles: ['layered', 'cozy', 'sophisticated'],
      categories: ['outerwear', 'boots', 'sweaters']
    },
    spring: {
      colors: ['pastel-pink', 'mint-green', 'lavender', 'coral'],
      patterns: ['floral', 'gingham', 'polka-dot'],
      styles: ['romantic', 'fresh', 'feminine'],
      categories: ['dresses', 'skirts', 'light-jackets']
    },
    summer: {
      colors: ['coral', 'turquoise', 'sunshine-yellow', 'white'],
      patterns: ['tropical', 'tie-dye', 'geometric'],
      styles: ['bohemian', 'resort', 'casual'],
      categories: ['shorts', 'sandals', 'tank-tops']
    },
    fall: {
      colors: ['rust', 'olive-green', 'mustard', 'burgundy'],
      patterns: ['plaid', 'leopard', 'houndstooth'],
      styles: ['preppy', 'academia', 'vintage'],
      categories: ['blazers', 'ankle-boots', 'cardigans']
    }
  }

  const defaults = seasonalDefaults[season as keyof typeof seasonalDefaults] || seasonalDefaults.spring
  
  return [{
    season_name: season,
    year,
    trending_colors: defaults?.colors || [],
    trending_patterns: defaults?.patterns || [],
    trending_styles: defaults?.styles || [],
    trending_category_ids: [],
    trend_description: `${season.charAt(0).toUpperCase() + season.slice(1)} ${year} trends (fallback data)`,
    source: 'ai-analysis',
    external_source: 'fallback',
    confidence_score: 0.6,
    trend_score: 0.6,
    keywords: [`${season} fashion`],
    popularity_score: 60,
    valid_from: dates.from,
    valid_until: dates.until,
    region: 'global',
    sync_metadata: { source: 'fallback', reason: 'api_unavailable' }
  }]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting sync-trends function...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing')
    }
    
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY missing')
    }
    
    console.log('Environment variables validated')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Mark sync job as running
    const { data: _syncJob } = await supabase
      .from('trend_sync_jobs')
      .update({ 
        status: 'running', 
        last_run_at: new Date().toISOString() 
      })
      .eq('source', 'google_trends')
      .select()
      .single()

    // Fetch trend data from Gemini AI
    console.log('Fetching trends from Gemini AI...')
    const trends = await fetchTrendsWithGemini()
    console.log('Trends fetched:', trends.length)
    let updatedCount = 0

    // Upsert trends to database
    console.log('Upserting trends to database...')
    for (const trend of trends) {
      console.log('Upserting trend:', trend.season_name, trend.year)
      
      // Extract categories before upserting
      const trendingCategories = (trend as any).trending_categories || []
      const trendWithoutCategories = { ...trend }
      delete (trendWithoutCategories as any).trending_categories
      
      const { data: upsertedTrend, error } = await supabase
        .from('seasonal_trends')
        .upsert({
          ...trendWithoutCategories,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'season_name,year,region',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (error) {
        console.error('Upsert error:', error)
      } else {
        updatedCount++
        console.log('Trend upserted successfully, ID:', upsertedTrend.id)
        
        // Add trending categories using RPC function
        if (trendingCategories.length > 0) {
          console.log('Adding trending categories:', trendingCategories)
          const { error: categoryError } = await supabase.rpc('add_trending_categories_to_trend', {
            trend_id: upsertedTrend.id,
            category_names: trendingCategories
          })
          
          if (categoryError) {
            console.error('Category linking error:', categoryError)
          } else {
            console.log('Categories linked successfully')
          }
        }
      }
    }

    // Update sync job status
    await supabase
      .from('trend_sync_jobs')
      .update({ 
        status: 'completed',
        trends_updated: updatedCount,
        next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Next run in 6 hours
        error_message: null
      })
      .eq('source', 'google_trends')

    // Update trend scores
    await supabase.rpc('update_trend_scores')

    return new Response(
      JSON.stringify({ 
        success: true, 
        trendsUpdated: updatedCount,
        message: `Successfully synced ${updatedCount} trends`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error syncing trends:', error)

    // Mark sync job as failed
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('trend_sync_jobs')
      .update({ 
        status: 'failed',
        error_message: (error as Error).message || 'Unknown error',
        next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Retry in 1 hour
      })
      .eq('source', 'google_trends')

    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Unknown error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})