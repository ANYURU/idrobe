import { useState, useCallback, useEffect } from "react";
import { useActionWithToast } from "@/hooks/use-action-with-toast";

interface UsePhotoUploadOptions {
  bucket?: string;
  maxSize?: number; // in MB
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function usePhotoUpload({
  bucket = "clothing",
  maxSize = 5,
  onSuccess,
  onError,
}: UsePhotoUploadOptions = {}) {
  const [progress, setProgress] = useState(0);
  const { submit, isSubmitting, data, error } = useActionWithToast<{ url: string }>('/api/upload-photo');

  useEffect(() => {
    if (data?.url) {
      onSuccess?.(data.url);
      setProgress(0);
    }
  }, [data, onSuccess]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const uploadPhoto = useCallback((file: File): void => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file");
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File size must be less than ${maxSize}MB`);
      return;
    }

    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    submit(formData);
  }, [bucket, maxSize, onError, submit]);

  const deletePhoto = useCallback((url: string): void => {
    // TODO: Implement delete endpoint if needed
    console.log('Delete photo:', url);
  }, []);

  return {
    uploadPhoto,
    deletePhoto,
    isUploading: isSubmitting,
    progress,
  };
}