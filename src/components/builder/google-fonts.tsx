'use client';

import { useEffect } from 'react';
import { getGoogleFontsUrl } from '@/lib/builder/font-categories';

/**
 * Memuat font Google Fonts yang dipakai kanvas builder secara dinamis.
 * Hanya menyuntik satu <link> per kombinasi font yang unik.
 */
export function GoogleFonts({ fonts }: { fonts: Array<string | undefined | null> }) {
  const key = [...new Set((fonts ?? []).map((f) => (f ?? '').trim()).filter(Boolean))].sort().join('|');

  useEffect(() => {
    if (!key) return;
    const families = key.split('|');
    const href = getGoogleFontsUrl(families);
    if (document.querySelector(`link[data-gfonts="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-gfonts', href);
    document.head.appendChild(link);
  }, [key]);

  return null;
}
