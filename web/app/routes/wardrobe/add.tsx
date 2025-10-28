import { useFormik } from "formik";
import { useSubmit, useNavigate, redirect, useFetcher, useNavigation } from "react-router";
import type { Route } from "./+types/add";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Sparkles, Check, Edit3, RotateCcw, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase.server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clothingItemSchema } from "@/lib/schemas";
import { toFormikValidationSchema } from "zod-formik-adapter";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  await requireAuth(request);
  
  const { supabase } = createClient(request);
  
  // Get active categories for the form
  const { data: categories } = await supabase
    .from('clothing_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order');
    
  return { categories: categories || [] };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  
  console.log('=== WARDROBE ADD ACTION START ===');
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ User not authenticated');
    return { error: "Not authenticated" };
  }
  
  console.log('✅ User authenticated:', user.id);
  
  // Validate required fields
  const name = formData.get("name") as string;
  const primaryColor = formData.get("primary_color") as string;
  
  if (!name?.trim()) {
    return { error: "Item name is required" };
  }
  
  if (!primaryColor?.trim()) {
    return { error: "Primary color is required" };
  }

  try {
    // Upload image to Supabase Storage
    const imageFile = formData.get("imageFile") as File;
    let imageUrl = null;
    
    console.log('📁 Image file:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'None');
    
    if (!imageFile || imageFile.size === 0 || !imageFile.name) {
      console.log('❌ No valid image file provided');
      return { error: "Please select an image file" };
    }
    
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
    console.log('📤 Uploading to:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('clothing')
      .upload(fileName, imageFile);
      
    if (uploadError) {
      console.log('❌ Upload error:', uploadError);
      return { error: `Failed to upload image: ${uploadError.message}` };
    }
    
    console.log('✅ Image uploaded successfully');
    // Store only the file path for client-side URL generation
    imageUrl = fileName;

    // Find or create category using RPC function
    const categoryName = formData.get("category") as string;
    const subcategoryName = formData.get("subcategory") as string;
    let categoryId = null;
    let subcategoryId = null;
    
    console.log('🏷️ Category:', categoryName, 'Subcategory:', subcategoryName);
    
    if (categoryName?.trim()) {
      const { data: categoryIdResult, error: catError } = await supabase
        .rpc('find_or_create_category', { category_name: categoryName.trim() });
      
      if (catError) {
        console.log('❌ Category creation error:', catError);
        return { error: `Failed to process category: ${catError.message}` };
      }
      
      categoryId = categoryIdResult;
      console.log('✅ Category ID:', categoryId);
      
      // Validate categoryId is a valid UUID
      if (!categoryId || typeof categoryId !== 'string') {
        return { error: "Invalid category ID generated" };
      }
      
      // Handle subcategory if provided
      if (subcategoryName?.trim()) {
        const { data: subcategoryIdResult, error: subError } = await supabase
          .rpc('find_or_create_subcategory', { 
            subcategory_name: subcategoryName.trim(), 
            parent_category_id: categoryId 
          });
        
        if (subError) {
          console.log('❌ Subcategory creation error:', subError);
          return { error: `Failed to process subcategory: ${subError.message}` };
        }
        
        subcategoryId = subcategoryIdResult;
        console.log('✅ Subcategory ID:', subcategoryId);
        
        // Validate subcategoryId is a valid UUID
        if (subcategoryId && typeof subcategoryId !== 'string') {
          return { error: "Invalid subcategory ID generated" };
        }
      }
    }

    // Create clothing item with normalized field names and validation
    const rawFit = (formData.get("fit") as string) || 'regular';
    const normalizeValue = (value: string) => value.toLowerCase().replace(/[\s-]/g, '_');
    
    // Parse and validate arrays
    let secondaryColors, material, seasonNames, weatherSuitableNames;
    try {
      secondaryColors = JSON.parse((formData.get("secondary_colors") as string) || "[]");
      material = JSON.parse((formData.get("material") as string) || "[]");
      seasonNames = JSON.parse((formData.get("season") as string) || "[]").map((s: string) => normalizeValue(s));
      weatherSuitableNames = JSON.parse((formData.get("weather_suitable") as string) || "[]").map((w: string) => normalizeValue(w));
    } catch (parseError) {
      return { error: "Invalid data format in form fields" };
    }
    
    // Parse optional fields
    const purchaseDate = (formData.get("purchase_date") as string) || null;
    const costStr = (formData.get("cost") as string) || null;
    const cost = costStr ? parseFloat(costStr) : null;
    const sustainabilityScore = parseFloat((formData.get("sustainability_score") as string) || "0");
    const careInstructions = (formData.get("care_instructions") as string)?.trim() || null;
    
    // Validate AI confidence score
    const aiConfidenceStr = formData.get("ai_confidence_score") as string || "0.8";
    const aiConfidence = parseFloat(aiConfidenceStr);
    if (isNaN(aiConfidence) || aiConfidence < 0 || aiConfidence > 1) {
      return { error: "Invalid AI confidence score" };
    }
    
    // Generate embedding for similarity search
    const embeddingText = `${name.trim()} ${primaryColor.trim()} ${categoryName || ''} ${subcategoryName || ''} ${(formData.get("brand") as string) || ''} ${material.join(' ')} ${(formData.get("pattern") as string) || ''} ${seasonNames.join(' ')} ${(formData.get("style_tags") as string) || ''}`;
    
    let embedding = null;
    try {
      const embeddingResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: {
              parts: [{ text: embeddingText }]
            }
          })
        }
      );
      
      const embeddingResult = await embeddingResponse.json();
      if (embeddingResult.embedding?.values) {
        embedding = JSON.stringify(embeddingResult.embedding.values);
      }
    } catch (embeddingError) {
      console.log('⚠️ Failed to generate embedding:', embeddingError);
      // Continue without embedding - not critical for basic functionality
    }
    
    // Store full AI metadata
    const aiMetadata = {
      analysis_timestamp: new Date().toISOString(),
      confidence_score: aiConfidence,
      embedding_text: embeddingText,
      raw_analysis: {
        name: name.trim(),
        category: categoryName,
        subcategory: subcategoryName,
        primary_color: primaryColor.trim(),
        secondary_colors: secondaryColors,
        brand: (formData.get("brand") as string)?.trim() || null,
        material: material,
        pattern: (formData.get("pattern") as string)?.trim() || null,
        style_tags: JSON.parse((formData.get("style_tags") as string) || "[]"),
        season: seasonNames,
        weather_suitable: weatherSuitableNames,
        fit: normalizeValue(rawFit),
        size: (formData.get("size") as string)?.trim() || null,
        notes: (formData.get("notes") as string)?.trim() || null
      }
    };

    const itemData = {
      user_id: user.id,
      name: name.trim(),
      category_id: categoryId,
      subcategory_id: subcategoryId,
      primary_color: primaryColor.trim(),
      secondary_colors: secondaryColors,
      brand: (formData.get("brand") as string)?.trim() || null,
      material: material,
      pattern: (formData.get("pattern") as string)?.trim() || null,
      season_names: seasonNames,
      weather_suitable_names: weatherSuitableNames,
      fit_name: normalizeValue(rawFit),
      size: (formData.get("size") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      care_instructions: careInstructions,
      purchase_date: purchaseDate,
      cost: cost,
      sustainability_score: sustainabilityScore,
      times_worn: 0,
      image_url: imageUrl,
      ai_confidence_score: aiConfidence,
      ai_metadata: aiMetadata,
      embedding: embedding,
    };
    
    console.log('💾 Item data to save:', JSON.stringify(itemData, null, 2));
    console.log('🔍 Item data keys:', Object.keys(itemData));
    console.log('🔍 Item data types:', Object.entries(itemData).map(([k, v]) => `${k}: ${typeof v}`));

    const { data: newItem, error } = await supabase
      .from("clothing_items")
      .insert(itemData)
      .select('id')
      .single();

    if (error) {
      console.log('❌ Database insert error:', error);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error details:', error.details);
      console.log('❌ Error hint:', error.hint);
      
      // Handle specific error types
      if (error.code === '23505') {
        return { error: "This item already exists in your wardrobe" };
      }
      if (error.code === '23503') {
        return { error: "Invalid category or subcategory reference" };
      }
      if (error.code === '23502') {
        return { error: "Missing required field" };
      }
      if (error.code === '22P02') {
        return { error: "Invalid data format" };
      }
      
      return { error: `Failed to save item: ${error.message}` };
    }
    
    // Validate newItem has valid ID
    if (!newItem?.id) {
      return { error: "Failed to create item - no ID returned" };
    }
    
    console.log('✅ Item created with ID:', newItem.id);

    // Add style tags using RPC function
    let styleTags;
    try {
      styleTags = JSON.parse((formData.get("style_tags") as string) || "[]");
    } catch (parseError) {
      console.log('⚠️ Invalid style tags format, skipping');
      styleTags = [];
    }
    
    console.log('🏷️ Style tags to add:', styleTags);
    
    if (Array.isArray(styleTags) && styleTags.length > 0 && newItem?.id) {
      const { error: tagsError } = await supabase
        .rpc('add_style_tags_to_item', { 
          item_id: newItem.id, 
          tag_names: styleTags.map(tag => String(tag).trim()).filter(Boolean)
        });
      
      if (tagsError) {
        console.log('❌ Style tags error:', tagsError);
        // Don't fail the entire operation for style tag errors
      } else {
        console.log('✅ Style tags added successfully');
      }
    }

    console.log('✅ Item saved successfully, redirecting to wardrobe');
    return redirect("/wardrobe");
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return { error: "Failed to save item. Please try again." };
  }
}

export default function AddItemPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const analyzeFetcher = useFetcher();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle analyze fetcher response
  useEffect(() => {
    if (analyzeFetcher.data) {
      if (analyzeFetcher.data.error) {
        // Handle error
        console.error(analyzeFetcher.data.error);
      } else if (analyzeFetcher.data.analysis) {
        setAnalysis(analyzeFetcher.data.analysis);
        setImagePreview(analyzeFetcher.data.imagePreview);
      }
    }
  }, [analyzeFetcher.data]);

  const formik = useFormik({
    initialValues: {
      name: "",
      category: "",
      subcategory: "",
      primary_color: "",
      secondary_colors: "",
      brand: "",
      material: "",
      pattern: "",
      style_tags: "",
      season: "",
      weather_suitable: "",
      fit: "regular",
      size: "",
      care_instructions: "",
      purchase_date: "",
      cost: "",
      sustainability_score: 0,
      notes: "",
      ai_confidence_score: 0.8,
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: true,
    // validationSchema: toFormikValidationSchema(clothingItemSchema), // Temporarily disabled for testing
    onSubmit: (values) => {
      console.log('=== FORM SUBMIT START ===');
      console.log('📝 Form values:', values);
      console.log('📁 Image file:', imageFile);
      
      const formData = new FormData();
      
      // Add the original image file if available
      if (imageFile) {
        console.log('📎 Appending image file:', imageFile.name, imageFile.size);
        formData.append("imageFile", imageFile);
      } else {
        console.log('⚠️ No image file to append');
      }
      
      Object.entries(values).forEach(([key, value]) => {
        if (key === "secondary_colors" || key === "material" || key === "style_tags" || key === "season" || key === "weather_suitable") {
          const arrayValue = typeof value === 'string' 
            ? value.split(",").map((s: string) => s.trim()).filter(Boolean)
            : value;
          formData.append(key, JSON.stringify(arrayValue));
          console.log(`📋 ${key}:`, arrayValue);
        } else {
          formData.append(key, String(value));
          console.log(`📋 ${key}:`, value);
        }
      });
      
      console.log('🚀 Submitting form data');
      submit(formData, { method: "post", encType: "multipart/form-data" });
    },
  });
  
  // Update form when analysis is available
  useEffect(() => {
    if (analysis) {
      formik.setValues({
        name: analysis.name || "",
        category: analysis.category || "",
        subcategory: analysis.subcategory || "",
        primary_color: analysis.primary_color || "",
        secondary_colors: Array.isArray(analysis.secondary_colors) 
          ? analysis.secondary_colors.join(", ") 
          : "",
        brand: analysis.brand || "",
        material: Array.isArray(analysis.material) 
          ? analysis.material.join(", ") 
          : analysis.material || "",
        pattern: analysis.pattern || "",
        style_tags: Array.isArray(analysis.style_tags) 
          ? analysis.style_tags.join(", ") 
          : "",
        season: Array.isArray(analysis.season) 
          ? analysis.season.join(", ") 
          : analysis.season || "",
        weather_suitable: Array.isArray(analysis.weather_suitable) 
          ? analysis.weather_suitable.join(", ") 
          : analysis.weather_suitable || "",
        fit: analysis.fit || "regular",
        size: analysis.size || "",
        care_instructions: analysis.care_instructions || "",
        purchase_date: "",
        cost: "",
        sustainability_score: analysis.sustainability_score || 0,
        notes: analysis.notes || "",
        ai_confidence_score: analysis.ai_confidence_score || 0.8,
      });
      setIsEditing(false);
    }
  }, [analysis]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysis(null);
    setIsEditing(false);
  };

  const handleAnalyzeImage = () => {
    if (!imageFile) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    analyzeFetcher.submit(formData, { 
      method: "POST", 
      action: "/wardrobe/analyze",
      encType: "multipart/form-data" 
    });
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const isAnalyzing = analyzeFetcher.state === "submitting";
  const isSaving = navigation.state === "submitting";
  
  console.log('🔄 Navigation state:', navigation.state);
  console.log('🔄 Analyze fetcher state:', analyzeFetcher.state);
  console.log('🔄 Form valid:', formik.isValid);
  console.log('🔄 Form errors:', formik.errors);
  console.log('🔄 Form values:', formik.values);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Item to Wardrobe</h1>
        <p className="text-slate-600 mt-1">
          Upload an image and let AI analyze your clothing item
        </p>
      </div>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {analyzeFetcher.data?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{analyzeFetcher.data.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          {!analysis ? (
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Item Image</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={isAnalyzing}
                    className="hidden"
                    id="image-input"
                  />
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-48 h-48 object-contain rounded-lg mx-auto border shadow-sm"
                      />
                      <div className="space-y-2">
                        <label
                          htmlFor="image-input"
                          className="text-sm text-blue-600 hover:underline cursor-pointer block"
                        >
                          Change image
                        </label>
                        <Button
                          type="button"
                          onClick={handleAnalyzeImage}
                          disabled={isAnalyzing}
                          className="w-full"
                          size="lg"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analyzing with AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-5 w-5" />
                              Analyze with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="image-input"
                      className="cursor-pointer block"
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="font-medium text-lg mb-2">
                        Click to upload clothing image
                      </p>
                      <p className="text-sm text-slate-500 mb-1">
                        PNG, JPG, WebP up to 5MB
                      </p>
                      <p className="text-xs text-slate-400">
                        Focus on the item - avoid busy backgrounds
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Analysis Header */}
              <div className={`border rounded-lg p-4 ${confidenceColor(analysis.ai_confidence_score || 0.8)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-full">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Analysis Complete</h3>
                      <p className="text-sm opacity-80">
                        Confidence: {Math.round((analysis.ai_confidence_score || 0.8) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      {isEditing ? "View" : "Edit"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAnalysis(null);
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Item"
                    className="w-40 h-40 object-contain rounded-lg border shadow-sm"
                  />
                </div>
              )}

              {/* Analysis Preview or Edit Form */}
              {!isEditing ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-xl mb-4">{analysis.name}</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-600">Category:</span> 
                            <span className="capitalize">{analysis.category}{analysis.subcategory && ` • ${analysis.subcategory}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-600">Color:</span> 
                            <span className="capitalize">{analysis.primary_color}</span>
                          </div>
                          {analysis.brand && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Brand:</span> 
                              <span>{analysis.brand}</span>
                            </div>
                          )}
                          {analysis.material && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Material:</span> 
                              <span className="capitalize">{
                                Array.isArray(analysis.material) ? analysis.material.join(", ") : analysis.material
                              }</span>
                            </div>
                          )}
                          {analysis.pattern && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Pattern:</span> 
                              <span className="capitalize">{analysis.pattern}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="space-y-3 text-sm">
                          {analysis.style_tags && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Style:</span> 
                              <span className="capitalize">{
                                Array.isArray(analysis.style_tags) ? analysis.style_tags.join(", ") : analysis.style_tags
                              }</span>
                            </div>
                          )}
                          {analysis.season && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Season:</span> 
                              <span className="capitalize">{
                                Array.isArray(analysis.season) ? analysis.season.join(", ") : analysis.season
                              }</span>
                            </div>
                          )}
                          {analysis.weather_suitable && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Weather:</span> 
                              <span className="capitalize">{
                                Array.isArray(analysis.weather_suitable) ? analysis.weather_suitable.join(", ") : analysis.weather_suitable
                              }</span>
                            </div>
                          )}
                          {analysis.fit && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Fit:</span> 
                              <span className="capitalize">{analysis.fit}</span>
                            </div>
                          )}
                          {analysis.care_instructions && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Care:</span> 
                              <span className="text-xs">{analysis.care_instructions}</span>
                            </div>
                          )}
                          {analysis.sustainability_score && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Sustainability:</span> 
                              <span>{Math.round(analysis.sustainability_score * 100)}%</span>
                            </div>
                          )}
                          {analysis.size && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-600">Size:</span> 
                              <span>{analysis.size}</span>
                            </div>
                          )}
                        </div>
                        {analysis.notes && (
                          <div className="mt-6">
                            <span className="font-medium text-slate-600 block mb-2">Notes:</span>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md">{analysis.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <form onSubmit={formik.handleSubmit}>
                      <div className="flex gap-3 mt-8">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1"
                          size="lg"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-5 w-5" />
                              Looks Perfect - Save Item
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          size="lg"
                        >
                          <Edit3 className="mr-2 h-5 w-5" />
                          Edit Details
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={formik.handleSubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit Item Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Item Name *</Label>
                          <Input
                            {...formik.getFieldProps("name")}
                            placeholder="e.g., Blue Denim Jacket"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Input
                            {...formik.getFieldProps("category")}
                            placeholder="e.g., tops, bottoms, shoes"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subcategory">Subcategory</Label>
                          <Input
                            {...formik.getFieldProps("subcategory")}
                            placeholder="e.g., t-shirt, jeans, sneakers"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="primary_color">Primary Color *</Label>
                          <Input
                            {...formik.getFieldProps("primary_color")}
                            placeholder="e.g., blue, black, white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary_colors">Secondary Colors</Label>
                          <Input
                            {...formik.getFieldProps("secondary_colors")}
                            placeholder="e.g., white, gray (comma separated)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand">Brand</Label>
                          <Input
                            {...formik.getFieldProps("brand")}
                            placeholder="e.g., Nike, Zara, H&M"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="material">Material</Label>
                          <Input
                            {...formik.getFieldProps("material")}
                            placeholder="e.g., cotton, denim, leather"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pattern">Pattern</Label>
                          <Input
                            {...formik.getFieldProps("pattern")}
                            placeholder="e.g., solid, striped, floral"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fit">Fit</Label>
                          <Input
                            {...formik.getFieldProps("fit")}
                            placeholder="e.g., regular, slim, oversized"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="size">Size</Label>
                          <Input
                            {...formik.getFieldProps("size")}
                            placeholder="e.g., M, 32, One Size"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="season">Season</Label>
                          <Input
                            {...formik.getFieldProps("season")}
                            placeholder="e.g., spring, summer, all-season"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weather_suitable">Weather Suitable</Label>
                          <Input
                            {...formik.getFieldProps("weather_suitable")}
                            placeholder="e.g., sunny, rainy, cold (comma separated)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="purchase_date">Purchase Date</Label>
                          <Input
                            type="date"
                            {...formik.getFieldProps("purchase_date")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cost">Cost ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...formik.getFieldProps("cost")}
                            placeholder="e.g., 29.99"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="style_tags">Style Tags</Label>
                          <Input
                            {...formik.getFieldProps("style_tags")}
                            placeholder="e.g., casual, formal, vintage (comma separated)"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="care_instructions">Care Instructions</Label>
                          <Input
                            {...formik.getFieldProps("care_instructions")}
                            placeholder="e.g., Machine wash cold, tumble dry low"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          {...formik.getFieldProps("notes")}
                          placeholder="Additional notes about the item..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={isSaving} className="flex-1">
                          {isSaving ? "Saving..." : "Save Item"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}