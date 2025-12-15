import { data } from "react-router";
import type { Route } from "./+types/enhance-outfit";
import { createClient } from "@/lib/supabase.server";
import { GoogleGenAI } from "@google/genai";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const outfitId = formData.get("outfitId") as string;
  const itemsJson = formData.get("items") as string;
  const weatherJson = formData.get("weather") as string;

  if (!outfitId) {
    return data({ error: "Missing outfitId" }, { status: 400 });
  }

  // 1. Validate ownership
  const { data: outfit, error: fetchError } = await supabase
    .from("outfit_recommendations")
    .select("*")
    .eq("id", outfitId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !outfit) {
    return data({ error: "Outfit not found" }, { status: 404 });
  }

  // If already high score (AI generated), skip
  if ((outfit.ai_score || 0) >= 0.8) {
    return data({ success: true, reason: outfit.recommendation_reason });
  }

  try {
    // 2. Generate new reason with Gemini (New SDK via shared lib)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Gemini API key");
    }

    const { enhanceOutfitWithAI } = await import(
      "@/lib/outfit-enhancer.server"
    );
    const items = JSON.parse(itemsJson || "[]");
    const weather = JSON.parse(weatherJson || "{}");

    const newReason = await enhanceOutfitWithAI(items, weather, apiKey);

    // 3. Update database
    await supabase
      .from("outfit_recommendations")
      .update({
        recommendation_reason: newReason,
        ai_score: 0.85, // Bump score to indicate AI enhancement
        generated_at: new Date().toISOString(), // Refresh timestamp
      })
      .eq("id", outfitId);

    return data({ success: true, reason: newReason });
  } catch (error) {
    console.error("AI enhancement failed:", error);
    // Return success=false but don't crash UI
    return data({ success: false, error: "AI generation failed" });
  }
}
