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
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <span className="text-slate-400 text-sm">No image</span>
      </div>
    );
  }

  if (fetcher.state === 'loading' || !fetcher.data?.signedUrl) {
    return (
      <div className={`bg-slate-200 animate-pulse ${className}`} />
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