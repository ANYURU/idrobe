import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActionWithToast } from "@/hooks/use-action-with-toast";
import { ImageEditor } from "./ImageEditor";

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in MB
  bucket?: string;
  className?: string;
  disabled?: boolean;
  cropShape?: 'rectangle' | 'circle';
}

export function PhotoUpload({
  onUpload,
  onError,
  maxSize = 5,
  bucket = "clothing",
  className,
  disabled = false,
  cropShape = 'rectangle',
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, isSubmitting, data, error } = useActionWithToast<{ url: string }>('/api/upload-photo');

  useEffect(() => {
    if (data?.url) {
      onUpload(data.url);
      setPreview(null);
    }
  }, [data, onUpload]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select an image file";
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    submit(formData);
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      onError?.(error);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setShowEditor(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const handleEditSave = (editedFile: File) => {
    setSelectedFile(editedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(editedFile);
    setShowEditor(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
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
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowEditor(true)}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragging ? "Drop your photo here" : "Upload a photo"}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select • Max {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showEditor && preview && (
        <ImageEditor
          imageSrc={preview}
          onSave={handleEditSave}
          onCancel={() => setShowEditor(false)}
          cropShape={cropShape}
        />
      )}
    </div>
  );
}