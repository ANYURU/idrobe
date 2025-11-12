import { useState, useEffect, useImperativeHandle } from "react";
import { useFetcher } from "react-router";
import { X, Eye, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { clothingItemSchema } from "@/lib/schemas";
import * as Dialog from "@radix-ui/react-dialog";

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

type UploadedItemProps = {
  file: File;
  index: number;
  onRemove: () => void;
  onAnalysisChange?: (index: number, hasAnalysis: boolean) => void;
  ref?: React.Ref<UploadedItemHandle>;
};

export function UploadedItem({
  file,
  index,
  onRemove,
  onAnalysisChange,
  ref,
}: UploadedItemProps) {
  const fetcher = useFetcher();

  const [hasNotified, setHasNotified] = useState(false);
  const [manualAnalysis, setManualAnalysis] = useState<Analysis | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<Analysis | null>(null);

  // Submit analysis request on mount - only once
  useEffect(() => {
    console.log(`[ITEM-${index}] Starting analysis for:`, file.name);
    const formData = new FormData();
    formData.append("image", file);

    fetcher.submit(formData, {
      method: "POST",
      action: "/wardrobe/analyze",
      encType: "multipart/form-data",
    });
  }, []); // Empty deps - only run once on mount

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
      
  // Log fetcher state changes
  useEffect(() => {
    console.log(`[ITEM-${index}] Fetcher state:`, fetcher.state);
    if (fetcher.data) {
      console.log(`[ITEM-${index}] Fetcher data:`, fetcher.data);
    }
  }, [fetcher.state, fetcher.data]);

  const isAnalyzing = fetcher.state !== "idle";
  const hasFailed = fetcher.state === "idle" && (fetcher.data?.error || !fetcher.data?.name);

  // Notify parent when analysis completes - only once
  useEffect(() => {
    if (analysis && !hasNotified && onAnalysisChange) {
      console.log(`[ITEM-${index}] Analysis complete, notifying parent:`, analysis.name);
      onAnalysisChange(index, true);
      setHasNotified(true);
    }
  }, [!!analysis]); // Only when analysis status changes from null to exists





  // Expose getAnalysis method through ref
  useImperativeHandle(
    ref,
    () => ({
      getAnalysis: () => analysis,
    }),
    [analysis]
  );

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
        <div className="relative">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/90 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {analysis ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">
                {analysis.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded">
                  {analysis.category}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {analysis.primary_color}
                </span>
              </div>
            </>
          ) : isAnalyzing ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Analyzing...</span>
              </div>
            </>
          ) : hasFailed ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-destructive">Analysis failed</p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setManualAnalysis(null);
                      setHasNotified(false);
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
                        subcategory: undefined,
                        primary_color: "unknown",
                        secondary_colors: [],
                        brand: undefined,
                        material: ["unknown"],
                        pattern: undefined,
                        style_tags: ["casual"],
                        season: ["all-season"],
                        weather_suitable: ["mild"],
                        fit: "regular",
                        size: undefined,
                        care_instructions: undefined,
                        sustainability_score: 0.5,
                        notes: "Please edit details manually",
                        confidence: 0.1
                      };
                      setManualAnalysis(defaultAnalysis);
                      if (onAnalysisChange && !hasNotified) {
                        onAnalysisChange(index, true);
                        setHasNotified(true);
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
          <div className="flex gap-1">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Eye className="h-3 w-3" />
                </Button>
              </Dialog.Trigger>
              <ItemModal file={file} analysis={analysis} isEditing={false} onSave={() => {}} />
            </Dialog.Root>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </Dialog.Trigger>
              <ItemModal 
                file={file}
                analysis={analysis} 
                isEditing={true} 
                onSave={(updatedAnalysis) => setEditedAnalysis(updatedAnalysis)} 
              />
            </Dialog.Root>
          </div>
        )}
      </div>
    </>
  );
}

// ItemModal Component using Radix UI Dialog
function ItemModal({ file, analysis, isEditing, onSave }: {
  file: File;
  analysis: Analysis;
  isEditing: boolean;
  onSave: (analysis: Analysis) => void;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <Dialog.Title className="font-semibold text-foreground">
              {analysis.name}
            </Dialog.Title>
            <p className="text-sm text-muted-foreground mt-1">Clothing Item Details</p>
          </div>
          <Dialog.Close asChild>
            <button className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </div>

        {isEditing ? (
          <EditForm analysis={analysis} onSave={onSave} />
        ) : (
          <ViewMode analysis={analysis} />
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

// View Mode Component
function ViewMode({ analysis }: {
  analysis: Analysis;
}) {
  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
            <p className="text-sm text-foreground">{analysis.category}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Color</p>
            <p className="text-sm text-foreground">{analysis.primary_color}</p>
          </div>
        </div>

        {analysis.style_tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Style Tags</p>
            <div className="flex gap-1 flex-wrap">
              {analysis.style_tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">AI Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${analysis.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Dialog.Close asChild>
          <Button size="sm" className="flex-1">
            Close
          </Button>
        </Dialog.Close>
      </div>
    </>
  );
}

// Edit Form Component
function EditForm({ analysis, onSave }: {
  analysis: Analysis;
  onSave: (analysis: Analysis) => void;
}) {
  const formik = useFormik({
    initialValues: {
      name: analysis.name,
      category: analysis.category,
      subcategory: analysis.subcategory || '',
      primary_color: analysis.primary_color,
      brand: analysis.brand || '',
      style_tags: analysis.style_tags.join(', '),
      fit: analysis.fit || '',
      size: analysis.size || '',
      notes: analysis.notes || '',
    },
    validationSchema: toFormikValidationSchema(clothingItemSchema),
    onSubmit: (values) => {
      const updatedAnalysis: Analysis = {
        ...analysis,
        name: values.name,
        category: values.category,
        subcategory: values.subcategory || undefined,
        primary_color: values.primary_color,
        brand: values.brand || undefined,
        style_tags: values.style_tags.split(',').map(s => s.trim()).filter(Boolean),
        fit: values.fit || undefined,
        size: values.size || undefined,
        notes: values.notes || undefined,
        confidence: analysis.confidence * 0.9, // Slightly reduce confidence for edited items
      };
      onSave(updatedAnalysis);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Name *</label>
          <input
            type="text"
            {...formik.getFieldProps('name')}
            className={`w-full text-sm border rounded px-2 py-1 ${
              formik.touched.name && formik.errors.name ? 'border-destructive' : ''
            }`}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-xs text-destructive mt-1">{formik.errors.name}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category *</label>
          <input
            type="text"
            {...formik.getFieldProps('category')}
            className={`w-full text-sm border rounded px-2 py-1 ${
              formik.touched.category && formik.errors.category ? 'border-destructive' : ''
            }`}
          />
          {formik.touched.category && formik.errors.category && (
            <p className="text-xs text-destructive mt-1">{formik.errors.category}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Primary Color *</label>
          <input
            type="text"
            {...formik.getFieldProps('primary_color')}
            className={`w-full text-sm border rounded px-2 py-1 ${
              formik.touched.primary_color && formik.errors.primary_color ? 'border-destructive' : ''
            }`}
          />
          {formik.touched.primary_color && formik.errors.primary_color && (
            <p className="text-xs text-destructive mt-1">{formik.errors.primary_color}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Brand</label>
          <input
            type="text"
            {...formik.getFieldProps('brand')}
            className="w-full text-sm border rounded px-2 py-1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Subcategory</label>
          <input
            type="text"
            {...formik.getFieldProps('subcategory')}
            className="w-full text-sm border rounded px-2 py-1"
            placeholder="e.g., t-shirt, jeans"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Fit</label>
          <select
            {...formik.getFieldProps('fit')}
            className="w-full text-sm border rounded px-2 py-1"
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
      
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Style Tags</label>
        <input
          type="text"
          {...formik.getFieldProps('style_tags')}
          className="w-full text-sm border rounded px-2 py-1"
          placeholder="casual, formal, vintage (comma separated)"
        />
      </div>

      <div className="flex gap-2 mt-6">
        <Button 
          type="submit" 
          size="sm" 
          className="flex-1"
          disabled={!formik.isValid || formik.isSubmitting}
        >
          Save Changes
        </Button>
        <Dialog.Close asChild>
          <Button type="button" variant="outline" size="sm" className="flex-1">
            Cancel
          </Button>
        </Dialog.Close>
      </div>
    </form>
  );
}