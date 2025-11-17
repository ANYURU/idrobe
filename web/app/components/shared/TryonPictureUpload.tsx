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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedDataRef = useRef<any>(null);
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const { error: showError, success: showSuccess } = useToast();
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data && fetcher.data !== lastProcessedDataRef.current) {
      lastProcessedDataRef.current = fetcher.data;
      
      if (fetcher.data.success) {
        showSuccess(fetcher.data.message || "Operation completed successfully");
        
        if (fetcher.data.data?.url) {
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          onUpload(fetcher.data.data.url);
        } else {
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          onRemove?.();
          // Revalidate to refresh profile data after deletion
          revalidator.revalidate();
        }
      } else if (fetcher.data.error) {
        showError(fetcher.data.error);
        onError?.(fetcher.data.error);
      }
    }
  }, [fetcher.data, onUpload, onRemove, onError, showSuccess, showError]);

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
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setOriginalImage(reader.result as string);
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
            disabled={isSubmitting}
            className="w-48"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save"}
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