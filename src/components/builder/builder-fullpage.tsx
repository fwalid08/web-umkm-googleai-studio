"use client";

import { createContext, useContext } from "react";

/**
 * Mode tampilan builder: menempel di halaman dashboard, atau melebar penuh.
 *
 * `DashboardShell` adalah pemilik chrome dashboard (sidebar + header), sedangkan
 * tombol expand berada di dalam `BuilderTopbar` yang jauh di bawahnya. Tanpa
 * konteks bersama, status "sudah full-page atau belum" harus di-drill lewat
 * prop dari layout → page → BuilderShell → BuilderTopbar, padahal hanya ada
 * satu pemakai dan hanya satu sumber kebenaran.
 *
 * `available` = false di luar halaman builder (mis. preview satin), sehingga
 * tombol expand bisa disembunyikan, bukan sekadar dinonaktifkan.
 */
export interface BuilderFullPageValue {
  /** True saat builder memakai seluruh viewport (chrome dashboard disembunyikan). */
  fullPage: boolean;
  /** Ubah mode. Default-nya no-op supaya hook aman di luar provider. */
  setFullPage: (value: boolean) => void;
  toggle: () => void;
  /** Apakah fitur ini tersedia (hanya di halaman editor). */
  available: boolean;
}

export const BuilderFullPageContext = createContext<BuilderFullPageValue>({
  fullPage: false,
  setFullPage: () => {},
  toggle: () => {},
  available: false,
});

export function useBuilderFullPage(): BuilderFullPageValue {
  return useContext(BuilderFullPageContext);
}