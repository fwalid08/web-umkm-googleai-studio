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

  it("array record tanpa loop tidak jadi [object Object]", () => {
    const out = renderVariantHtml("{{items}}", {
      items: [{ name: "Cuci Kering", price: "Rp 8rb" }],
    });
    expect(out).not.toContain("[object Object]");
  });
});

describe("renderVariantHtml kondisional {{#if}}", () => {
  it("tampil bila truthy, hilang bila falsy/missing", () => {
    const html = 'A{{#if showPowered}}<a href="{{poweredUrl}}">{{poweredText}}</a>{{/if}}B';
    expect(
      renderVariantHtml(html, { showPowered: true, poweredUrl: "https://x.id", poweredText: "Powered" }),
    ).toBe('A<a href="https://x.id">Powered</a>B');
    expect(renderVariantHtml(html, { showPowered: false })).toBe("AB");
    expect(renderVariantHtml(html, {})).toBe("AB");
  });

  it("mendukung angka/string/array + loop di dalamnya", () => {
    expect(renderVariantHtml("{{#if n}}x{{/if}}", { n: 1 })).toBe("x");
    expect(renderVariantHtml("{{#if n}}x{{/if}}", { n: 0 })).toBe("");
    expect(renderVariantHtml("{{#if s}}x{{/if}}", { s: "ya" })).toBe("x");
    expect(renderVariantHtml("{{#if s}}x{{/if}}", { s: "" })).toBe("");
    const out = renderVariantHtml("{{#if show}}{{#items}}<b>{{name}}</b>{{/items}}{{/if}}", {
      show: true,
      items: [{ name: "A" }, { name: "B" }],
    });
    expect(out).toBe("<b>A</b><b>B</b>");
    expect(
      renderVariantHtml("{{#if show}}{{#items}}<b>{{name}}</b>{{/items}}{{/if}}", {
        show: false,
        items: [{ name: "A" }],
      }),
    ).toBe("");
  });
});

describe("renderVariantHtml loop {{#items}}", () => {
  it("mengulang blok per item record", () => {
    const html = "{{#items}}<div><h3>{{name}}</h3><p>{{price}}</p></div>{{/items}}";
    const out = renderVariantHtml(html, {
      items: [
        { name: "Cuci Kering", price: "Rp 8rb" },
        { name: "Setrika", price: "Rp 5rb" },
      ],
    });
    expect(out).not.toContain("[object Object]");
    expect(out).toContain("<h3>Cuci Kering</h3>");
    expect(out).toContain("<p>Rp 5rb</p>");
  });

  it("item jatuh kembali ke config induk bila key tak ada di item", () => {
    const out = renderVariantHtml("{{#items}}<a>{{cta_text}}: {{name}}</a>{{/items}}", {
      cta_text: "Pesan",
      items: [{ name: "Express" }],
    });
    expect(out).toContain("Pesan: Express");
  });

  it("elemen primitif lewat {{.}}; array kosong/non-array jadi string kosong", () => {
    expect(
      renderVariantHtml("{{#images}}<img src=\"{{.}}\">{{/images}}", { images: ["a.jpg", "b.jpg"] }),
    ).toBe('<img src="a.jpg"><img src="b.jpg">');
    expect(renderVariantHtml("{{#items}}x{{/items}}", { items: [] })).toBe("");
    expect(renderVariantHtml("{{#items}}x{{/items}}", {})).toBe("");
  });

  it("nilai item di-escape (XSS aman)", () => {
    const out = renderVariantHtml("{{#items}}<p>{{name}}</p>{{/items}}", {
      items: [{ name: '<img src=x onerror=1>' }],
    });
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });
});
