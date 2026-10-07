/** Main module system exports */

export * from "./prefixes";
export * from "./types";
export * from "./dependencies";
export * from "./core/site-types";
export * from "./core/entitlements";

// Feature modules (auto-discovered via catalog.generated.ts)
// Individual features export their FEATURE constant from their index.ts