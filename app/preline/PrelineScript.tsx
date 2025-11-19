'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PrelineScript() {
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      if (!('animate' in Element.prototype)) {
        await import('web-animations-js');
      }
      if (typeof window !== 'undefined' && !('requestAnimationFrame' in window)) {
        await import('raf/polyfill');
      }
      if (!('IntersectionObserver' in window)) {
        await import('intersection-observer');
      }

      await import('preline/dist/index.js');

      queueMicrotask(() => {
        window.HSStaticMethods?.autoInit?.();
      });
    })().catch((err) => {
      console.error('[PrelineScript] gagal memuat:', err);
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      window.HSStaticMethods?.autoInit?.();
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
