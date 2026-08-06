import { useState, useEffect } from 'react';

export const useCanvasImage = (url?: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }

    let isMounted = true;
    const img = new window.Image();
    
    // Only set crossOrigin for external http(s) URLs (not blob:, data:, or relative paths)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      if (isMounted) setImage(img);
    };
    img.onerror = () => {
      if (isMounted) setImage(undefined);
    };
    img.src = url;

    return () => {
      isMounted = false;
    };
  }, [url]);

  return image;
};
