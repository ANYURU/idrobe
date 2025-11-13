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
  return Promise.race([
    getDailyOutfitDataInternal(userId, userProfile, request),
    new Promise<DailyOutfitData>((_, reject) => 
      setTimeout(() => reject(new Error('Daily outfit data timeout')), 15000)
    )
  ]).catch(() => {
    return {
      weather: null,
      recommendations: [],
      hasWeatherMatch: false
    };
  });
}

async function getDailyOutfitDataInternal(
  userId: string,
  userProfile: any, 
  request: Request
): Promise<DailyOutfitData> {
  const weather = await getWeatherForUser(
    userProfile?.location_city, 
    userProfile?.location_country
  );

  const { createClient } = await import('./supabase.server');
  const { supabase } = createClient(request);

  if (!weather) {
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
    
    const enrichedRecs = await Promise.all(
      (recentRecs || []).map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('id, name, image_url')
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

  if (exactMatches && exactMatches.length > 0) {
    const enrichedMatches = await Promise.all(
      exactMatches.map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('id, name, image_url')
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

  if (similarMatches && similarMatches.length > 0) {
    const enrichedMatches = await Promise.all(
      similarMatches.map(async (rec) => {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('id, name, image_url')
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

  try {
    const generated = await generateDailyOutfit(userProfile, weather, request);
    if (generated && generated.length > 0) {
      return {
        weather,
        recommendations: generated.slice(0, 2),
        hasWeatherMatch: true,
        isGenerated: true
      };
    }
  } catch (error) {
    // Continue to fallback
  }
  
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
  
  const enrichedFallback = await Promise.all(
    (fallbackRecs || []).map(async (rec) => {
      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, image_url')
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
    
  return {
    weather,
    recommendations: enrichedFallback,
    hasWeatherMatch: false
  };
}
