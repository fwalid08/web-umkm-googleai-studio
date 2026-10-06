import { describe, expect, it } from "vitest";
import { chromeRendererStyle } from "./variant-html-renderer";

describe("chromeRendererStyle (anti-regresi header overlay hilang)", () => {
  it("default (clip aktif): sections tetap ter-clip seperti dulu", () => {
    const s = chromeRendererStyle(true);
    expect(s.overflow).toBe("clip");
    expect(s.contain).toContain("paint");
    expect(s.position).toBe("relative");
    expect(s.isolation).toBe("isolate");
  });

  it("chrome overlay (clip mati): tanpa overflow clip & tanpa paint containment", () => {
    const s = chromeRendererStyle(false);
    // Kunci regresi: varian header ber-root position:absolute (pembungkus
    // tinggi nol) TIDAK boleh terpotong — inilah yang membuat hdr-hero
    // "tidak muncul" tanpa error di kanvas, preview, dan live site.
    expect(s).not.toHaveProperty("overflow");
    expect(String(s.contain)).not.toContain("paint");
    // Konteks posisi + isolasi stacking tetap dijaga
    expect(s.position).toBe("relative");
    expect(s.isolation).toBe("isolate");
  });

  it("tidak ada mode sticky di sini: sticky wajib di pembungkus berinduk tinggi", () => {
    // Regresi ganda: `position:sticky` baik di dalam HTML varian maupun di
    // pembungkus renderer ini SAMA-SAMA terjebak (induk setinggi header).
    // Sticky dipasang di `.tpl-header-html` (live, induk = root halaman)
    // dan slot header kanvas (induk = #tpl-canvas). Fungsi ini tidak boleh
    // punya parameter sticky agar pola salah tidak terulang.
    expect(chromeRendererStyle.length).toBe(1);
    expect(chromeRendererStyle(true).position).toBe("relative");
    expect(chromeRendererStyle(false).position).toBe("relative");
  });
});
