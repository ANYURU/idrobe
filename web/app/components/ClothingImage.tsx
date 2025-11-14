import { use, memo } from "react";
import { supabase } from "../lib/supabase.client";

interface ClothingImageProps {
  imageUrlPromise: Promise<string>;
  alt: string;
  className?: string;
}

export const ClothingImage = memo(function ClothingImage({
  imageUrlPromise,
  alt,
  className = "",
}: ClothingImageProps) {
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

const imageUrlCache = new Map<string, Promise<string>>();

export function getImageUrl(filePath: string): Promise<string> {
  if (!imageUrlCache.has(filePath)) {
    imageUrlCache.set(
      filePath,
      supabase.storage
        .from("clothing")
        .createSignedUrl(filePath, 3600)
        .then((result) => {
          if (result.error) throw new Error(result.error.message);
          return result.data.signedUrl;
        })
    );
  }
  return imageUrlCache.get(filePath)!;
}
