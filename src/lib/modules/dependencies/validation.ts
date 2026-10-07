import type { FeatureDependency, ValidateSeedResult, ResolveResult } from "./types";
import { buildGraph, detectCircular, topologicalSort, getTransitiveDeps, checkConflicts } from "./graph";

/** Resolve dependencies for a set of requested features. */
export function resolveDependencies(
  allFeatures: FeatureDependency[],
  requested: string[],
  activeFeatures: string[] = []
): ResolveResult {
  const graph = buildGraph(allFeatures);
  const activeSet = new Set(activeFeatures);
  const requestedSet = new Set(requested);

  const errors: string[] = [];
  const warnings: string[] = [];
  const autoIncluded: string[] = [];

  // 1. Check for circular dependencies in the full graph
  const cycles = detectCircular(graph);
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      errors.push(`Circular dependency: ${cycle.join(" -> ")}`);
    }
    return { resolved: [], autoIncluded: [], warnings, errors };
  }

  // 2. Get transitive closure of hard dependencies
  const transitive = getTransitiveDeps(graph, requested);
  
  // 3. Auto-include hard dependencies not in requested
  for (const dep of transitive) {
    if (!requestedSet.has(dep) && !activeSet.has(dep)) {
      autoIncluded.push(dep);
      requestedSet.add(dep);
    }
  }

  // 4. Check conflicts
  for (const featureId of requestedSet) {
    const conflicts = checkConflicts(graph, featureId, activeSet);
    for (const conflict of conflicts) {
      errors.push(`Feature "${featureId}" conflicts with active feature "${conflict}"`);
    }
  }

  // 5. Check soft dependencies (recommends)
  for (const featureId of requestedSet) {
    const feature = graph.nodes.get(featureId);
    if (!feature) continue;
    for (const rec of feature.recommends) {
      if (!activeSet.has(rec) && !requestedSet.has(rec)) {
        warnings.push(`Feature "${featureId}" recommends "${rec}" (not enabled)`);
      }
    }
  }

  // 6. Topological sort
  const allRequested = [...requestedSet];
  let resolved: string[];
  try {
    resolved = topologicalSort(graph, allRequested);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Unknown topological sort error");
    return { resolved: [], autoIncluded: [], warnings, errors };
  }

  return { resolved, autoIncluded, warnings, errors };
}

/** Validate seed data (all features) for circular deps and consistency. */
export function validateSeed(allFeatures: FeatureDependency[]): ValidateSeedResult {
  const graph = buildGraph(allFeatures);
  const cycles = detectCircular(graph);
  const missingHardDeps: string[] = [];
  const conflicts: string[] = [];

  // Check all hard deps exist
  for (const feature of allFeatures) {
    for (const req of feature.requires) {
      if (!graph.nodes.has(req)) {
        missingHardDeps.push(`${feature.featureId} requires missing feature "${req}"`);
      }
    }
    for (const rec of feature.recommends) {
      if (!graph.nodes.has(rec)) {
        missingHardDeps.push(`${feature.featureId} recommends missing feature "${rec}"`);
      }
    }
    for (const conflict of feature.conflicts) {
      if (!graph.nodes.has(conflict)) {
        conflicts.push(`${feature.featureId} conflicts with missing feature "${conflict}"`);
      }
    }
  }

  return {
    valid: cycles.length === 0 && missingHardDeps.length === 0 && conflicts.length === 0,
    circularDependencies: cycles,
    missingHardDeps,
    conflicts,
  };
}

/** Validate a single feature definition. */
export function validateFeature(feature: FeatureDependency, allFeatures: FeatureDependency[]): string[] {
  const errors: string[] = [];
  const allIds = new Set(allFeatures.map((f) => f.featureId));

  if (!feature.featureId || !/^[a-z0-9_]+$/.test(feature.featureId)) {
    errors.push(`Invalid featureId: "${feature.featureId}" (must be lowercase with underscores)`);
  }

  if (allIds.has(feature.featureId)) {
    // Check duplicates handled by caller
  }

  for (const req of feature.requires) {
    if (!allIds.has(req)) {
      errors.push(`Feature "${feature.featureId}" requires unknown feature "${req}"`);
    }
  }

  for (const rec of feature.recommends) {
    if (!allIds.has(rec)) {
      errors.push(`Feature "${feature.featureId}" recommends unknown feature "${rec}"`);
    }
  }

  for (const conflict of feature.conflicts) {
    if (!allIds.has(conflict)) {
      errors.push(`Feature "${feature.featureId}" conflicts with unknown feature "${conflict}"`);
    }
    if (conflict === feature.featureId) {
      errors.push(`Feature cannot conflict with itself`);
    }
  }

  // Self-dependency check
  if (feature.requires.includes(feature.featureId)) {
    errors.push(`Feature "${feature.featureId}" cannot require itself`);
  }

  return errors;
}