import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.client';

export function useImageUrl(filePath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setImageUrl(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    const generateUrl = async () => {
      try {
        // Use the imported supabase client
        const { data, error } = await supabase.storage
          .from('clothing')
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

        if (mounted && !error && data) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.log('Error generating signed URL:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    generateUrl();

    return () => {
      mounted = false;
    };
  }, [filePath]);

  return { imageUrl, loading };
}