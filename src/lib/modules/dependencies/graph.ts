import type { FeatureDependency, DependencyGraph, ResolveResult } from "./types";

/** Build dependency graph from feature dependencies. */
export function buildGraph(features: FeatureDependency[]): DependencyGraph {
  const nodes = new Map<string, FeatureDependency>();
  const edges = new Map<string, Set<string>>();

  for (const f of features) {
    nodes.set(f.featureId, f);
    edges.set(f.featureId, new Set());
  }

  // Build reverse edges: featureId -> set of features that depend on it
  for (const f of features) {
    for (const req of f.requires) {
      if (edges.has(req)) {
        edges.get(req)!.add(f.featureId);
      }
    }
    for (const rec of f.recommends) {
      if (edges.has(rec)) {
        edges.get(rec)!.add(f.featureId);
      }
    }
  }

  return { nodes, edges };
}

/** Topological sort using Kahn's algorithm. */
export function topologicalSort(graph: DependencyGraph, nodes: string[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, Set<string>>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node, 0);
    adj.set(node, new Set());
  }

  // Build adjacency and in-degree
  for (const node of nodes) {
    const deps = graph.nodes.get(node);
    if (!deps) continue;
    for (const req of deps.requires) {
      if (nodes.includes(req)) {
        adj.get(req)!.add(node);
        inDegree.set(node, (inDegree.get(node) || 0) + 1);
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const neighbor of adj.get(node) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (result.length !== nodes.length) {
    // Circular dependency detected
    const remaining = nodes.filter((n) => !result.includes(n));
    throw new Error(`Circular dependency detected: ${remaining.join(" -> ")}`);
  }

  return result;
}

/** Detect circular dependencies using DFS. */
export function detectCircular(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const path: string[] = [];

  function dfs(node: string) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const deps = graph.nodes.get(node);
    if (deps) {
      for (const req of [...deps.requires, ...deps.recommends]) {
        if (graph.nodes.has(req)) {
          if (!visited.has(req)) {
            dfs(req);
          } else if (recStack.has(req)) {
            // Found cycle
            const cycleStart = path.indexOf(req);
            cycles.push([...path.slice(cycleStart), req]);
          }
        }
      }
    }

    recStack.delete(node);
    path.pop();
  }

  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/** Get transitive closure of dependencies (all required features recursively). */
export function getTransitiveDeps(graph: DependencyGraph, featureIds: string[]): Set<string> {
  const result = new Set<string>(featureIds);
  const queue = [...featureIds];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const deps = graph.nodes.get(node);
    if (!deps) continue;

    for (const req of deps.requires) {
      if (!result.has(req)) {
        result.add(req);
        queue.push(req);
      }
    }
  }

  return result;
}

/** Check if enabling a feature would violate conflicts. */
export function checkConflicts(graph: DependencyGraph, featureId: string, activeFeatures: Set<string>): string[] {
  const feature = graph.nodes.get(featureId);
  if (!feature) return [];

  const conflicts: string[] = [];
  for (const conflict of feature.conflicts) {
    if (activeFeatures.has(conflict)) {
      conflicts.push(conflict);
    }
  }
  return conflicts;
}

/** Check if disabling a feature is blocked by dependents. */
export function checkBlockedDisable(graph: DependencyGraph, featureId: string, activeFeatures: Set<string>): string[] {
  const dependents = graph.edges.get(featureId);
  if (!dependents) return [];

  const blockers: string[] = [];
  for (const dep of dependents) {
    if (activeFeatures.has(dep)) {
      const depFeature = graph.nodes.get(dep);
      if (depFeature?.requires.includes(featureId)) {
        blockers.push(dep);
      }
    }
  }
  return blockers;
}