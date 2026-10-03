import { describe, expect, it } from "vitest";
import { mimeTypeForFilename } from "@/lib/storage/supabase";

describe("mimeTypeForFilename (SVG wajib didukung agar tampil)", () => {
  it("svg dipetakan ke image/svg+xml (bukan octet-stream)", () => {
    expect(mimeTypeForFilename("logo.svg")).toBe("image/svg+xml");
    expect(mimeTypeForFilename("ICON.SVG")).toBe("image/svg+xml");
    expect(mimeTypeForFilename("assets/hero/logo.svg")).toBe("image/svg+xml");
  });

  it("format gambar umum tetap benar", () => {
    expect(mimeTypeForFilename("a.jpg")).toBe("image/jpeg");
    expect(mimeTypeForFilename("a.jpeg")).toBe("image/jpeg");
    expect(mimeTypeForFilename("a.png")).toBe("image/png");
    expect(mimeTypeForFilename("a.webp")).toBe("image/webp");
    expect(mimeTypeForFilename("a.gif")).toBe("image/gif");
    expect(mimeTypeForFilename("a.avif")).toBe("image/avif");
    expect(mimeTypeForFilename("a.ico")).toBe("image/x-icon");
  });

  it("ekstensi tak dikenal fallback octet-stream", () => {
    expect(mimeTypeForFilename("arsip.zip")).toBe("application/octet-stream");
    expect(mimeTypeForFilename("tanpa-ekstensi")).toBe("application/octet-stream");
  });
});
