/**
 * Hook loading a Freebox image through the request queue.
 * @module hooks/useFreeboxImage
 */

import { useEffect, useState } from 'react';
import { loadImage } from '@/api/imageLoader';

const NOT_LOADED = Object.freeze({ src: null, failed: false });

/**
 * Load a Freebox image (`/api/latest/tv/img/…`) and return its blob URL.
 * Render the image only once `src` is set: until then, and after a
 * definitive failure, the caller shows an empty slot rather than a broken
 * icon. Unmounting or changing the URL cancels the pending load.
 * @param {string|null} url - Image URL, or null to load nothing
 * @returns {{ src: string|null, failed: boolean }} Blob URL once loaded, and whether loading gave up
 */
const useFreeboxImage = (url) => {
  const [state, setState] = useState({ url: null, ...NOT_LOADED });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const src = await loadImage(url, { signal: controller.signal });
        setState({ url, src, failed: false });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setState({ url, src: null, failed: true });
        }
      }
    };
    if (url) {
      load();
    }
    return () => controller.abort();
  }, [url]);

  // A result left over from a previous URL does not belong to this one.
  if (!url || state.url !== url) {
    return NOT_LOADED;
  }
  return { src: state.src, failed: state.failed };
};

export default useFreeboxImage;
