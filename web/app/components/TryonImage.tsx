import { use, memo } from "react";
import { supabase } from "../lib/supabase.client";

interface TryonImageProps {
  imageUrlPromise: Promise<string>;
  alt: string;
  className?: string;
}

export const TryonImage = memo(function TryonImage({
  imageUrlPromise,
  alt,
  className = "",
}: TryonImageProps) {
  const signedUrl = use(imageUrlPromise);

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
});

const tryonImageUrlCache = new Map<string, Promise<string>>();

export function getTryonImageUrl(filePath: string): Promise<string> {
  if (!filePath) {
    return Promise.reject(new Error("No file path provided"));
  }
  if (!tryonImageUrlCache.has(filePath)) {
    tryonImageUrlCache.set(
      filePath,
      supabase.storage
        .from("tryon")
        .createSignedUrl(filePath, 3600)
        .then((result) => {
          if (result.error) throw new Error(result.error.message);
          return result.data.signedUrl;
        })
    );
  }
  return tryonImageUrlCache.get(filePath)!;
}