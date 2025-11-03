'use client';

import { useEffect } from 'react';

export default function ClientPolyfills() {
  useEffect(() => {
    const tasks: Promise<unknown>[] = [];

    if (!('animate' in Element.prototype)) {
      tasks.push(import('web-animations-js'));
    }

    if (typeof window !== 'undefined' && !('requestAnimationFrame' in window)) {
      tasks.push(import('raf/polyfill'));
    }

    if (!('IntersectionObserver' in window)) {
      tasks.push(import('intersection-observer'));
    }

    tasks.push(import('preline/dist/index.js'));

    Promise.all(tasks).catch(() => {});
  }, []);

  return null;
}
