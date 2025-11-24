import { useState, useEffect, useImperativeHandle, useRef } from "react";
import { useFetcher } from "react-router";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { clothingItemSchema } from "@/lib/schemas";
import { useToast } from "@/lib/use-toast";

export type Analysis = {
  name: string;
  category: string;
  subcategory?: string;
  primary_color: string;
  secondary_colors?: string[];
  brand?: string;
  material?: string[];
  pattern?: string;
  style_tags: string[];
  season?: string[];
  weather_suitable?: string[];
  fit?: string;
  size?: string;
  care_instructions?: string;
  sustainability_score?: number;
  notes?: string;
  confidence: number;
};

export type UploadedItemHandle = {
  getAnalysis: () => Analysis | null;
};

type Props = {
  file: File;
  index: number;
  onRemove: () => void;
  onAnalysisChange?: (index: number, hasAnalysis: boolean) => void;
  ref?: React.Ref<UploadedItemHandle>;
};

export function WardrobeUploadedItem({ file, index, onRemove, onAnalysisChange, ref }: Props) {
  const fetcher = useFetcher();
  const toast = useToast();
  const hasShownToastRef = useRef(false);
  const [manualAnalysis, setManualAnalysis] = useState<Analysis | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<Analysis | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const formData = new FormData();
    formData.append("image", file);
    fetcher.submit(formData, {
      method: "POST",
      action: "/wardrobe/analyze",
      encType: "multipart/form-data",
    });
  }, []);

  const analysis = editedAnalysis || manualAnalysis || 
    (fetcher.data && !fetcher.data.error && fetcher.data.name
      ? {
          name: fetcher.data.name || "Clothing Item",
          category: fetcher.data.category || "Unknown",
          subcategory: fetcher.data.subcategory,
          primary_color: fetcher.data.primary_color || "Unknown",
          secondary_colors: fetcher.data.secondary_colors,
          brand: fetcher.data.brand,
          material: fetcher.data.material,
          pattern: fetcher.data.pattern,
          style_tags: fetcher.data.style_tags || [],
          season: fetcher.data.season,
          weather_suitable: fetcher.data.weather_suitable,
          fit: fetcher.data.fit,
          size: fetcher.data.size,
          care_instructions: fetcher.data.care_instructions,
          sustainability_score: fetcher.data.sustainability_score,
          notes: fetcher.data.notes,
          confidence: fetcher.data.ai_confidence_score || 0.7,
        }
      : null);

  const isAnalyzing = fetcher.state !== "idle";
  const hasFailed = fetcher.state === "idle" && (fetcher.data?.error || !fetcher.data?.name);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !hasShownToastRef.current) {
      if (fetcher.data.error || !fetcher.data.name) {
        toast.error(`Failed to analyze ${file.name}`);
      } else {
        toast.success(`${fetcher.data.name} analyzed successfully`);
      }
      hasShownToastRef.current = true;
    }

    if (analysis && onAnalysisChange) {
      onAnalysisChange(index, true);
    }
  }, [fetcher.state, fetcher.data, analysis, file.name, toast, index, onAnalysisChange]);

  useImperativeHandle(ref, () => ({ getAnalysis: () => analysis }), [analysis]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: analysis?.name || "",
      category: analysis?.category || "",
      subcategory: analysis?.subcategory || "",
      primary_color: analysis?.primary_color || "",
      secondary_colors: analysis?.secondary_colors?.join(", ") || "",
      material: Array.isArray(analysis?.material) ? analysis.material.join(", ") : "",
      pattern: analysis?.pattern || "",
      style_tags: analysis?.style_tags?.join(", ") || "",
      season: Array.isArray(analysis?.season) ? analysis.season.join(", ") : "",
      weather_suitable: Array.isArray(analysis?.weather_suitable) ? analysis.weather_suitable.join(", ") : "",
      fit: analysis?.fit || "",
      brand: analysis?.brand || "",
      size: analysis?.size || "",
      sustainability_score: analysis?.sustainability_score?.toString() || "",
      notes: analysis?.notes || "",
    },
    validationSchema: toFormikValidationSchema(clothingItemSchema),
    onSubmit: (values) => {
      setIsSavingEdit(true);
      const updated: Analysis = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory || undefined,
        primary_color: values.primary_color,
        secondary_colors: values.secondary_colors.split(",").map((s: string) => s.trim()).filter(Boolean),
        material: values.material.split(",").map((s: string) => s.trim()).filter(Boolean),
        pattern: values.pattern || undefined,
        style_tags: values.style_tags.split(",").map((s: string) => s.trim()).filter(Boolean),
        season: values.season.split(",").map((s: string) => s.trim()).filter(Boolean),
        weather_suitable: values.weather_suitable.split(",").map((s: string) => s.trim()).filter(Boolean),
        fit: values.fit || undefined,
        brand: values.brand || undefined,
        size: values.size || undefined,
        sustainability_score: values.sustainability_score ? parseFloat(values.sustainability_score) : undefined,
        notes: values.notes || undefined,
        confidence: (analysis?.confidence || 0.7) * 0.9,
      };
      setEditedAnalysis(updated);
      setIsExpanded(false);
      setIsSavingEdit(false);
      toast.success("Changes saved");
    },
  });

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Compact Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="relative">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {analysis ? (
            <>
              <p className="text-sm font-medium truncate">{analysis.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{analysis.category}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{analysis.primary_color}</span>
                {analysis.confidence && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(analysis.confidence * 100)}% confident
                    </span>
                  </>
                )}
              </div>
            </>
          ) : isAnalyzing ? (
            <>
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Analyzing...</span>
              </div>
            </>
          ) : hasFailed ? (
            <>
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-destructive">Analysis failed</p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setManualAnalysis(null);
                      hasShownToastRef.current = false;
                      const formData = new FormData();
                      formData.append("image", file);
                      fetcher.submit(formData, {
                        method: "POST",
                        action: "/wardrobe/analyze",
                        encType: "multipart/form-data",
                      });
                    }}
                    className="h-5 px-2 text-xs text-primary hover:text-primary/80"
                  >
                    Retry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const defaultAnalysis: Analysis = {
                        name: "Clothing Item",
                        category: "tops",
                        primary_color: "unknown",
                        style_tags: ["casual"],
                        confidence: 0.1,
                      };
                      setManualAnalysis(defaultAnalysis);
                      if (onAnalysisChange) {
                        onAnalysisChange(index, true);
                      }
                    }}
                    className="h-5 px-2 text-xs text-primary hover:text-primary/80"
                  >
                    Manual
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {analysis && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Expanded Edit Form */}
      {analysis && isExpanded && (
        <form onSubmit={formik.handleSubmit} className="border-t border-border p-4 space-y-4 bg-muted/30">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Basic Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Name *</label>
                <input
                  type="text"
                  {...formik.getFieldProps("name")}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-destructive mt-1">{String(formik.errors.name)}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Category *</label>
                <input
                  type="text"
                  {...formik.getFieldProps("category")}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Subcategory</label>
                <input
                  type="text"
                  {...formik.getFieldProps("subcategory")}
                  placeholder="e.g., t-shirt, jeans"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Fit</label>
                <select
                  {...formik.getFieldProps("fit")}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                >
                  <option value="">Select fit</option>
                  <option value="tight">Tight</option>
                  <option value="fitted">Fitted</option>
                  <option value="regular">Regular</option>
                  <option value="loose">Loose</option>
                  <option value="oversized">Oversized</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors & Materials */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Colors & Materials</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Primary Color *</label>
                <input
                  type="text"
                  {...formik.getFieldProps("primary_color")}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Secondary Colors</label>
                <input
                  type="text"
                  {...formik.getFieldProps("secondary_colors")}
                  placeholder="red, blue (comma separated)"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Material</label>
                <input
                  type="text"
                  {...formik.getFieldProps("material")}
                  placeholder="cotton, polyester"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Pattern</label>
                <input
                  type="text"
                  {...formik.getFieldProps("pattern")}
                  placeholder="striped, solid, floral"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Style & Season */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Style & Season</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Style Tags</label>
                <input
                  type="text"
                  {...formik.getFieldProps("style_tags")}
                  placeholder="casual, formal, vintage"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Season</label>
                <input
                  type="text"
                  {...formik.getFieldProps("season")}
                  placeholder="summer, winter, all-season"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1">Weather Suitable</label>
                <input
                  type="text"
                  {...formik.getFieldProps("weather_suitable")}
                  placeholder="sunny, rainy, cold, hot"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Optional Details */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Optional Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Brand</label>
                <input
                  type="text"
                  {...formik.getFieldProps("brand")}
                  placeholder="Nike, Zara, etc."
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Size</label>
                <input
                  type="text"
                  {...formik.getFieldProps("size")}
                  placeholder="S, M, L, XL"
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1">Notes</label>
                <textarea
                  {...formik.getFieldProps("notes")}
                  rows={2}
                  placeholder="Any additional details..."
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={!formik.isValid || isSavingEdit}
              className="flex-1 cursor-pointer"
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                formik.resetForm();
                setIsExpanded(false);
              }}
              disabled={isSavingEdit}
              className="flex-1 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
