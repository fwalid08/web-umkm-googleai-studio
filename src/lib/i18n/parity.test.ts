import { describe, expect, it } from "vitest";
import { id } from "./id";
import { en } from "./en";

function keys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k)
  );
}

describe("i18n parity", () => {
  it("en punya kunci 1:1 dengan id", () => {
    const a = keys(id).sort();
    const b = keys(en).sort();
    expect(b).toEqual(a);
  });
});
