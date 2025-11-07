import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'
import { corsHeaders } from '../_shared/cors.ts'

interface TrendData {
  season_name: string
  year: number
  trending_colors: string[]
  trending_patterns: string[]
  trending_styles: string[]
  trending_category_ids: string[]
  trend_description: string
  external_source: string
  trend_score: number
  keywords: string[]
  popularity_score: number
  valid_from: string
  valid_until: string
  region: string
  sync_metadata: Record<string, string | number | boolean>
}

interface KeywordRow {
  keyword: string
}

// Dynamic keyword fetching from database
async function getFashionKeywords(supabase: SupabaseClient): Promise<string[]> {
  const { data: keywords } = await supabase
    .from('trend_keywords')
    .select('keyword')
    .eq('category', 'fashion')
    .order('search_volume', { ascending: false })
    .limit(20)

  const dbKeywords = keywords?.map((k: KeywordRow) => k.keyword) || []
  
  // Fallback keywords if database is empty
  const fallbackKeywords = [
    'fashion', 'style', 'outfit', 'clothing', 'trend', 'wear',
    'dress', 'shirt', 'pants', 'shoes', 'accessories'
  ]
  
  // Seed database with initial keywords if empty
  if (dbKeywords.length === 0) {
    await seedInitialKeywords(supabase)
    return fallbackKeywords
  }
  
  return dbKeywords
}

// Fuzzy matching for fashion-related content
function isFashionRelated(query: string, keywords: string[]): boolean {
  const lowerQuery = query.toLowerCase()
  
  // Direct keyword matches
  if (keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
    return true
  }
  
  // Fashion-related terms (always relevant)
  const coreTerms = ['fashion', 'style', 'outfit', 'clothing', 'wear', 'trend']
  if (coreTerms.some(term => lowerQuery.includes(term))) {
    return true
  }
  
  // Clothing categories
  const clothingTerms = [
    'dress', 'shirt', 'pants', 'jeans', 'skirt', 'jacket', 'coat',
    'shoes', 'boots', 'sneakers', 'bag', 'accessories', 'jewelry'
  ]
  if (clothingTerms.some(term => lowerQuery.includes(term))) {
    return true
  }
  
  return false
}

interface GoogleTrendItem {
  title?: {
    query?: string
  }
}

interface GoogleTrendsResponse {
  default?: {
    trendingSearchesDays?: Array<{
      trendingSearches?: GoogleTrendItem[]
    }>
  }
}



// Fetch Google Trends data using unofficial API
async function fetchGoogleTrends(): Promise<TrendData[]> {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  // Determine current season
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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get current fashion keywords from database
    const fashionKeywords = await getFashionKeywords(supabase)
    
    // Use Google Trends unofficial API (pytrends equivalent for web)
    const trendsUrl = 'https://trends.google.com/trends/api/dailytrends'
    const params = new URLSearchParams({
      hl: 'en-US',
      tz: '-480',
      geo: 'US',
      ns: '15'
    })

    const response = await fetch(`${trendsUrl}?${params}`)
    const rawData = await response.text()
    
    // Parse Google Trends response (remove )]}' prefix)
    const jsonData = JSON.parse(rawData.substring(5)) as GoogleTrendsResponse
    const trendingSearches = jsonData.default?.trendingSearchesDays?.[0]?.trendingSearches || []
    
    // Filter fashion-related trends using dynamic keywords
    const fashionTrends = trendingSearches.filter((trend: GoogleTrendItem) => {
      const query = trend.title?.query || ''
      return isFashionRelated(query, fashionKeywords)
    })
    
    // Store new trending keywords in database
    await updateTrendKeywords(supabase, fashionTrends)

    // Extract trending keywords
    const trendingKeywords = fashionTrends
      .map((trend: GoogleTrendItem) => trend.title?.query)
      .filter((query: string | undefined): query is string => Boolean(query))
      .slice(0, 10)
    
    // Analyze trends to extract colors, patterns, styles
    const trendingColors = extractTrendingColors(fashionTrends)
    const trendingPatterns = extractTrendingPatterns(fashionTrends)
    const trendingStyles = extractTrendingStyles(fashionTrends)
    
    const trendData: TrendData = {
      season_name: season,
      year: currentYear,
      trending_colors: trendingColors,
      trending_patterns: trendingPatterns,
      trending_styles: trendingStyles,
      trending_category_ids: [],
      trend_description: `${season.charAt(0).toUpperCase() + season.slice(1)} ${currentYear} trends based on Google search data`,
      external_source: 'google_trends',
      trend_score: Math.min(fashionTrends.length / 10, 1), // Score based on trend volume
      keywords: trendingKeywords,
      popularity_score: Math.min(fashionTrends.length * 5, 100),
      valid_from: seasonDates.from,
      valid_until: seasonDates.until,
      region: 'US',
      sync_metadata: { 
        source: 'google_trends_api', 
        trends_found: fashionTrends.length,
        sync_time: new Date().toISOString()
      }
    }

    return [trendData]
    
  } catch (error) {
    console.error('Google Trends API error:', error)
    // Fallback to seasonal defaults if API fails
    return getFallbackTrends(season, currentYear, seasonDates)
  }
}

function extractTrendingColors(trends: GoogleTrendItem[]): string[] {
  const colors = ['burgundy', 'sage', 'navy', 'beige', 'coral', 'lavender', 'mustard', 'rust']
  return colors.filter(color => 
    trends.some(trend => 
      trend.title?.query?.toLowerCase().includes(color)
    )
  ).slice(0, 5)
}

function extractTrendingPatterns(trends: GoogleTrendItem[]): string[] {
  const patterns = ['plaid', 'floral', 'leopard', 'polka dot', 'stripe', 'gingham']
  return patterns.filter(pattern => 
    trends.some(trend => 
      trend.title?.query?.toLowerCase().includes(pattern)
    )
  ).slice(0, 4)
}

function extractTrendingStyles(trends: GoogleTrendItem[]): string[] {
  const styles = ['minimalist', 'boho', 'preppy', 'vintage', 'athleisure', 'cottagecore']
  return styles.filter(style => 
    trends.some(trend => 
      trend.title?.query?.toLowerCase().includes(style)
    )
  ).slice(0, 4)
}

// Seed initial fashion keywords
async function seedInitialKeywords(supabase: SupabaseClient): Promise<void> {
  const initialKeywords = [
    'fashion', 'style', 'outfit', 'clothing', 'trend', 'streetwear',
    'vintage', 'sustainable fashion', 'fast fashion', 'designer',
    'athleisure', 'minimalist', 'boho', 'preppy', 'grunge',
    'cottagecore', 'dark academia', 'y2k fashion', 'retro'
  ]

  for (const keyword of initialKeywords) {
    await supabase
      .from('trend_keywords')
      .upsert({
        keyword,
        category: 'fashion',
        last_updated: new Date().toISOString(),
        search_volume: 100
      }, {
        onConflict: 'keyword'
      })
  }
}

// Update trend keywords in database
async function updateTrendKeywords(supabase: SupabaseClient, trends: GoogleTrendItem[]): Promise<void> {
  const newKeywords = trends
    .map(trend => trend.title?.query)
    .filter((query): query is string => Boolean(query))
    .slice(0, 10)

  for (const keyword of newKeywords) {
    await supabase
      .from('trend_keywords')
      .upsert({
        keyword: keyword.toLowerCase(),
        category: 'fashion',
        last_updated: new Date().toISOString(),
        trend_direction: 'up'
      }, {
        onConflict: 'keyword'
      })
  }
}

function getFallbackTrends(season: string, year: number, dates: { from: string, until: string }): TrendData[] {
  const seasonalDefaults = {
    winter: {
      colors: ['burgundy', 'forest-green', 'navy', 'camel'],
      patterns: ['plaid', 'houndstooth', 'cable-knit'],
      styles: ['layered', 'cozy', 'sophisticated']
    },
    spring: {
      colors: ['pastel-pink', 'mint-green', 'lavender', 'coral'],
      patterns: ['floral', 'gingham', 'polka-dot'],
      styles: ['romantic', 'fresh', 'feminine']
    },
    summer: {
      colors: ['coral', 'turquoise', 'sunshine-yellow', 'white'],
      patterns: ['tropical', 'tie-dye', 'geometric'],
      styles: ['bohemian', 'resort', 'casual']
    },
    fall: {
      colors: ['rust', 'olive-green', 'mustard', 'burgundy'],
      patterns: ['plaid', 'leopard', 'houndstooth'],
      styles: ['preppy', 'academia', 'vintage']
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
    external_source: 'fallback',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Fetch trend data from Google Trends
    const trends = await fetchGoogleTrends()
    let updatedCount = 0

    // Upsert trends to database
    for (const trend of trends) {
      const { error } = await supabase
        .from('seasonal_trends')
        .upsert({
          ...trend,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'season_name,year,region'
        })

      if (!error) {
        updatedCount++
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