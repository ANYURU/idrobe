import { useState, useRef, useEffect } from "react";
import { Camera, Edit, X, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFetcher } from "react-router";
import { useToast } from "@/lib/use-toast";
import { ImageEditor } from "./ImageEditor";

interface ImageEditSettings {
  imagePos: { x: number; y: number };
  cropSize: number | { width: number; height: number };
  rotation: number;
  brightness: number;
  contrast: number;
  zoom: number;
}

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  onError?: (error: string) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function ProfilePictureUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  onError,
  size = 128,
  className,
  disabled = false,
}: ProfilePictureUploadProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [editSettings, setEditSettings] =
    useState<Partial<ImageEditSettings> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedDataRef = useRef<{
    success?: boolean;
    error?: string;
    message?: string;
    data?: { url: string };
  } | null>(null);
  const fetcher = useFetcher<{
    success?: boolean;
    error?: string;
    message?: string;
    data?: { url: string };
  }>();
  const { error: showError, success: showSuccess } = useToast();
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data && fetcher.data !== lastProcessedDataRef.current) {
      lastProcessedDataRef.current = fetcher.data;
      
      if (fetcher.data.success) {
        showSuccess(fetcher.data.message || "Operation completed successfully");
        
        if (fetcher.data.data?.url) {
          // Upload success - clear local state first, then update parent
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          setEditSettings(null);
          onUpload(fetcher.data.data.url);
        } else {
          // Remove success - clear local state first, then update parent
          setOriginalImage(null);
          setEditedImage(null);
          setOriginalFile(null);
          setEditSettings(null);
          onRemove?.();
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
    if (file.size > 2 * 1024 * 1024) {
      return "File size must be less than 2MB";
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

  const handleEditSave = (editedFile: File, settings: ImageEditSettings) => {
    // Replace originalFile with the processed/edited file from canvas
    setOriginalFile(editedFile);
    setEditSettings(settings);

    // Update the preview to show edited result
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
    formData.append("bucket", "avatars");

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/upload-photo",
      encType: "multipart/form-data",
    });
  };

  const handleRemove = () => {
    if (currentImageUrl && !originalImage && !editedImage) {
      // Remove existing avatar via API
      fetcher.submit({}, {
        method: 'post',
        action: '/api/remove-avatar'
      });
    } else {
      // Just clear local state for new uploads
      setOriginalImage(null);
      setEditedImage(null);
      setOriginalFile(null);
      setEditSettings(null);
    }
  };

  const displayImage = currentImageUrl || editedImage || originalImage;
  const hasImage = !!displayImage;

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

      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn(
            "relative rounded-full bg-muted flex items-center justify-center overflow-hidden group",
            disabled || isSubmitting
              ? "opacity-50 cursor-not-allowed"
              : hasImage ? "cursor-default" : "cursor-pointer"
          )}
          style={{ width: size, height: size }}
          onClick={() =>
            !disabled &&
            !isSubmitting &&
            !hasImage &&
            fileInputRef.current?.click()
          }
        >
          {hasImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera
              className="text-muted-foreground"
              style={{ width: size * 0.3, height: size * 0.3 }}
            />
          )}

          {/* Hover Overlay for existing images */}
          {hasImage && !disabled && !isSubmitting && (
            <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/40 transition-colors duration-200 rounded-full flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                {(originalImage || editedImage) && (
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

          {/* Upload overlay for empty state */}
          {!hasImage && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full" />
          )}
        </div>

        {originalImage ? (
          <Button
            onClick={handleUpload}
            disabled={isSubmitting}
            className="min-w-20"
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
              className="min-w-24"
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
          cropShape="circle"
          initialSettings={editSettings || undefined}
        />
      )}
    </>
  );
}
