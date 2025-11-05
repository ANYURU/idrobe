import { createClient } from "@/lib/supabase.server";
import { Buffer } from "buffer";
import type { Route } from "./+types/analyze";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  console.log("[ANALYZE] Starting image analysis");

  const { supabase } = createClient(request);
  const formData = await request.formData();
  const imageFile = formData.get("image") as File;

  if (!imageFile) {
    console.error("[ANALYZE] No image file provided");
    return Response.json({ error: "Please upload an image" }, { status: 400 });
  }
  
  console.log("[ANALYZE] Image file received:", {
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type
  });

  try {
    // Convert File to base64
    console.log("[ANALYZE] Converting image to base64");
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("[ANALYZE] Base64 conversion complete, length:", base64.length);

    // Get available categories using RPC function
    console.log("[ANALYZE] Fetching categories from database");
    const { data: categoriesData, error: categoriesError } = await supabase.rpc(
      "get_active_categories_for_prompt"
    );
    
    if (categoriesError) {
      console.error("[ANALYZE] Categories RPC error:", categoriesError);
    } else {
      console.log("[ANALYZE] Categories fetched:", categoriesData);
    }

    const hasCategories =
      categoriesData?.categories && categoriesData.categories.length > 0;
    const categoryNames = hasCategories
      ? categoriesData.categories.join(", ")
      : "tops, bottoms, dresses, outerwear, shoes, accessories, activewear, formalwear, underwear, sleepwear";

    // Call Gemini Vision API
    console.log("[ANALYZE] Calling Gemini Vision API");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this clothing item and return a JSON object with the following structure:
{
  "name": "descriptive name of the item",
  "category": "${hasCategories ? `one of: ${categoryNames}` : "appropriate category like tops, bottoms, dresses, outerwear, shoes, accessories, etc."}",
  "subcategory": "specific type like t-shirt, jeans, sneakers, jacket, dress, etc.",
  "primary_color": "main color name",
  "secondary_colors": ["array of other colors if any"],
  "brand": "brand name if visible, otherwise null",
  "material": ["array of materials like cotton, polyester, denim"],
  "pattern": "pattern type like solid, striped, floral, or null",
  "style_tags": ["array of 2-4 style descriptors like casual, formal, vintage, minimalist"],
  "season": ["array of seasons: spring, summer, fall, winter, or all-season"],
  "weather_suitable": ["array of weather conditions: sunny, cloudy, rainy, snowy, windy, hot, cold, mild"],
  "fit": "one of: tight, fitted, regular, loose, oversized",
  "size": "estimated size if visible, otherwise null",
  "care_instructions": "care instructions if visible on labels, otherwise null",
  "sustainability_score": 0.7,
  "notes": "brief description of the item",
  "ai_confidence_score": 0.85
}

${hasCategories ? `Available subcategories by category: ${JSON.stringify(categoriesData.subcategories || {})}. Use existing categories/subcategories when possible, but` : "Create appropriate categories and subcategories as needed."} Be accurate and only return the JSON object.`,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );
    
    console.log("[ANALYZE] Gemini API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE] Gemini API error:", response.status, errorText);
      return Response.json(
        { error: `AI service unavailable (${response.status})` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("[ANALYZE] Gemini API result:", JSON.stringify(result, null, 2));
    
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      console.error("[ANALYZE] No analysis text in response:", result);
      return Response.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }
    
    console.log("[ANALYZE] Raw analysis text:", analysisText);

    // Parse JSON response
    const cleanedText = analysisText.replace(/```json\n?|```/g, "").trim();
    console.log("[ANALYZE] Cleaned analysis text:", cleanedText);
    
    const analysis = JSON.parse(cleanedText);
    console.log("[ANALYZE] Parsed analysis:", analysis);

    return Response.json(analysis);
  } catch (error) {
    console.error("[ANALYZE] Fatal error:", error);
    console.error("[ANALYZE] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return Response.json(
      { error: "Failed to analyze image. Please try again." },
      { status: 500 }
    );
  }
}

export async function loader() {
  return null;
}

export default function AnalyzePage() {
  return null;
}
