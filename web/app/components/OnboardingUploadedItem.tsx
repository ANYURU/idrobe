import { useState, useEffect, useImperativeHandle, useRef } from "react";
import { useFetcher } from "react-router";
import { X, Eye, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
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

export function OnboardingUploadedItem({ file, index, onRemove, onAnalysisChange, ref }: Props) {
  const fetcher = useFetcher();
  const toast = useToast();
  const hasShownToastRef = useRef(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    const formData = new FormData();
    formData.append("image", file);
    fetcher.submit(formData, {
      method: "POST",
      action: "/wardrobe/analyze",
      encType: "multipart/form-data",
    });
  }, []);

  const analysis = editedAnalysis || 
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
        toast.success(`${fetcher.data.name} analyzed`);
      }
      hasShownToastRef.current = true;
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (analysis && !hasNotified && onAnalysisChange) {
      onAnalysisChange(index, true);
      setHasNotified(true);
    }
  }, [!!analysis]);

  useImperativeHandle(ref, () => ({ getAnalysis: () => analysis }), [analysis]);

  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
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
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Analyzing...</span>
              </div>
            </>
          ) : hasFailed ? (
            <>
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-destructive mt-1">Analysis failed - Try again</p>
            </>
          ) : null}
        </div>

        {analysis && (
          <div className="flex gap-1">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Eye className="h-3 w-3" />
                </Button>
              </Dialog.Trigger>
              <ViewModal file={file} analysis={analysis} />
            </Dialog.Root>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </Dialog.Trigger>
              <EditModal file={file} analysis={analysis} onSave={setEditedAnalysis} />
            </Dialog.Root>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewModal({ file, analysis }: { file: File; analysis: Analysis }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 max-w-md w-full border border-border shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <Dialog.Title className="font-semibold">{analysis.name}</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-1">Quick Preview</p>
          </div>
          <Dialog.Close asChild>
            <button className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
              <p className="text-sm">{analysis.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Color</p>
              <p className="text-sm">{analysis.primary_color}</p>
            </div>
          </div>

          {analysis.style_tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Style</p>
              <div className="flex gap-1 flex-wrap">
                {analysis.style_tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">AI Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${analysis.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Dialog.Close asChild>
            <Button size="sm" className="w-full cursor-pointer">Close</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function EditModal({ file, analysis, onSave }: {
  file: File;
  analysis: Analysis;
  onSave: (analysis: Analysis) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(analysis.name);
  const [category, setCategory] = useState(analysis.category);
  const [color, setColor] = useState(analysis.primary_color);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 max-w-md w-full border border-border shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <Dialog.Title className="font-semibold">Quick Edit</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-1">Fix any mistakes</p>
          </div>
          <Dialog.Close asChild>
            <button className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-background"
              placeholder="e.g., Blue Denim Jacket"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-background"
              placeholder="e.g., Jacket"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-background"
              placeholder="e.g., Blue"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Dialog.Close asChild>
            <Button 
              size="sm" 
              onClick={() => {
                onSave({ ...analysis, name, category, primary_color: color });
                toast.success("Changes saved");
              }} 
              className="flex-1 cursor-pointer"
            >
              Save
            </Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button variant="outline" size="sm" className="flex-1 cursor-pointer">Cancel</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
