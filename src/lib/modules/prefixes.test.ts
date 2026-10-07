import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isAllowedTableName,
  moduleOfTable,
  prefixFor,
  validateRegistry,
} from "./prefixes";

describe("MODULE_PREFIXES registry (§5.6)", () => {
  it("valid: format benar dan tidak ada klaim ganda", () => {
    expect(validateRegistry()).toEqual([]);
  });

  it("prefixFor/moduleOfTable konsisten", () => {
    expect(prefixFor("billing")).toBe("bill_");
    expect(prefixFor("modules")).toBe("mod_");
    expect(moduleOfTable("bill_plans")).toBe("billing");
    expect(moduleOfTable("mod_features")).toBe("modules");
    expect(moduleOfTable("plans")).toBeNull();
  });

  it("tabel inti baru langsung lolos; tabel tak dikenal ditolak", () => {
    expect(isAllowedTableName("mod_features")).toBe(true);
    expect(isAllowedTableName("bill_plans")).toBe(true);
    expect(isAllowedTableName("users")).toBe(true);
    expect(isAllowedTableName("plans")).toBe(true); // legacy, boleh sampai Fase D
    expect(isAllowedTableName("cek_ongkir_cache")).toBe(false);
    expect(isAllowedTableName("features")).toBe(false);
  });
});

describe("migrasi SQL mematuhi konvensi prefix", () => {
  const dir = join(__dirname, "..", "..", "..", "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));

  it("setiap CREATE TABLE memakai prefix terdaftar / allowlist / legacy", () => {
    const bad: string[] = [];
    for (const f of files) {
      const sql = readFileSync(join(dir, f), "utf8");
      // Handles: foo, IF NOT EXISTS foo, "foo", public.foo, "public"."foo"
      const re = /CREATE TABLE (?:IF NOT EXISTS )?(?:"?[\w$]+"?\.)?"?([\w$]+)"?/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sql)) !== null) {
        const table = m[1];
        if (!isAllowedTableName(table)) {
          bad.push(`${f}: tabel "${table}" tanpa prefix (§5.6)`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
