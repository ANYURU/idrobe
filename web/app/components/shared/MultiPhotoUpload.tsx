import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  url?: string;
  isUploading: boolean;
  error?: string;
}

interface MultiPhotoUploadProps {
  onUpload: (urls: string[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number;
  bucket?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiPhotoUpload({
  onUpload,
  onError,
  maxFiles = 5,
  maxSize = 5,
  bucket = "clothing-images",
  className,
  disabled = false,
}: MultiPhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadPhoto } = usePhotoUpload({
    bucket,
    maxSize,
    onError,
  });

  const addPhotos = useCallback((files: FileList) => {
    const newPhotos: PhotoItem[] = [];
    
    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxFiles; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      
      const id = `${Date.now()}-${i}`;
      const reader = new FileReader();
      
      reader.onload = () => {
        const photoItem: PhotoItem = {
          id,
          file,
          preview: reader.result as string,
          isUploading: false,
        };
        
        setPhotos(prev => [...prev, photoItem]);
      };
      
      reader.readAsDataURL(file);
    }
  }, [photos.length, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    addPhotos(e.dataTransfer.files);
  }, [addPhotos, disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addPhotos(e.target.files);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const uploadSingle = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, isUploading: true, error: undefined } : p
    ));

    const url = await uploadPhoto(photo.file);
    
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, isUploading: false, url, error: url ? undefined : "Upload failed" } : p
    ));
  };

  const uploadAll = async () => {
    const pendingPhotos = photos.filter(p => !p.url && !p.isUploading);
    
    await Promise.all(
      pendingPhotos.map(photo => uploadSingle(photo.id))
    );

    const uploadedUrls = photos
      .filter(p => p.url)
      .map(p => p.url!);
    
    if (uploadedUrls.length > 0) {
      onUpload(uploadedUrls);
    }
  };

  const canAddMore = photos.length < maxFiles;
  const hasPhotos = photos.length > 0;
  const allUploaded = photos.every(p => p.url);
  const isUploading = photos.some(p => p.isUploading);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
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
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <Plus className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isDragging ? "Drop photos here" : "Add photos"}
              </p>
              <p className="text-sm text-muted-foreground">
                {photos.length}/{maxFiles} • Max {maxSize}MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {hasPhotos && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Loading Overlay */}
                {photo.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                
                {/* Success Indicator */}
                {photo.url && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Error Indicator */}
                {photo.error && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1">
                    <X className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              {/* Remove Button */}
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(photo.id)}
                disabled={photo.isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {hasPhotos && !allUploaded && (
        <Button
          onClick={uploadAll}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${photos.filter(p => !p.url).length} Photos`
          )}
        </Button>
      )}
    </div>
  );
}