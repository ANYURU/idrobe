import { Suspense, useMemo } from "react";
import { TryonImage, getTryonImageUrl } from "./TryonImage";

interface TryonImageCardProps {
  filePath: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function TryonImageCard({
  filePath,
  alt,
  className = "",
  fallbackClassName = "",
}: TryonImageCardProps) {
  if (!filePath) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={`bg-muted animate-pulse ${fallbackClassName || className}`} />}>
      <TryonImageLoader filePath={filePath} alt={alt} className={className} />
    </Suspense>
  );
}

function TryonImageLoader({
  filePath,
  alt,
  className,
}: {
  filePath: string;
  alt: string;
  className: string;
}) {
  const imageUrlPromise = useMemo(() => getTryonImageUrl(filePath), [filePath]);

  return <TryonImage imageUrlPromise={imageUrlPromise} alt={alt} className={className} />;
}