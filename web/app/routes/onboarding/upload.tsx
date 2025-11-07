import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSubmit, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, Camera } from "lucide-react";
import { UploadedItem, type Analysis } from "@/components/UploadedItem";

export async function loader({ request }: LoaderFunctionArgs) {
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { items: [] };
  }
  
  // Get existing clothing items for this user
  const { data: items } = await supabase
    .from('clothing_items')
    .select(`
      id,
      name,
      image_url,
      primary_color,
      category:clothing_categories(name),
      subcategory:clothing_subcategories(name),
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
    
  // Generate signed URLs for images
  const itemsWithUrls = await Promise.all(
    (items || []).map(async (item) => {
      if (item.image_url) {
        const { data: signedUrl } = await supabase.storage
          .from('clothing')
          .createSignedUrl(item.image_url, 3600); // 1 hour expiry
        return {
          ...item,
          signed_url: signedUrl?.signedUrl || null
        };
      }
      return item;
    })
  );
    
  return { items: itemsWithUrls || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);
  
  console.log("[UPLOAD] Starting upload action");
  
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const analysesStr = formData.get("analyses") as string;
  
  console.log("[UPLOAD] Files received:", files.length);
  console.log("[UPLOAD] Analyses string length:", analysesStr?.length || 0);
  
  let analyses: Analysis[];
  try {
    analyses = JSON.parse(analysesStr);
    console.log("[UPLOAD] Parsed analyses:", analyses.length);
  } catch (parseError) {
    console.error("[UPLOAD] Parse error:", parseError);
    return { error: "Invalid analysis data" };
  }

  if (!files.length || !analyses.length) {
    console.error("[UPLOAD] No items to save - files:", files.length, "analyses:", analyses.length);
    return { error: "No items to save" };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[UPLOAD] Auth error:", authError);
      return { error: "Authentication failed" };
    }
    if (!user) {
      console.error("[UPLOAD] No user found");
      return { error: "Not authenticated" };
    }
    
    console.log("[UPLOAD] User authenticated:", user.id);

    const savedItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const analysis = analyses[i];
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      console.log(`[UPLOAD] Processing item ${i + 1}/${files.length}:`, {
        fileName,
        fileSize: file.size,
        analysisName: analysis.name,
        analysisCategory: analysis.category
      });

      const { error: uploadError } = await supabase.storage
        .from("clothing")
        .upload(fileName, file);

      if (uploadError) {
        console.error(`[UPLOAD] Storage upload error for item ${i + 1}:`, uploadError);
        throw uploadError;
      }
      
      console.log(`[UPLOAD] File uploaded successfully: ${fileName}`);

      // Find or create category using RPC function
      let categoryId = null;
      let subcategoryId = null;
      
      console.log(`[UPLOAD] Processing category for item ${i + 1}:`, analysis.category);
      
      if (analysis.category?.trim()) {
        const { data: categoryIdResult, error: catError } = await supabase
          .rpc('find_or_create_category', { category_name: analysis.category.trim() });
        
        if (catError) {
          console.error(`[UPLOAD] Category RPC error for item ${i + 1}:`, catError);
          throw new Error(`Failed to process category: ${catError.message}`);
        }
        
        categoryId = categoryIdResult;
        console.log(`[UPLOAD] Category ID for item ${i + 1}:`, categoryId);
        
        // Handle subcategory if provided
        if (analysis.subcategory?.trim() && categoryId) {
          console.log(`[UPLOAD] Processing subcategory for item ${i + 1}:`, analysis.subcategory);
          const { data: subcategoryIdResult, error: subError } = await supabase
            .rpc('find_or_create_subcategory', { 
              subcategory_name: analysis.subcategory.trim(), 
              parent_category_id: categoryId 
            });
          
          if (subError) {
            console.error(`[UPLOAD] Subcategory RPC error for item ${i + 1}:`, subError);
          } else {
            subcategoryId = subcategoryIdResult;
            console.log(`[UPLOAD] Subcategory ID for item ${i + 1}:`, subcategoryId);
          }
        }
      }
      
      // Normalize arrays and values
      const normalizeValue = (value: string) => value.toLowerCase().replace(/[\s-]/g, '_');
      const seasonNames = Array.isArray(analysis.season) 
        ? analysis.season.map((s: string) => normalizeValue(s))
        : [];
      const weatherSuitableNames = Array.isArray(analysis.weather_suitable)
        ? analysis.weather_suitable.map((w: string) => normalizeValue(w))
        : [];
      
      // Generate embedding for similarity search
      const embeddingText = `${analysis.name || ''} ${analysis.primary_color || ''} ${analysis.category || ''} ${analysis.subcategory || ''} ${analysis.brand || ''} ${Array.isArray(analysis.material) ? analysis.material.join(' ') : analysis.material || ''} ${analysis.pattern || ''} ${seasonNames.join(' ')} ${Array.isArray(analysis.style_tags) ? analysis.style_tags.join(' ') : ''}`;
      
      console.log(`[UPLOAD] Generating embedding for item ${i + 1}:`, embeddingText.substring(0, 100) + '...');
      
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
          console.log(`[UPLOAD] Embedding generated for item ${i + 1}:`, embedding.length, 'characters');
        } else {
          console.warn(`[UPLOAD] No embedding values returned for item ${i + 1}:`, embeddingResult);
        }
      } catch (embeddingError) {
        console.error(`[UPLOAD] Embedding error for item ${i + 1}:`, embeddingError);
        // Continue without embedding - not critical
      }
      
      // Store full AI metadata
      const aiMetadata = {
        analysis_timestamp: new Date().toISOString(),
        confidence_score: analysis.confidence || 0.8,
        embedding_text: embeddingText,
        raw_analysis: analysis
      };

      const itemData = {
        user_id: user.id,
        name: analysis.name || 'Clothing Item',
        category_id: categoryId,
        subcategory_id: subcategoryId,
        primary_color: analysis.primary_color || 'Unknown',
        secondary_colors: analysis.secondary_colors || [],
        brand: analysis.brand || null,
        material: Array.isArray(analysis.material) ? analysis.material : [],
        pattern: analysis.pattern || null,
        season_names: seasonNames,
        weather_suitable_names: weatherSuitableNames,
        fit_name: analysis.fit ? normalizeValue(analysis.fit) : 'regular',
        size: analysis.size || null,
        notes: analysis.notes || null,
        care_instructions: analysis.care_instructions || null,
        sustainability_score: analysis.sustainability_score || 0,
        times_worn: 0,
        image_url: fileName,
        ai_confidence_score: analysis.confidence || 0.8,
        ai_metadata: aiMetadata,
        embedding: embedding,
      };
      
      console.log(`[UPLOAD] Item data prepared for item ${i + 1}:`, {
        name: itemData.name,
        category_id: itemData.category_id,
        subcategory_id: itemData.subcategory_id,
        primary_color: itemData.primary_color,
        image_url: itemData.image_url
      });
      
      savedItems.push({ itemData, styleTags: analysis.style_tags || [] });
    }
    
    console.log(`[UPLOAD] Inserting ${savedItems.length} items into database`);
    
    for (let j = 0; j < savedItems.length; j++) {
      const { itemData, styleTags } = savedItems[j];
      
      console.log(`[UPLOAD] Inserting item ${j + 1}/${savedItems.length} into database`);
      
      const { data: newItem, error: dbError } = await supabase
        .from("clothing_items")
        .insert(itemData)
        .select('id')
        .single();

      if (dbError) {
        console.error(`[UPLOAD] Database insert error for item ${j + 1}:`, dbError);
        console.error(`[UPLOAD] Failed item data:`, itemData);
        throw dbError;
      }
      
      console.log(`[UPLOAD] Item ${j + 1} inserted successfully with ID:`, newItem.id);
      
      // Add style tags using RPC function
      if (Array.isArray(styleTags) && styleTags.length > 0) {
        console.log(`[UPLOAD] Adding ${styleTags.length} style tags to item ${j + 1}:`, styleTags);
        
        const { error: tagsError } = await supabase
          .rpc('add_style_tags_to_item', { 
            item_id: newItem.id, 
            tag_names: styleTags.map(tag => String(tag).trim()).filter(Boolean)
          });
        
        if (tagsError) {
          console.error(`[UPLOAD] Style tags error for item ${j + 1}:`, tagsError);
          // Don't fail the entire operation for style tag errors
        } else {
          console.log(`[UPLOAD] Style tags added successfully for item ${j + 1}`);
        }
      }
    }
    
    console.log(`[UPLOAD] All items saved successfully`);
    return { success: true };
  } catch (error) {
    console.error("[UPLOAD] Fatal error:", error);
    console.error("[UPLOAD] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return { error: error instanceof Error ? error.message : "Failed to save items" };
  }
}

export default function OnboardingUpload({ loaderData }: { loaderData: { items: any[] } }) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData() as { success?: boolean; error?: string } | undefined;
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<boolean[]>([]);
  const itemRefs = useRef<({ getAnalysis: () => Analysis | null } | null)[]>([]);
  
  const existingItems = loaderData?.items || [];
  const hasExistingItems = existingItems.length > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setAnalyzedItems((prev) => [...prev, ...new Array(validFiles.length).fill(false)]);
    setError(null);
  };

  const removeItem = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setAnalyzedItems((prev) => prev.filter((_, i) => i !== index));
    // Properly clean up refs array to match new indices
    const newRefs = itemRefs.current.filter((_, i) => i !== index);
    itemRefs.current = newRefs;
    // Ensure refs array length matches files array length
    itemRefs.current.length = files.length - 1;
  };

  const handleAnalysisChange = useCallback((index: number, hasAnalysis: boolean) => {
    setAnalyzedItems((prev) => {
      const newState = [...prev];
      newState[index] = hasAnalysis;
      return newState;
    });
  }, []);

  const analyzedCount = analyzedItems.filter(Boolean).length;

  const handleContinue = () => {
    console.log("[CLIENT] Starting continue process");
    
    // Get analysis from each component via refs
    const analyzedItemsData = files
      .map((file, index) => {
        const ref = itemRefs.current[index];
        const analysis = ref?.getAnalysis();
        console.log(`[CLIENT] Item ${index + 1} analysis:`, analysis ? 'Found' : 'Missing', analysis?.name);
        return analysis ? { file, analysis } : null;
      })
      .filter((item): item is { file: File; analysis: Analysis } => item !== null);

    console.log(`[CLIENT] Analyzed items ready: ${analyzedItemsData.length}/${files.length}`);
    console.log(`[CLIENT] Has existing items: ${hasExistingItems}`);

    // If no new items but has existing items, proceed to next step
    if (analyzedItemsData.length === 0 && hasExistingItems) {
      console.log("[CLIENT] No new items, proceeding with existing items");
      navigate("/onboarding/first-recommendation");
      return;
    }
    
    // If no new items and no existing items, show error
    if (analyzedItemsData.length === 0) {
      console.log("[CLIENT] No items to save, showing error");
      setError("Please upload at least one item");
      return;
    }

    console.log("[CLIENT] Starting save process");
    setSaving(true);

    const formData = new FormData();
    analyzedItemsData.forEach(({ file }, index) => {
      console.log(`[CLIENT] Adding file ${index + 1} to form data:`, file.name);
      formData.append("files", file);
    });
    
    const analysesJson = JSON.stringify(analyzedItemsData.map(({ analysis }) => analysis));
    console.log(`[CLIENT] Adding analyses to form data (${analysesJson.length} chars):`, analysesJson.substring(0, 200) + '...');
    formData.append("analyses", analysesJson);

    console.log("[CLIENT] Submitting form data");
    submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
  };

  // Handle action response
  useEffect(() => {
    if (actionData) {
      console.log("[CLIENT] Action response received:", actionData);
    }
    
    if (actionData?.success) {
      console.log("[CLIENT] Save successful, navigating to next step");
      navigate("/onboarding/first-recommendation");
    } else if (actionData?.error) {
      console.error("[CLIENT] Save failed:", actionData.error);
      setError(actionData.error);
      setSaving(false);
    }
  }, [actionData, navigate]);



  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Show us your style
            </h1>
            <p className="text-muted-foreground">
              Upload 3-5 of your favorite pieces. Our AI will analyze them
              instantly!
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Camera className="h-5 w-5" />
              Take or upload photos
            </CardTitle>
            <CardDescription>
              Good lighting and clear photos work best. We'll do the rest!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={saving}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500">
                  PNG, JPG, WebP up to 5MB
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{files.length} item(s) uploaded</p>
                  {analyzedCount < files.length && (
                    <p className="text-sm text-slate-600">
                      {analyzedCount} of {files.length} analyzed
                    </p>
                  )}
                  {analyzedCount === files.length && files.length > 0 && (
                    <p className="text-sm text-blue-600 font-medium">
                      All items analyzed ✓
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <UploadedItem
                      key={`${file.name}-${file.size}-${index}`}
                      index={index}
                      ref={(el) => { itemRefs.current[index] = el; }}
                      file={file}
                      onRemove={() => removeItem(index)}
                      onAnalysisChange={handleAnalysisChange}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleContinue}
                disabled={saving || (analyzedCount === 0 && !hasExistingItems)}
                className="flex-1"
              >
                {saving
                  ? "Saving..."
                  : hasExistingItems && analyzedCount === 0
                  ? "Continue with existing items"
                  : `Continue with ${analyzedCount} items`}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/onboarding/first-recommendation")}
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasExistingItems && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Your Existing Items</CardTitle>
              <CardDescription>
                You already have {existingItems.length} item(s) in your wardrobe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    {item.signed_url && (
                      <img
                        src={item.signed_url}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="text-xs">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-slate-500 capitalize">
                        {item.category?.name} • {item.primary_color}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="text-center text-sm text-slate-600">
          <p>Don't worry, you can add more items anytime!</p>
        </div>
      </div>
    </div>
  );
}