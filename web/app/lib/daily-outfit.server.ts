import { getWeatherForUser } from "./weather.server";
import { generateDailyOutfit } from "./daily-outfit-ai.server.ts";

interface DailyOutfitData {
  weather: {
    condition: string;
    temperature: number;
    description: string;
  } | null;
  recommendations: any[];
  hasWeatherMatch: boolean;
  isGenerated?: boolean;
  source?: string;
}

interface RpcResult {
  source: "cached" | "rule_based" | "insufficient_items";
  outfit: {
    id: string;
    recommendation_reason: string;
    ai_score: number;
    weather_condition: string;
    temperature: number;
    generated_at: string;
    clothing_item_ids: string[];
  } | null;
  items: Array<{
    id: string;
    name: string;
    image_url: string;
    primary_color: string;
    category_id: string;
  }>;
  message?: string;
}

export async function getDailyOutfitData(
  userId: string,
  userProfile: any,
  request: Request,
): Promise<DailyOutfitData> {
  return Promise.race([
    getDailyOutfitDataInternal(userId, userProfile, request),
    new Promise<DailyOutfitData>((_, reject) =>
      setTimeout(() => reject(new Error("Daily outfit data timeout")), 10000)
    ),
  ]).catch(() => {
    return {
      weather: null,
      recommendations: [],
      hasWeatherMatch: false,
    };
  });
}

async function getDailyOutfitDataInternal(
  userId: string,
  userProfile: any,
  request: Request,
): Promise<DailyOutfitData> {
  const { createClient } = await import("./supabase.server");
  const { supabase } = createClient(request);

  // Get weather data (can be cached separately if needed)
  const weather = await getWeatherForUser(
    userProfile?.location_city,
    userProfile?.location_country,
  );

  // If no weather, return recent recommendations without RPC
  if (!weather) {
    const { data: recentRecs } = await supabase
      .from("outfit_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(2);

    // Batch fetch items for all recommendations
    const allItemIds = recentRecs?.flatMap((r) => r.clothing_item_ids) || [];
    const { data: items } = await supabase
      .from("clothing_items")
      .select("id, name, image_url, primary_color")
      .in("id", allItemIds)
      .eq("user_id", userId);

    const itemsMap = new Map(items?.map((i) => [i.id, i]) || []);

    const enrichedRecs = (recentRecs || []).map((rec) => ({
      ...rec,
      name: "Recent Outfit",
      description: rec.recommendation_reason || "AI-curated combination",
      items: rec.clothing_item_ids?.map((id: string) =>
        itemsMap.get(id)
      ).filter(Boolean) || [],
    }));

    return {
      weather: null,
      recommendations: enrichedRecs,
      hasWeatherMatch: false,
    };
  }

  // =========================================================================
  // USE OPTIMIZED RPC FUNCTION - Single database call
  // =========================================================================
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "get_daily_outfit",
    {
      p_user_id: userId,
      p_weather_condition: weather.condition,
      p_temperature: weather.temperature,
    },
  ) as { data: RpcResult | null; error: any };

  if (rpcError) {
    console.error("RPC error:", rpcError);
    // Fall back to legacy behavior on RPC error
    return fallbackToLegacy(userId, userProfile, weather, request);
  }

  // Handle RPC result
  if (rpcResult && rpcResult.outfit) {
    // If rule_based, try to enhance immediately (Blocking for "Real Time" feel)
    let finalReason = rpcResult.outfit.recommendation_reason ||
      `Perfect for ${weather.description}`;
    let finalSource = rpcResult.source;
    let finalName = "Today's Outfit";

    if (rpcResult.source === "rule_based" && process.env.GEMINI_API_KEY) {
      try {
        const { enhanceOutfitWithAI } = await import(
          "./outfit-enhancer.server"
        );
        const enhancedReason = await enhanceOutfitWithAI(
          rpcResult.items,
          weather,
          process.env.GEMINI_API_KEY,
        );

        // Update DB in background (or await if we want strict consistency)
        await supabase
          .from("outfit_recommendations")
          .update({
            recommendation_reason: enhancedReason,
            ai_score: 0.85,
            generated_at: new Date().toISOString(),
          })
          .eq("id", rpcResult.outfit.id);

        finalReason = enhancedReason;
        finalSource = "cached"; // Promoted to cached/enhanced
        finalName = "AI-Styled Look";
      } catch (err) {
        console.error(
          "Blocking enhancement failed, falling back to rule-based:",
          err,
        );
        // Fallback to original
      }
    } else if (
      rpcResult.source === "cached" && rpcResult.outfit.ai_score >= 0.8
    ) {
      finalName = "AI-Styled Look";
    } else if (rpcResult.source === "cached") {
      finalName = "Weather Match";
    }

    const recommendation = {
      ...rpcResult.outfit,
      name: finalName,
      description: finalReason,
      items: rpcResult.items || [],
      userInteraction: null,
    };

    return {
      weather,
      recommendations: [recommendation],
      hasWeatherMatch: true, // Always true if we return an outfit
      source: finalSource,
    };
  }

  // Insufficient items - try AI generation as fallback
  if (rpcResult?.source === "insufficient_items") {
    try {
      const generated = await generateDailyOutfit(
        userProfile,
        weather,
        request,
      );
      if (generated && generated.length > 0) {
        return {
          weather,
          recommendations: generated.slice(0, 2),
          hasWeatherMatch: true,
          isGenerated: true,
        };
      }
    } catch {
      // Fall through to empty state
    }
  }

  return {
    weather,
    recommendations: [],
    hasWeatherMatch: false,
    source: "empty",
  };
}

/**
 * Legacy fallback in case RPC function is not available (e.g., migration not applied)
 */
async function fallbackToLegacy(
  userId: string,
  userProfile: any,
  weather: { condition: string; temperature: number; description: string },
  request: Request,
): Promise<DailyOutfitData> {
  const { createClient } = await import("./supabase.server");
  const { supabase } = createClient(request);

  // Try exact weather match
  const { data: exactMatches } = await supabase
    .from("outfit_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("weather_condition_name", weather.condition)
    .gte("temperature_celsius", weather.temperature - 5)
    .lte("temperature_celsius", weather.temperature + 5)
    .order("generated_at", { ascending: false })
    .limit(2);

  if (exactMatches && exactMatches.length > 0) {
    // Batch fetch items
    const allItemIds = exactMatches.flatMap((r) => r.clothing_item_ids) || [];
    const { data: items } = await supabase
      .from("clothing_items")
      .select("id, name, image_url")
      .in("id", allItemIds)
      .eq("user_id", userId);

    const itemsMap = new Map(items?.map((i) => [i.id, i]) || []);

    const enrichedMatches = exactMatches.map((rec) => ({
      ...rec,
      name: "Weather Match",
      description: rec.recommendation_reason ||
        `Perfect for ${weather.description}`,
      items: rec.clothing_item_ids?.map((id: string) =>
        itemsMap.get(id)
      ).filter(Boolean) || [],
    }));

    return {
      weather,
      recommendations: enrichedMatches,
      hasWeatherMatch: true,
    };
  }

  // Try AI generation
  try {
    const generated = await generateDailyOutfit(userProfile, weather, request);
    if (generated && generated.length > 0) {
      return {
        weather,
        recommendations: generated.slice(0, 2),
        hasWeatherMatch: true,
        isGenerated: true,
      };
    }
  } catch {
    // Continue to fallback
  }

  // Final fallback: any recent recommendation
  const { data: fallbackRecs } = await supabase
    .from("outfit_recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(2);

  if (fallbackRecs && fallbackRecs.length > 0) {
    const allItemIds = fallbackRecs.flatMap((r) => r.clothing_item_ids) || [];
    const { data: items } = await supabase
      .from("clothing_items")
      .select("id, name, image_url")
      .in("id", allItemIds)
      .eq("user_id", userId);

    const itemsMap = new Map(items?.map((i) => [i.id, i]) || []);

    const enrichedFallback = fallbackRecs.map((rec) => ({
      ...rec,
      name: "Curated Outfit",
      description: rec.recommendation_reason || "AI-styled combination",
      items: rec.clothing_item_ids?.map((id: string) =>
        itemsMap.get(id)
      ).filter(Boolean) || [],
    }));

    return {
      weather,
      recommendations: enrichedFallback,
      hasWeatherMatch: false,
    };
  }

  return {
    weather,
    recommendations: [],
    hasWeatherMatch: false,
  };
}
