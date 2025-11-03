import { getWeatherForUser } from './weather.server';
import { generateDailyOutfit } from './daily-outfit-ai.server.ts';

interface DailyOutfitData {
  weather: {
    condition: string;
    temperature: number;
    description: string;
  } | null;
  recommendations: any[];
  hasWeatherMatch: boolean;
  isGenerated?: boolean;
}

export async function getDailyOutfitData(
  userId: string,
  userProfile: any, 
  request: Request
): Promise<DailyOutfitData> {
  console.log('👕 Daily outfit request for user profile:', { 
    userId,
    city: userProfile?.location_city, 
    country: userProfile?.location_country
  });

  // Get current weather
  const weather = await getWeatherForUser(
    userProfile?.location_city, 
    userProfile?.location_country,
    request
  );
  
  console.log('🌤️ Weather result:', weather);

  // Use Supabase to query recommendations with proper joins
  const { createClient } = await import('./supabase.server');
  const { supabase } = createClient(request);

  if (!weather) {
    console.log('❌ No weather data, using recent recommendations');
    const { data: recentRecs } = await supabase
      .from('outfit_recommendations')
      .select(`
        *,
        user_interactions(
          id,
          interaction_type_name,
          interacted_at
        )
      `)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(2);
    
    // Fetch clothing items for each recommendation
    const enrichedRecs = await Promise.all(
      (recentRecs || []).map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('*')
          .in('id', rec.clothing_item_ids || [])
          .eq('user_id', userId);
        
        return {
          ...rec,
          name: "Recent Outfit",
          description: rec.recommendation_reason || "AI-curated combination",
          items: items || [],
          userInteraction: rec.user_interactions?.[0] || null
        };
      })
    );
      
    return {
      weather: null,
      recommendations: enrichedRecs,
      hasWeatherMatch: false
    };
  }

  console.log('🔍 Looking for weather matches. Current weather:', weather);

  // Query for exact weather matches with interactions
  const { data: exactMatches } = await supabase
    .from('outfit_recommendations')
    .select(`
      *,
      user_interactions(
        id,
        interaction_type_name,
        interacted_at
      )
    `)
    .eq('user_id', userId)
    .eq('weather_condition_name', weather.condition)
    .gte('temperature_celsius', weather.temperature - 5)
    .lte('temperature_celsius', weather.temperature + 5)
    .order('generated_at', { ascending: false })
    .limit(2);

  console.log('🎯 Exact matches found:', exactMatches?.length || 0);

  if (exactMatches && exactMatches.length > 0) {
    console.log('✅ Using exact weather matches');
    
    // Fetch clothing items for each recommendation
    const enrichedMatches = await Promise.all(
      exactMatches.map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('*')
          .in('id', rec.clothing_item_ids || [])
          .eq('user_id', userId);
        
        return {
          ...rec,
          name: "Perfect Weather Match",
          description: rec.recommendation_reason || `Perfect for ${weather.description}`,
          items: items || [],
          userInteraction: rec.user_interactions?.[0] || null
        };
      })
    );
    
    return {
      weather,
      recommendations: enrichedMatches,
      hasWeatherMatch: true
    };
  }

  // Query for similar weather conditions with interactions
  const { data: similarMatches } = await supabase
    .from('outfit_recommendations')
    .select(`
      *,
      user_interactions(
        id,
        interaction_type_name,
        interacted_at
      )
    `)
    .eq('user_id', userId)
    .eq('weather_condition_name', weather.condition)
    .order('generated_at', { ascending: false })
    .limit(2);

  console.log('🔄 Similar matches found:', similarMatches?.length || 0);

  if (similarMatches && similarMatches.length > 0) {
    console.log('✅ Using similar weather matches');
    
    // Fetch clothing items for each recommendation
    const enrichedMatches = await Promise.all(
      similarMatches.map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('*')
          .in('id', rec.clothing_item_ids || [])
          .eq('user_id', userId);
        
        return {
          ...rec,
          name: "Weather Appropriate",
          description: rec.recommendation_reason || `Good for ${weather.condition} weather`,
          items: items || [],
          userInteraction: rec.user_interactions?.[0] || null
        };
      })
    );
    
    return {
      weather,
      recommendations: enrichedMatches,
      hasWeatherMatch: false
    };
  }

  // Final fallback: Generate fresh AI recommendations
  console.log('🤖 No weather matches found, generating fresh daily outfit');
  try {
    const generated = await generateDailyOutfit(userProfile, weather, request);
    console.log('📊 AI generation result:', generated?.length || 0, 'outfits');
    if (generated && generated.length > 0) {
      console.log('✅ Generated fresh daily outfit successfully');
      return {
        weather,
        recommendations: generated.slice(0, 2),
        hasWeatherMatch: true,
        isGenerated: true
      };
    } else {
      console.log('❌ AI generation returned empty result');
    }
  } catch (error) {
    console.log('❌ Failed to generate daily outfit:', error);
  }
  
  // Ultimate fallback: recent recommendations
  console.log('🔄 Using recent recommendations as ultimate fallback');
  const { data: fallbackRecs } = await supabase
    .from('outfit_recommendations')
    .select(`
      *,
      user_interactions(
        id,
        interaction_type_name,
        interacted_at
      )
    `)
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(2);
  
  // Fetch clothing items for each recommendation
  const enrichedFallback = await Promise.all(
    (fallbackRecs || []).map(async (rec) => {
      const { data: items } = await supabase
        .from('clothing_items')
        .select('*')
        .in('id', rec.clothing_item_ids || [])
        .eq('user_id', userId);
      
      return {
        ...rec,
        name: "Curated Outfit",
        description: rec.recommendation_reason || "AI-styled combination",
        items: items || [],
        userInteraction: rec.user_interactions?.[0] || null
      };
    })
  );
    
  const result = {
    weather,
    recommendations: enrichedFallback,
    hasWeatherMatch: false
  };
  
  console.log('📤 Final result:', result.recommendations.length, 'recommendations');
  console.log('🖼️ Sample recommendation data:', result.recommendations[0] ? {
    id: result.recommendations[0].id,
    name: result.recommendations[0].name,
    items: result.recommendations[0].items?.length || 0,
    clothing_item_ids: result.recommendations[0].clothing_item_ids
  } : 'No recommendations');
  return result;
}