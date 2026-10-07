import { describe, it, expect } from "vitest";
import { buildGraph, topologicalSort, detectCircular, getTransitiveDeps, checkConflicts, checkBlockedDisable } from "./graph";
import { resolveDependencies, validateSeed, validateFeature } from "./validation";
import type { FeatureDependency } from "./types";

const MOCK_FEATURES: FeatureDependency[] = [
  { featureId: "products", requires: [], recommends: [], conflicts: [] },
  { featureId: "orders", requires: ["products"], recommends: [], conflicts: [] },
  { featureId: "stock_tracking", requires: ["products"], recommends: [], conflicts: [] },
  { featureId: "cek_ongkir", requires: ["products", "orders"], recommends: [], conflicts: [] },
  { featureId: "akunting_dasar", requires: ["orders"], recommends: [], conflicts: [] },
  { featureId: "akunting_lanjutan", requires: ["akunting_dasar"], recommends: [], conflicts: [] },
  { featureId: "hrm_core", requires: [], recommends: [], conflicts: [] },
  { featureId: "payroll", requires: ["hrm_core"], recommends: ["akunting_dasar"], conflicts: [] },
  { featureId: "payment_online", requires: ["orders", "products"], recommends: [], conflicts: ["cek_ongkir"] },
];

describe("dependencies/graph", () => {
  const graph = buildGraph(MOCK_FEATURES);

  it("builds graph with correct nodes and edges", () => {
    expect(graph.nodes.size).toBe(MOCK_FEATURES.length);
    expect(graph.edges.get("products")).toContain("orders");
    expect(graph.edges.get("products")).toContain("stock_tracking");
    expect(graph.edges.get("orders")).toContain("cek_ongkir");
    expect(graph.edges.get("akunting_dasar")).toContain("akunting_lanjutan");
    expect(graph.edges.get("hrm_core")).toContain("payroll");
  });

  it("topologicalSort orders dependencies correctly", () => {
    // topologicalSort only sorts the nodes passed to it
    // For full dependency resolution, use resolveDependencies()
    const sorted = topologicalSort(graph, [
      "products", "orders", "cek_ongkir",
      "akunting_dasar", "akunting_lanjutan",
      "hrm_core", "payroll"
    ]);
    // products before orders before cek_ongkir
    expect(sorted.indexOf("products")).toBeLessThan(sorted.indexOf("orders"));
    expect(sorted.indexOf("orders")).toBeLessThan(sorted.indexOf("cek_ongkir"));
    // akunting_dasar before akunting_lanjutan
    expect(sorted.indexOf("akunting_dasar")).toBeLessThan(sorted.indexOf("akunting_lanjutan"));
    // hrm_core before payroll
    expect(sorted.indexOf("hrm_core")).toBeLessThan(sorted.indexOf("payroll"));
  });

  it("detectCircular finds no cycles in valid graph", () => {
    const cycles = detectCircular(graph);
    expect(cycles).toHaveLength(0);
  });

  it("detectCircular finds cycles", () => {
    const cyclicFeatures: FeatureDependency[] = [
      { featureId: "a", requires: ["b"], recommends: [], conflicts: [] },
      { featureId: "b", requires: ["a"], recommends: [], conflicts: [] },
    ];
    const cyclicGraph = buildGraph(cyclicFeatures);
    const cycles = detectCircular(cyclicGraph);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain("a");
    expect(cycles[0]).toContain("b");
  });

  it("getTransitiveDeps returns all hard deps recursively", () => {
    const deps = getTransitiveDeps(graph, ["cek_ongkir"]);
    expect(deps).toContain("products");
    expect(deps).toContain("orders");
    expect(deps).toContain("cek_ongkir");
    expect(deps).not.toContain("stock_tracking"); // not a hard dep of cek_ongkir
  });

  it("checkConflicts detects active conflicts", () => {
    const active = new Set(["cek_ongkir"]);
    const conflicts = checkConflicts(graph, "payment_online", active);
    expect(conflicts).toContain("cek_ongkir");
  });

  it("checkConflicts returns empty for non-conflicting", () => {
    const active = new Set(["stock_tracking"]);
    const conflicts = checkConflicts(graph, "payment_online", active);
    expect(conflicts).toHaveLength(0);
  });

  it("checkBlockedDisable finds hard dependents", () => {
    const active = new Set(["orders", "cek_ongkir"]);
    const blockers = checkBlockedDisable(graph, "products", active);
    expect(blockers).toContain("orders");
    expect(blockers).toContain("cek_ongkir");
  });
});

describe("dependencies/validation", () => {
  it("resolveDependencies auto-includes hard deps", () => {
    const result = resolveDependencies(MOCK_FEATURES, ["cek_ongkir"]);
    expect(result.errors).toHaveLength(0);
    expect(result.autoIncluded).toContain("products");
    expect(result.autoIncluded).toContain("orders");
    expect(result.resolved).toContain("products");
    expect(result.resolved).toContain("orders");
    expect(result.resolved).toContain("cek_ongkir");
  });

  it("resolveDependencies includes soft dep warnings", () => {
    const result = resolveDependencies(MOCK_FEATURES, ["payroll"], ["hrm_core"]);
    expect(result.warnings.some((w) => w.includes("akunting_dasar"))).toBe(true);
  });

  it("resolveDependencies detects conflicts", () => {
    const result = resolveDependencies(MOCK_FEATURES, ["payment_online"], ["cek_ongkir"]);
    expect(result.errors.some((e) => e.includes("conflicts"))).toBe(true);
  });

  it("resolveDependencies throws on circular", () => {
    const cyclicFeatures: FeatureDependency[] = [
      { featureId: "a", requires: ["b"], recommends: [], conflicts: [] },
      { featureId: "b", requires: ["a"], recommends: [], conflicts: [] },
    ];
    const result = resolveDependencies(cyclicFeatures, ["a"]);
    expect(result.errors.some((e) => e.includes("Circular"))).toBe(true);
  });

  it("validateSeed passes for valid features", () => {
    const result = validateSeed(MOCK_FEATURES);
    expect(result.valid).toBe(true);
    expect(result.circularDependencies).toHaveLength(0);
    expect(result.missingHardDeps).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it("validateSeed fails for missing hard deps", () => {
    const invalidFeatures: FeatureDependency[] = [
      { featureId: "a", requires: ["missing"], recommends: [], conflicts: [] },
    ];
    const result = validateSeed(invalidFeatures);
    expect(result.valid).toBe(false);
    expect(result.missingHardDeps).toContain('a requires missing feature "missing"');
  });

  it("validateFeature validates featureId format", () => {
    const errors = validateFeature({ featureId: "Invalid-ID", requires: [], recommends: [], conflicts: [] }, MOCK_FEATURES);
    expect(errors.some((e) => e.includes("Invalid featureId"))).toBe(true);
  });

  it("validateFeature detects self-dependency", () => {
    const errors = validateFeature({ featureId: "products", requires: ["products"], recommends: [], conflicts: [] }, MOCK_FEATURES);
    expect(errors.some((e) => e.includes("cannot require itself"))).toBe(true);
  });

  it("validateFeature detects self-conflict", () => {
    const errors = validateFeature({ featureId: "products", requires: [], recommends: [], conflicts: ["products"] }, MOCK_FEATURES);
    expect(errors.some((e) => e.includes("cannot conflict with itself"))).toBe(true);
  });
});