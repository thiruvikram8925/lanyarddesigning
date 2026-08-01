import { useEffect, useState } from 'react';

export function useCanvasImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const nextImage = new window.Image();
    nextImage.crossOrigin = 'anonymous';
    nextImage.onload = () => setImage(nextImage);
    nextImage.src = src;

    return () => setImage(null);
  }, [src]);

  return image;
}