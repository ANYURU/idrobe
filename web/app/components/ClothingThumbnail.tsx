import { useSignedUrl } from '@/hooks/useSignedUrl';

interface ClothingThumbnailProps {
  filePath: string | null;
  alt: string;
  className?: string;
}

export function ClothingThumbnail({ filePath, alt, className }: ClothingThumbnailProps) {
  const { url, isLoading, error } = useSignedUrl(filePath);

  if (!filePath || filePath.includes('undefined') || filePath.startsWith('http')) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 bg-slate-300 rounded"></div>
      </div>
    );
  }

  if (isLoading || !url) {
    return <div className={`bg-slate-200 animate-pulse ${className}`} />;
  }

  if (error) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 bg-slate-300 rounded"></div>
      </div>
    );
  }

  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}