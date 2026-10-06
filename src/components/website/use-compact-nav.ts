'use client';

import { useEffect, useState } from 'react';

/**
 * Lebar container < 640px → mode compact (nav desktop → hamburger).
 *
 * Dipakai chrome header di LIVE SITE. Kanvas builder tidak memakai hook ini —
 * ia membaca `viewportWidth` dari `useBuilderStore` secara langsung.
 * `matchMedia` dipilih agar mengikuti lebar viewport nyata, dengan aman
 * untuk SSR (default `false` = desktop saat render server).
 */
export function useCompactNav(breakpoint = 640): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [breakpoint]);

  return compact;
}

/**
 * Halaman sudah di-scroll melewati ambang → header `hero-overlay` jadi solid.
 * Cerminan `handleScroll` di `builder-canvas.tsx` (ambang 50px) agar live = kanvas.
 */
export function useNavSolid(threshold = 50): boolean {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setSolid(window.scrollY > threshold);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, [threshold]);

  return solid;
}
