import { useFetcher } from 'react-router';
import { useEffect } from 'react';

export function useSignedUrl(filePath: string | null) {
  const fetcher = useFetcher<{ signedUrl: string; error?: string }>();

  useEffect(() => {
    if (filePath && 
        filePath.trim() !== '' &&
        !filePath.includes('undefined') && 
        !filePath.includes('null') &&
        !filePath.startsWith('http') && 
        !fetcher.data?.signedUrl &&
        fetcher.state === 'idle') {
      fetcher.load(`/api/image-url?path=${encodeURIComponent(filePath)}`);
    }
  }, [filePath]);

  return {
    url: fetcher.data?.signedUrl || null,
    isLoading: fetcher.state === 'loading' && !fetcher.data?.signedUrl,
    error: fetcher.data?.error
  };
}