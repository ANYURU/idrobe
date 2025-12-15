import { createClient } from "@/lib/supabase.server";
import { Buffer } from "buffer";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { supabase } = createClient(request);

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const imageFile = formData.get("image") as File;

  if (!imageFile) {
    return Response.json({ error: "Please upload an image" }, { status: 400 });
  }

  // Basic file validation
  if (!imageFile.type.startsWith("image/")) {
    return Response.json(
      {
        valid: false,
        confidence: 1.0,
        criteria: [],
      },
      { status: 200 },
    );
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    return Response.json(
      {
        valid: false,
        confidence: 1.0,
        criteria: [],
      },
      { status: 200 },
    );
  }

  try {
    // Convert File to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Call Gemini Vision API for validation
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
                  text:
                    `Analyze this image to determine if it's suitable for virtual try-on purposes. 

Check each of the following criteria and provide individual results:

1. Full-body photo: The person must be visible from head to toe
2. Single person: Only one person should be in the image
3. Good lighting: The image should be well-lit without harsh shadows
4. Plain/simple background: Background should be minimal and not distracting
5. Standing straight: Person should be standing in a natural, upright position
6. Fitted clothing: The person should be wearing fitted clothing that shows their body shape (not extremely baggy clothing)

Return a JSON object with the following structure:
{
  "valid": true or false (true only if ALL criteria are met),
  "confidence": a number between 0 and 1 indicating how confident you are in this assessment,
  "criteria": [
    {
      "name": "Full-body visible",
      "passed": true or false,
      "message": "Brief message - if passed, say 'Good' or 'Looks great'. If failed, explain what's wrong in one short sentence"
    },
    {
      "name": "Single person",
      "passed": true or false,
      "message": "Brief message"
    },
    {
      "name": "Good lighting",
      "passed": true or false,
      "message": "Brief message"
    },
    {
      "name": "Plain background",
      "passed": true or false,
      "message": "Brief message"
    },
    {
      "name": "Standing straight",
      "passed": true or false,
      "message": "Brief message"
    },
    {
      "name": "Fitted clothing",
      "passed": true or false,
      "message": "Brief message"
    }
  ]
}

Be strict in your validation. If any criteria is questionable, mark it as failed.
Keep messages concise (max 10 words).
Only return the JSON object, nothing else.`,
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
      },
    );

    if (!response.ok) {
      return Response.json(
        { error: `AI validation service unavailable` },
        { status: 500 },
      );
    }

    const result = await response.json();
    const validationText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!validationText) {
      return Response.json(
        { error: "AI returned empty response" },
        { status: 500 },
      );
    }

    // Parse JSON response
    const cleanedText = validationText.replace(/```json\n?|```/g, "").trim();
    const validation = JSON.parse(cleanedText);

    // Ensure the response has the expected structure
    const validationResponse = {
      valid: validation.valid === true,
      confidence: typeof validation.confidence === "number"
        ? validation.confidence
        : 0.7,
      criteria: Array.isArray(validation.criteria) ? validation.criteria : [],
    };

    return Response.json(validationResponse);
  } catch (error) {
    console.error(
      "[VALIDATE-TRYON] Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "Failed to validate image. Please try again." },
      { status: 500 },
    );
  }
}

export async function loader() {
  return null;
}

export default function ValidateTryonImagePage() {
  return null;
}
