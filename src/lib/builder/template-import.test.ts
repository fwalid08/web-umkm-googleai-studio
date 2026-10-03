import { describe, expect, it } from "vitest";
import { strToU8 } from "fflate";
import {
  ANIMATIONS_META_PATH,
  collectAnimationsFromZip,
  mergeAnimations,
  parseAnimationsMetaFile,
} from "@/lib/builder/template-import";

const enc = (s: string) => strToU8(s);

describe("parseAnimationsMetaFile", () => {
  it("membaca array dan objek tunggal", () => {
    expect(parseAnimationsMetaFile(enc('[{"id":"a"}]'))).toEqual([{ id: "a" }]);
    expect(parseAnimationsMetaFile(enc('{"id":"b"}'))).toEqual([{ id: "b" }]);
  });

  it("toleran: rusak, kosong, kebesaran, atau non-objek → []", () => {
    expect(parseAnimationsMetaFile(enc("bukan json"))).toEqual([]);
    expect(parseAnimationsMetaFile(enc(""))).toEqual([]);
    expect(parseAnimationsMetaFile(enc("123"))).toEqual([]);
    expect(parseAnimationsMetaFile(enc('"str"'))).toEqual([]);
    expect(parseAnimationsMetaFile(new Uint8Array(200_001))).toEqual([]);
  });
});

describe("collectAnimationsFromZip", () => {
  it("hanya membaca tepat animations/meta.json", () => {
    const entries: Array<[string, Uint8Array]> = [
      ["template.json", enc("{}")],
      [ANIMATIONS_META_PATH, enc('[{"id":"m1"}]')],
      ["animations/other.json", enc('[{"id":"x"}]')],
      ["animations/nested/meta.json", enc('[{"id":"y"}]')],
    ];
    expect(collectAnimationsFromZip(entries)).toEqual([{ id: "m1" }]);
  });

  it("tanpa file meta → []", () => {
    expect(collectAnimationsFromZip([["template.json", enc("{}")]])).toEqual([]);
  });
});

describe("mergeAnimations", () => {
  it("inline dulu lalu folder, dibatasi total", () => {
    expect(mergeAnimations([{ id: "i" }], [{ id: "f" }], 10)).toEqual([
      { id: "i" },
      { id: "f" },
    ]);
    expect(mergeAnimations([{ id: "i" }], [{ id: "f" }], 1)).toEqual([{ id: "i" }]);
  });

  it("inline bukan array dianggap kosong", () => {
    expect(mergeAnimations("rusak", [{ id: "f" }])).toEqual([{ id: "f" }]);
    expect(mergeAnimations(undefined, [])).toEqual([]);
  });
});
