import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BUILT_IN_CATALOG } from "./templates/catalog";
import { buildPreviewSiteData } from "./preview-data";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";

describe("buildPreviewSiteData (sumber tunggal pratinjau modal + /preview)", () => {
  it("setiap template katalog menghasilkan site lengkap", () => {
    expect(BUILT_IN_CATALOG.length).toBeGreaterThan(0);
    for (const t of BUILT_IN_CATALOG) {
      const site = buildPreviewSiteData(t);
      expect(site.headerVariantId, `${t.id}: headerVariantId`).toBeTruthy();
      expect(site.footerVariantId, `${t.id}: footerVariantId`).toBeTruthy();
      expect(site.sections.length, `${t.id}: sections kosong`).toBeGreaterThan(0);
      for (const s of site.sections) {
        expect(s.variantId, `${t.id}/${s.type}: variantId`).toBeTruthy();
      }
    }
  });

  it("hasilnya me-render tanpa crash (jalur modal galeri)", () => {
    for (const t of BUILT_IN_CATALOG) {
      const html = renderToStaticMarkup(
        createElement(PublicWebsiteV3, { site: buildPreviewSiteData(t) }),
      );
      expect(html.length, `${t.id}: render pratinjau kosong`).toBeGreaterThan(1000);
    }
  });
});
