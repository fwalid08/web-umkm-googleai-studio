import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewViewportToggle, TemplatePreviewDialog } from "./template-preview-dialog";

describe("PreviewViewportToggle (pilihan Desktop/Mobile pratinjau)", () => {
  it("menampilkan kedua tab dengan status terpilih yang benar", () => {
    const desktop = renderToStaticMarkup(
      createElement(PreviewViewportToggle, { mode: "desktop", onChange: () => {} }),
    );
    expect(desktop).toContain("Desktop");
    expect(desktop).toContain("Mobile");
    expect(desktop).toContain('aria-selected="true"');

    const mobile = renderToStaticMarkup(
      createElement(PreviewViewportToggle, { mode: "mobile", onChange: () => {} }),
    );
    // Satu tab terpilih, satu tidak.
    expect(mobile.match(/aria-selected="true"/g)?.length).toBe(1);
    expect(mobile.match(/aria-selected="false"/g)?.length).toBe(1);
  });
});

describe("TemplatePreviewDialog", () => {
  it("tanpa template tidak me-render konten situs", () => {
    // Isi Radix Dialog hanya ada saat terbuka — tanpa template tidak ada
    // render situs (hemat render situs penuh yang berat).
    const html = renderToStaticMarkup(
      createElement(TemplatePreviewDialog, { template: null, onClose: () => {} }),
    );
    expect(html).not.toContain("Desktop");
  });
});
