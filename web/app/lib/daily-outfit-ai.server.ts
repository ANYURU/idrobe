import { createClient } from './supabase.server';

interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
}

export async function generateDailyOutfit(
  userProfile: any,
  weather: WeatherData,
  request: Request
) {
  const { supabase } = createClient(request);
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayOutfit } = await supabase
    .from('outfit_recommendations')
    .select('*')
    .eq('user_id', userProfile.user_id)
    .eq('weather_condition_name', weather.condition)
    .gte('temperature_celsius', weather.temperature - 5)
    .lte('temperature_celsius', weather.temperature + 5)
    .gte('generated_at', `${today}T00:00:00Z`)
    .limit(1);

  if (todayOutfit && todayOutfit.length > 0) {
    
    // Fetch clothing item details for the cached outfit
    const outfitWithItems = await Promise.all(todayOutfit.map(async (outfit) => {
      const { data: clothingItems } = await supabase
        .from('clothing_items')
        .select('*')
        .in('id', outfit.clothing_item_ids)
        .eq('user_id', userProfile.user_id);
        
      return {
        ...outfit,
        name: outfit.name || "Today's Perfect Look",
        description: outfit.recommendation_reason || `Perfect for ${weather.description} and ${weather.temperature}°C`,
        styling_reason: outfit.recommendation_reason || "AI-curated for today's weather",
        items: clothingItems || []
      };
    }));
    
    return outfitWithItems;
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { data: yesterdayOutfit } = await supabase
    .from('outfit_recommendations')
    .select('*')
    .eq('user_id', userProfile.user_id)
    .eq('weather_condition_name', weather.condition)
    .gte('temperature_celsius', weather.temperature - 10)
    .lte('temperature_celsius', weather.temperature + 10)
    .gte('generated_at', `${yesterday}T00:00:00Z`)
    .lt('generated_at', `${today}T00:00:00Z`)
    .limit(1);
    
  if (yesterdayOutfit && yesterdayOutfit.length > 0) {
    
    const outfitWithItems = await Promise.all(yesterdayOutfit.map(async (outfit) => {
      const { data: clothingItems } = await supabase
        .from('clothing_items')
        .select('id, name, image_url')
        .in('id', outfit.clothing_item_ids)
        .eq('user_id', userProfile.user_id);
        
      return {
        ...outfit,
        name: outfit.name || "Yesterday's Look",
        description: outfit.recommendation_reason || `Good for ${weather.description}`,
        items: clothingItems || []
      };
    }));
    
    return outfitWithItems;
  }
  
  // Get user's clothing items
  const { data: items } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userProfile.user_id)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('last_worn_date', { ascending: true, nullsFirst: true });

  if (!items || items.length < 2) {
    return null;
  }

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  const prompt = `Generate TODAY'S perfect outfit for this user based on current conditions.

CURRENT CONTEXT:
- Date: ${new Date().toLocaleDateString()}
- Day: ${dayOfWeek} ${isWeekend ? '(Weekend)' : '(Weekday)'}
- Weather: ${weather.condition}, ${weather.temperature}°C, ${weather.description}
- Location: ${userProfile.location_city}, ${userProfile.location_country}

USER PROFILE:
- Body Type: ${userProfile.body_type || 'not specified'}
- Style Preferences: ${userProfile.style_preferences?.join(', ') || 'versatile'}
- Color Preferences: ${userProfile.color_preferences?.join(', ') || 'open to all'}

AVAILABLE ITEMS (prioritize less worn items):
${JSON.stringify(items.slice(0, 20).map(item => ({
  id: item.id,
  name: item.name,
  category: item.category,
  primary_color: item.primary_color,
  times_worn: item.times_worn || 0,
  last_worn_date: item.last_worn_date,
  weather_suitable: item.weather_suitable,
  season: item.season
})), null, 2)}

Create 1-2 PERFECT outfits for TODAY considering:
✓ Current weather conditions (${weather.condition}, ${weather.temperature}°C)
✓ Day of week (${isWeekend ? 'casual weekend' : 'weekday appropriate'})
✓ Prioritize items that haven't been worn recently
✓ Weather-appropriate layering and materials
✓ Comfortable yet stylish for the day ahead

Return ONLY this JSON:
[
  {
    "name": "Today's Perfect Look",
    "description": "Why this works for today",
    "occasion": ["${isWeekend ? 'weekend' : 'weekday'}"],
    "season": "current",
    "weather_condition": "${weather.condition}",
    "temperature_celsius": ${weather.temperature},
    "mood": "confident",
    "clothing_item_ids": ["item_id_1", "item_id_2"],
    "styling_reason": "Perfect for ${weather.description} and ${dayOfWeek}",
    "ai_score": 0.9,
    "style_coherence_score": 0.9,
    "occasion_match_score": 0.9,
    "weather_appropriateness_score": 0.95
  }
]`;

  try {
    // Skip AI generation in development if no API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();// 30 soecnd timeout    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const recommendationsText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendationsText) {
      return null;
    }

    const cleanText = recommendationsText.replace(/```json\n?|```/g, '').trim();
    const recommendations = JSON.parse(cleanText);

    // Validate and save
    const validRecs = recommendations.filter((rec: any) => 
      rec.clothing_item_ids && 
      rec.clothing_item_ids.length >= 2 &&
      rec.clothing_item_ids.every((id: string) => items.find(item => item.id === id))
    );

    if (validRecs.length === 0) {
      return null;
    }

    // Save to database
    const savedRecs = [];
    for (const rec of validRecs.slice(0, 2)) {
      const { data: saved, error: saveError } = await supabase
        .from('outfit_recommendations')
        .insert({
          user_id: userProfile.user_id,
          occasion_name: rec.occasion[0],
          season_name: rec.season,
          mood_name: rec.mood,
          weather_condition_name: rec.weather_condition,
          temperature_celsius: rec.temperature_celsius,
          clothing_item_ids: rec.clothing_item_ids,
          ai_score: rec.ai_score,
          style_coherence_score: rec.style_coherence_score,
          occasion_match_score: rec.occasion_match_score,
          weather_appropriateness_score: rec.weather_appropriateness_score,
          recommendation_reason: rec.styling_reason,
          based_on_past_preferences: false
        })
        .select()
        .single();
        
      if (saveError) {
        continue;
      }

      savedRecs.push({
        ...saved,
        name: rec.name,
        description: rec.description,
        styling_reason: rec.styling_reason
      });
    }

    return savedRecs;

  } catch (error) {
    return null;
  }
}