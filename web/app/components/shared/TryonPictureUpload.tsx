import { useState, useRef, useEffect } from "react";
import { Camera, Edit, X, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFetcher, useRevalidator } from "react-router";
import { useToast } from "@/lib/use-toast";
import { ImageEditor } from "./ImageEditor";
import { TryonImageCard } from "../TryonImageCard";

interface TryonPictureUploadProps {
  currentImageUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TryonPictureUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  onError,
  className,
  disabled = false,
}: TryonPictureUploadProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    confidence: number;
    criteria: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFetcherDataRef = useRef<any>(null);
  const lastValidationDataRef = useRef<any>(null);
  const fetcher = useFetcher<any>();
  const validationFetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const { error: showError, success: showSuccess } = useToast();
  const isSubmitting = fetcher.state === "submitting";

  // Handle upload/delete response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      // Prevent duplicate processing
      if (lastFetcherDataRef.current === fetcher.data) {
        return;
      }
      lastFetcherDataRef.current = fetcher.data;
      
      if (fetcher.data.success) {
        showSuccess(fetcher.data.message || "Operation completed successfully");
        
        if (fetcher.data.data?.url) {
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          setValidationStatus(null);
          onUpload(fetcher.data.data.url);
        } else {
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          setValidationStatus(null);
          onRemove?.();
          revalidator.revalidate();
        }
      } else if (fetcher.data.error) {
        showError(fetcher.data.error);
        onError?.(fetcher.data.error);
      }
    }
  }, [fetcher.state, fetcher.data, onUpload, onRemove, onError, showSuccess, showError, revalidator]);

  // Handle validation response - NO TOASTS, UI shows feedback
  useEffect(() => {
    if (validationFetcher.state === "idle" && validationFetcher.data) {
      // Prevent duplicate processing
      if (lastValidationDataRef.current === validationFetcher.data) {
        return;
      }
      lastValidationDataRef.current = validationFetcher.data;
      
      setIsValidating(false);
      
      if (validationFetcher.data.error) {
        // Only show toast for actual API errors, not validation failures
        showError(validationFetcher.data.error);
        onError?.(validationFetcher.data.error);
        setValidationStatus(null);
      } else {
        // Don't show any toast - the UI checklist shows all the feedback
        setValidationStatus(validationFetcher.data);
      }
    }
  }, [validationFetcher.state, validationFetcher.data, showError, onError]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select an image file";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      onError?.(error);
      return;
    }

    setOriginalFile(file);
    setValidationStatus(null); // Reset validation when new file is selected
    lastValidationDataRef.current = null; // Allow new validation to be processed
    lastFetcherDataRef.current = null; // Reset upload tracking for new file
    
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setOriginalImage(reader.result as string);
        
        // Start validation immediately after file is loaded
        setIsValidating(true);
        const formData = new FormData();
        formData.append("image", file);
        validationFetcher.submit(formData, {
          method: "POST",
          action: "/api/validate-tryon-image",
          encType: "multipart/form-data",
        });
      }
    };
    reader.onerror = () => {
      onError?.("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = (editedFile: File) => {
    setOriginalFile(editedFile);

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setEditedImage(reader.result as string);
      }
    };
    reader.onerror = () => {
      onError?.("Failed to process edited image");
    };
    reader.readAsDataURL(editedFile);

    setShowEditor(false);
  };

  const handleUpload = () => {
    if (!originalFile) {
      onError?.("No file selected for upload");
      return;
    }

    // Check if validation passed
    if (!validationStatus?.valid) {
      onError?.("Please upload a valid try-on image that meets all requirements");
      return;
    }

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("bucket", "tryon");

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/upload-photo",
      encType: "multipart/form-data",
    });
  };

  const handleRemove = () => {
    if (currentImageUrl && !originalImage && !editedImage) {
      // Remove existing tryon image via API
      fetcher.submit({}, {
        method: 'post',
        action: '/api/remove-tryon'
      });
    } else {
      // Just clear local state for new uploads
      setOriginalImage(null);
      setEditedImage(null);
      setOriginalFile(null);
      setValidationStatus(null);
      lastValidationDataRef.current = null; // Reset to prevent stale toasts
    }
  };

  const displayImage = editedImage || originalImage;
  const hasImage = !!displayImage || !!currentImageUrl;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isSubmitting}
      />

      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="flex flex-col lg:flex-row items-start lg:items-start gap-4 w-full lg:w-auto">
          {/* Image Upload Section */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "relative w-48 h-72 bg-muted rounded-lg flex items-center justify-center overflow-hidden group",
                disabled || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : hasImage ? "cursor-default" : "cursor-pointer"
              )}
              onClick={() =>
                !disabled &&
                !isSubmitting &&
                !hasImage &&
                fileInputRef.current?.click()
              }
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Try-on"
                  className="w-full h-full object-cover"
                />
              ) : currentImageUrl ? (
                <TryonImageCard
                  filePath={currentImageUrl}
                  alt="Try-on"
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full"
                />
              ) : (
                <Camera className="w-16 h-16 text-muted-foreground" />
              )}

              {(hasImage || currentImageUrl) && !disabled && !isSubmitting && (
                <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/40 transition-colors duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    {displayImage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20 border-0 shadow-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditor(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20 border-0 shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20 border-0 shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {originalImage ? (
              <Button
                onClick={handleUpload}
                disabled={isSubmitting || isValidating || !validationStatus?.valid}
                className="w-48"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : isValidating ? "Validating..." : "Save"}
              </Button>
            ) : (
              !currentImageUrl && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isSubmitting}
                  className="w-48"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              )
            )}
          </div>

          {/* Validation Feedback Section */}
          <div className="flex flex-col gap-3 lg:flex-1 lg:max-w-xs">
            {originalImage && isValidating && (
              <div className="w-48 lg:w-full p-3 bg-muted rounded-lg border border-border animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent" />
                  <p className="text-xs font-medium">Checking image...</p>
                </div>
              </div>
            )}

            {originalImage && validationStatus && validationStatus.criteria.length > 0 && (() => {
              const passedCount = validationStatus.criteria.filter(c => c.passed).length;
              const totalCount = validationStatus.criteria.length;
              const progressPercentage = (passedCount / totalCount) * 100;
              
              return (
                <div className={cn(
                  "w-48 lg:w-full p-3 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-500",
                  validationStatus.valid 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted border-border"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {validationStatus.valid ? (
                        <>
                          <span className="text-primary text-base animate-in zoom-in duration-300">✓</span>
                          <p className="text-xs font-medium text-primary">All requirements met</p>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground text-base">○</span>
                          <p className="text-xs font-medium">Validation results</p>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {passedCount}/{totalCount}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-muted-foreground/10 rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        validationStatus.valid ? "bg-primary" : "bg-primary/60"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {validationStatus.criteria.map((criterion, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-1.5 animate-in fade-in slide-in-from-left-1 duration-300"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <span className={cn(
                          "text-xs mt-0.5 flex-shrink-0 transition-colors duration-200",
                          criterion.passed ? "text-primary" : "text-muted-foreground"
                        )}>
                          {criterion.passed ? "✓" : "✗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-xs transition-colors duration-200",
                            criterion.passed 
                              ? "text-foreground" 
                              : "text-muted-foreground"
                          )}>
                            {criterion.name}
                          </span>
                          {criterion.message && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              - {criterion.message}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {showEditor && originalImage && (
        <ImageEditor
          imageSrc={originalImage}
          onSave={handleEditSave}
          onCancel={() => setShowEditor(false)}
          cropShape="rectangle"
        />
      )}
    </>
  );
}