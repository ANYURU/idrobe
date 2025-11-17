import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

interface PhotoUploadAdvancedProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  maxSize?: number;
  bucket?: string;
  className?: string;
  disabled?: boolean;
  showProgress?: boolean;
  autoUpload?: boolean;
}

export function PhotoUploadAdvanced({
  onUpload,
  onError,
  maxSize = 5,
  bucket = "clothing-images",
  className,
  disabled = false,
  showProgress = true,
  autoUpload = false,
}: PhotoUploadAdvancedProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadPhoto, isUploading, progress } = usePhotoUpload({
    bucket,
    maxSize,
    onSuccess: onUpload,
    onError,
  });

  const handleFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    
    setSelectedFile(file);
    
    if (autoUpload) {
      await uploadPhoto(file);
      setPreview(null);
      setSelectedFile(null);
    }
  }, [uploadPhoto, autoUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, disabled, isUploading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadPhoto(selectedFile);
      clearPreview();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {preview ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={clearPreview}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  {showProgress && <p>{progress}%</p>}
                </div>
              </div>
            )}
          </div>
          
          {!autoUpload && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Photo"
              )}
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled || isUploading 
              ? "opacity-50 cursor-not-allowed" 
              : "cursor-pointer hover:border-primary/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">
                {isUploading 
                  ? "Uploading..." 
                  : isDragging 
                    ? "Drop your photo here" 
                    : "Upload a photo"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select • Max {maxSize}MB
              </p>
              {isUploading && showProgress && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}