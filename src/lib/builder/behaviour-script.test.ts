import { describe, expect, it } from "vitest";
import { renderNavItems, renderVariantHtml } from "@/lib/builder/behaviour-script";

const NAV = [
  { id: "n1", label: "Beranda", url: "#beranda", enabled: true },
  { id: "n2", label: "Harga", url: "#harga", enabled: true },
];

describe("renderNavItems", () => {
  it("me-render deretan link (bukan [object Object])", () => {
    const out = renderNavItems(NAV);
    expect(out).not.toContain("[object Object]");
    expect(out).toContain('<a href="#beranda">Beranda</a>');
    expect(out).toContain('<a href="#harga">Harga</a>');
  });

  it("melewati item enabled:false, tanpa flag dianggap aktif", () => {
    const out = renderNavItems([
      { label: "A", url: "#a", enabled: false },
      { label: "B", url: "#b" },
    ]);
    expect(out).not.toContain(">A<");
    expect(out).toContain(">B<");
  });

  it("menolak protokol berbahaya + escape HTML", () => {
    const out = renderNavItems([
      { label: '<img src=x onerror=1>', url: "javascript:alert(1)" },
    ]);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("&lt;img");
  });

  it("isExternal membuka tab baru; non-array → string kosong", () => {
    expect(renderNavItems([{ label: "W", url: "https://wa.me/1", isExternal: true }])).toContain(
      'target="_blank"',
    );
    expect(renderNavItems("bukan-array")).toBe("");
    expect(renderNavItems([])).toBe("");
  });
});

describe("renderVariantHtml + navItems (kasus kilau laundry)", () => {
  it("tidak lagi menghasilkan [object Object]", () => {
    const html = '<nav class="lx-nav">{{navItems}}</nav>';
    const out = renderVariantHtml(html, {
      navItems: NAV,
      siteTitle: "Kilau Laundry",
    });
    expect(out).not.toContain("[object Object]");
    expect(out).toContain('<nav class="lx-nav">');
    expect(out).toContain("Beranda");
  });

  it("triple-brace juga diekspan", () => {
    const out = renderVariantHtml("{{{navItems}}}", { navItems: NAV });
    expect(out).toContain('<a href="#beranda">Beranda</a>');
  });

  it("array non-link tetap perilaku lama", () => {
    const out = renderVariantHtml("{{tags}}", { tags: ["a", "b"] });
    expect(out).toBe("a,b");
  });
});
