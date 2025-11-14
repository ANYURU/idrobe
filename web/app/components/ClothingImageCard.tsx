import { Suspense, useMemo } from "react";
import { ClothingImage, getImageUrl } from "./ClothingImage";

interface ClothingImageCardProps {
  filePath: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ClothingImageCard({
  filePath,
  alt,
  className = "",
  fallbackClassName = "",
}: ClothingImageCardProps) {
  if (!filePath) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={`bg-muted animate-pulse ${fallbackClassName || className}`} />}>
      <ClothingImageLoader filePath={filePath} alt={alt} className={className} />
    </Suspense>
  );
}

function ClothingImageLoader({
  filePath,
  alt,
  className,
}: {
  filePath: string;
  alt: string;
  className: string;
}) {
  const imageUrlPromise = useMemo(() => getImageUrl(filePath), [filePath]);

  return <ClothingImage imageUrlPromise={imageUrlPromise} alt={alt} className={className} />;
}
