import { useState, useRef, useCallback, useEffect, Suspense, use } from "react";
import { useNavigate, redirect } from "react-router";
import type { Route } from "./+types/add";
import { Button } from "@/components/ui/button";
import { Upload, Camera, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/use-toast";
import { WardrobeUploadedItem, type Analysis } from "@/components/WardrobeUploadedItem";
import { createClient } from "@/lib/supabase.server";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { PlanComparisonDialog } from "@/components/PlanComparisonDialog";
import type { Tables } from "@/lib/database.types";

type Plan = Tables<"subscription_plans">;
type PlanLimit = Tables<"plan_limits">;
type Subscription = { plan_id: string } | null;

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  // Get plans and limits for upgrade modal
  const plansPromise = supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price")
    .then(({ data }) => data || []);

  const planLimitsPromise = supabase
    .from("plan_limits")
    .select("*")
    .then(({ data }) => data || []);

  const subscriptionPromise = supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
    .then(({ data }) => data);

  return {
    plansPromise,
    planLimitsPromise,
    subscriptionPromise,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  console.log("[WARDROBE-ADD] Starting upload action");

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const analysesStr = formData.get("analyses") as string;

  console.log("[WARDROBE-ADD] Files received:", files.length);
  console.log(
    "[WARDROBE-ADD] Analyses string length:",
    analysesStr?.length || 0
  );

  let analyses: Analysis[];
  try {
    analyses = JSON.parse(analysesStr);
    console.log("[WARDROBE-ADD] Parsed analyses:", analyses.length);
  } catch (parseError) {
    console.error("[WARDROBE-ADD] Parse error:", parseError);
    return { error: "Invalid analysis data" };
  }

  if (!files.length || !analyses.length) {
    console.error(
      "[WARDROBE-ADD] No items to save - files:",
      files.length,
      "analyses:",
      analyses.length
    );
    return { error: "No items to save" };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error("[WARDROBE-ADD] Auth error:", authError);
      return { error: "Authentication failed" };
    }
    if (!user) {
      console.error("[WARDROBE-ADD] No user found");
      return { error: "Not authenticated" };
    }

    console.log("[WARDROBE-ADD] User authenticated:", user.id);

    const savedItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const analysis = analyses[i];
      const fileName = `${user.id}/${Date.now()}-${file.name}`;

      console.log(`[WARDROBE-ADD] Processing item ${i + 1}/${files.length}:`, {
        fileName,
        fileSize: file.size,
        analysisName: analysis.name,
        analysisCategory: analysis.category,
      });

      const { error: uploadError } = await supabase.storage
        .from("clothing")
        .upload(fileName, file);

      if (uploadError) {
        console.error(
          `[WARDROBE-ADD] Storage upload error for item ${i + 1}:`,
          uploadError
        );
        throw uploadError;
      }

      console.log(`[WARDROBE-ADD] File uploaded successfully: ${fileName}`);

      // Find or create category using RPC function
      let categoryId = null;
      let subcategoryId = null;

      console.log(
        `[WARDROBE-ADD] Processing category for item ${i + 1}:`,
        analysis.category
      );

      if (analysis.category?.trim()) {
        const { data: categoryIdResult, error: catError } = await supabase.rpc(
          "find_or_create_category",
          { category_name: analysis.category.trim() }
        );

        if (catError) {
          console.error(
            `[WARDROBE-ADD] Category RPC error for item ${i + 1}:`,
            catError
          );
          throw new Error(`Failed to process category: ${catError.message}`);
        }

        categoryId = categoryIdResult;
        console.log(
          `[WARDROBE-ADD] Category ID for item ${i + 1}:`,
          categoryId
        );

        // Handle subcategory if provided
        if (analysis.subcategory?.trim() && categoryId) {
          console.log(
            `[WARDROBE-ADD] Processing subcategory for item ${i + 1}:`,
            analysis.subcategory
          );
          const { data: subcategoryIdResult, error: subError } =
            await supabase.rpc("find_or_create_subcategory", {
              subcategory_name: analysis.subcategory.trim(),
              parent_category_id: categoryId,
            });

          if (subError) {
            console.error(
              `[WARDROBE-ADD] Subcategory RPC error for item ${i + 1}:`,
              subError
            );
          } else {
            subcategoryId = subcategoryIdResult;
            console.log(
              `[WARDROBE-ADD] Subcategory ID for item ${i + 1}:`,
              subcategoryId
            );
          }
        }
      }

      // Normalize arrays and values
      const normalizeValue = (value: string) =>
        value.toLowerCase().replace(/[\s-]/g, "_");
      const seasonNames = Array.isArray(analysis.season)
        ? analysis.season.map((s: string) => normalizeValue(s))
        : [];
      const weatherSuitableNames = Array.isArray(analysis.weather_suitable)
        ? analysis.weather_suitable.map((w: string) => normalizeValue(w))
        : [];

      // Generate embedding for similarity search
      const embeddingText = `${analysis.name || ""} ${analysis.primary_color || ""} ${analysis.category || ""} ${analysis.subcategory || ""} ${analysis.brand || ""} ${Array.isArray(analysis.material) ? analysis.material.join(" ") : analysis.material || ""} ${analysis.pattern || ""} ${seasonNames.join(" ")} ${Array.isArray(analysis.style_tags) ? analysis.style_tags.join(" ") : ""}`;

      console.log(
        `[WARDROBE-ADD] Generating embedding for item ${i + 1}:`,
        embeddingText.substring(0, 100) + "..."
      );

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
                parts: [{ text: embeddingText }],
              },
            }),
          }
        );

        const embeddingResult = await embeddingResponse.json();
        if (embeddingResult.embedding?.values) {
          embedding = JSON.stringify(embeddingResult.embedding.values);
          console.log(
            `[WARDROBE-ADD] Embedding generated for item ${i + 1}:`,
            embedding.length,
            "characters"
          );
        } else {
          console.warn(
            `[WARDROBE-ADD] No embedding values returned for item ${i + 1}:`,
            embeddingResult
          );
        }
      } catch (embeddingError) {
        console.error(
          `[WARDROBE-ADD] Embedding error for item ${i + 1}:`,
          embeddingError
        );
        // Continue without embedding - not critical
      }

      // Store full AI metadata
      const aiMetadata = {
        analysis_timestamp: new Date().toISOString(),
        confidence_score: analysis.confidence || 0.8,
        embedding_text: embeddingText,
        raw_analysis: analysis,
      };

      const itemData = {
        user_id: user.id,
        name: analysis.name || "Clothing Item",
        category_id: categoryId,
        subcategory_id: subcategoryId,
        primary_color: analysis.primary_color || "Unknown",
        secondary_colors: analysis.secondary_colors || [],
        brand: analysis.brand || null,
        material: Array.isArray(analysis.material) ? analysis.material : [],
        pattern: analysis.pattern || null,
        season_names: seasonNames,
        weather_suitable_names: weatherSuitableNames,
        fit_name: analysis.fit ? normalizeValue(analysis.fit) : "regular",
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

      console.log(`[WARDROBE-ADD] Item data prepared for item ${i + 1}:`, {
        name: itemData.name,
        category_id: itemData.category_id,
        subcategory_id: itemData.subcategory_id,
        primary_color: itemData.primary_color,
        image_url: itemData.image_url,
      });

      savedItems.push({ itemData, styleTags: analysis.style_tags || [] });
    }

    console.log(
      `[WARDROBE-ADD] Inserting ${savedItems.length} items into database`
    );

    for (let j = 0; j < savedItems.length; j++) {
      const { itemData, styleTags } = savedItems[j];

      console.log(
        `[WARDROBE-ADD] Inserting item ${j + 1}/${savedItems.length} into database`
      );

      const { data: newItem, error: dbError } = await supabase
        .from("clothing_items")
        .insert(itemData)
        .select("id")
        .single();

      if (dbError) {
        console.error(
          `[WARDROBE-ADD] Database insert error for item ${j + 1}:`,
          dbError
        );
        console.error(`[WARDROBE-ADD] Failed item data:`, itemData);
        throw dbError;
      }

      console.log(
        `[WARDROBE-ADD] Item ${j + 1} inserted successfully with ID:`,
        newItem.id
      );

      // Add style tags using RPC function
      if (Array.isArray(styleTags) && styleTags.length > 0) {
        console.log(
          `[WARDROBE-ADD] Adding ${styleTags.length} style tags to item ${j + 1}:`,
          styleTags
        );

        const { error: tagsError } = await supabase.rpc(
          "add_style_tags_to_item",
          {
            item_id: newItem.id,
            tag_names: styleTags
              .map((tag) => String(tag).trim())
              .filter(Boolean),
          }
        );

        if (tagsError) {
          console.error(
            `[WARDROBE-ADD] Style tags error for item ${j + 1}:`,
            tagsError
          );
          // Don't fail the entire operation for style tag errors
        } else {
          console.log(
            `[WARDROBE-ADD] Style tags added successfully for item ${j + 1}`
          );
        }
      }
    }

    console.log(`[WARDROBE-ADD] All items saved successfully`);
    return redirect(`/wardrobe?success=items-added&count=${savedItems.length}`);
  } catch (error) {
    console.error("[WARDROBE-ADD] Fatal error:", error);
    console.error(
      "[WARDROBE-ADD] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save items",
    };
  }
}

export default function AddItemPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [analyzedItems, setAnalyzedItems] = useState<boolean[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const itemRefs = useRef<({ getAnalysis: () => Analysis | null } | null)[]>([]);
  const { showUpgradeModal, setShowUpgradeModal, checkUsageLimit, usageData } = useUsageLimits();

  // Check usage limit when component mounts
  useEffect(() => {
    checkUsageLimit("uploads");
  }, []);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
          <AddItemContent 
            files={files}
            setFiles={setFiles}
            analyzedItems={analyzedItems}
            setAnalyzedItems={setAnalyzedItems}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            itemRefs={itemRefs}
            navigate={navigate}
            toast={toast}
            usageData={usageData}
            showUpgradeModal={showUpgradeModal}
            setShowUpgradeModal={setShowUpgradeModal}
            promises={loaderData}
          />
        </Suspense>
      </div>
    </main>
  );
}

function AddItemContent({
  files,
  setFiles,
  analyzedItems,
  setAnalyzedItems,
  isSaving,
  setIsSaving,
  itemRefs,
  navigate,
  toast,
  usageData,
  showUpgradeModal,
  setShowUpgradeModal,
  promises,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  analyzedItems: boolean[];
  setAnalyzedItems: React.Dispatch<React.SetStateAction<boolean[]>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  itemRefs: React.MutableRefObject<({ getAnalysis: () => Analysis | null } | null)[]>;
  navigate: any;
  toast: any;
  usageData: any;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  promises: any;
}) {
  const plans = use(promises.plansPromise) as Plan[];
  const planLimits = use(promises.planLimitsPromise) as PlanLimit[];
  const subscription = use(promises.subscriptionPromise) as Subscription;



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user has reached upload limit
    if (usageData?.limitExceeded) {
      setShowUpgradeModal(true);
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const currentCount = files.length;
    const newCount = currentCount + selectedFiles.length;
    
    // Check if adding these files would exceed the limit
    if (usageData && newCount > (usageData.limit - usageData.current)) {
      const remaining = usageData.limit - usageData.current;
      if (remaining <= 0) {
        setShowUpgradeModal(true);
        return;
      }
      toast.error(`You can only upload ${remaining} more items this month`);
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setAnalyzedItems((prev) => [
      ...prev,
      ...new Array(validFiles.length).fill(false),
    ]);
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

  const handleAnalysisChange = useCallback(
    (index: number, hasAnalysis: boolean) => {
      setAnalyzedItems((prev) => {
        const newState = [...prev];
        newState[index] = hasAnalysis;
        return newState;
      });
    },
    []
  );

  const analyzedCount = analyzedItems.filter(Boolean).length;

  const handleSave = () => {
    if (isSaving) return;
    
    console.log("[CLIENT] Starting save process");

    // Get analysis from each component via refs
    const analyzedItemsData = files
      .map((file, index) => {
        const ref = itemRefs.current[index];
        const analysis = ref?.getAnalysis();
        console.log(
          `[CLIENT] Item ${index + 1} analysis:`,
          analysis ? "Found" : "Missing",
          analysis?.name
        );
        return analysis ? { file, analysis } : null;
      })
      .filter(
        (item): item is { file: File; analysis: Analysis } => item !== null
      );

    console.log(
      `[CLIENT] Analyzed items ready: ${analyzedItemsData.length}/${files.length}`
    );

    if (analyzedItemsData.length === 0) {
      console.log("[CLIENT] No items to save, showing error");
      toast.error("Please upload at least one item");
      return;
    }

    console.log("[CLIENT] Starting save process");

    const formData = new FormData();
    analyzedItemsData.forEach(({ file }, index) => {
      console.log(`[CLIENT] Adding file ${index + 1} to form data:`, file.name);
      formData.append("files", file);
    });

    const analysesJson = JSON.stringify(
      analyzedItemsData.map(({ analysis }) => analysis)
    );
    console.log(
      `[CLIENT] Adding analyses to form data (${analysesJson.length} chars):`,
      analysesJson.substring(0, 200) + "..."
    );
    formData.append("analyses", analysesJson);

    console.log("[CLIENT] Submitting form data");
    setIsSaving(true);
    
    // Use fetch to submit and handle redirect manually
    fetch('/wardrobe/add', {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        if (response.redirected) {
          // Follow the redirect
          window.location.href = response.url;
        } else if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save items');
        }
      })
      .catch((error) => {
        console.error('[CLIENT] Save failed:', error);
        setIsSaving(false);
        toast.error(error.message, {
          action: {
            label: 'Retry',
            onClick: () => window.location.reload()
          }
        });
      });
  };

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-semibold">
          Add Items to Wardrobe
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload multiple clothing items and let AI analyze them instantly!
        </p>
      </header>

      {/* Usage limit warning */}
      {usageData && (
        <div className={`rounded-lg p-4 border ${
          usageData.limitExceeded 
            ? "bg-destructive/10 border-destructive/20 text-destructive" 
            : usageData.current / usageData.limit > 0.8
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-muted/30 border-border"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">
              {usageData.limitExceeded 
                ? "Upload limit reached" 
                : `${usageData.current}/${usageData.limit} uploads used this month`
              }
            </span>
          </div>
          {usageData.limitExceeded ? (
            <p className="text-sm mb-3">
              You've reached your monthly upload limit. Upgrade to continue adding items.
            </p>
          ) : (
            <p className="text-sm">
              {usageData.limit - usageData.current} uploads remaining
            </p>
          )}
          {usageData.limitExceeded && (
            <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
              Upgrade Plan
            </Button>
          )}
        </div>
      )}

      <section className="bg-muted/30 rounded-lg p-4 sm:p-6 border border-border space-y-4">
          <div>
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload photos
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select multiple images for batch processing. Good lighting works best!
            </p>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer block">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, WebP up to 5MB each
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{files.length} item(s) uploaded</p>
                {analyzedCount < files.length && (
                  <p className="text-sm text-muted-foreground">
                    {analyzedCount} of {files.length} analyzed
                  </p>
                )}
                {analyzedCount === files.length && files.length > 0 && (
                  <p className="text-sm text-primary font-medium">
                    All items analyzed ✓
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <WardrobeUploadedItem
                    key={`${file.name}-${file.size}-${index}`}
                    index={index}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
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
              onClick={handleSave}
              disabled={analyzedCount === 0 || isSaving}
              className="flex-1 cursor-pointer"
            >
              {isSaving ? "Saving..." : `Save ${analyzedCount} items to wardrobe`}
            </Button>
            <Button variant="outline" onClick={() => navigate("/wardrobe")} disabled={isSaving} className="cursor-pointer">
              Cancel
            </Button>
          </div>
      </section>

      <footer className="text-center text-sm text-muted-foreground">
        <p>AI will analyze each item automatically after upload</p>
      </footer>

      {/* Upgrade Modal */}
      <PlanComparisonDialog
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        plans={plans}
        planLimits={planLimits}
        currentPlanId={subscription?.plan_id}
      />
    </>
  );
}
