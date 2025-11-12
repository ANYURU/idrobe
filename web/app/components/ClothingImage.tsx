import { useFetcher } from 'react-router';
import { useEffect } from 'react';

interface ClothingImageProps {
  filePath: string | null;
  alt: string;
  className?: string;
}

export function ClothingImage({ filePath, alt, className = '' }: ClothingImageProps) {
  const fetcher = useFetcher<{ signedUrl?: string; error?: string }>();

  useEffect(() => {
    if (filePath) {
      fetcher.load(`/api/image-url?path=${encodeURIComponent(filePath)}`);
    }
  }, [filePath]);

  if (!filePath || fetcher.data?.error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  if (fetcher.state === 'loading' || !fetcher.data?.signedUrl) {
    return (
      <div className={`bg-muted animate-pulse ${className}`} />
    );
  }

  return (
    <img
      src={fetcher.data.signedUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}