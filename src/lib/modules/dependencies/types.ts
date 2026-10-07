/** Feature dependency types for DAG resolution. */

export interface FeatureDependency {
  featureId: string;
  requires: string[];      // Hard dependencies (must be enabled)
  recommends: string[];    // Soft dependencies (warning if missing)
  conflicts: string[];     // Mutually exclusive features
}

export interface DependencyGraph {
  nodes: Map<string, FeatureDependency>;
  edges: Map<string, Set<string>>; // featureId -> set of dependent featureIds
}

export interface ResolveResult {
  resolved: string[];           // Topologically sorted feature IDs
  autoIncluded: string[];       // Hard deps that were auto-added
  warnings: string[];           // Soft dep warnings
  errors: string[];             // Circular deps, conflicts, missing hard deps
}

export interface ValidateSeedResult {
  valid: boolean;
  circularDependencies: string[][];
  missingHardDeps: string[];
  conflicts: string[];
}