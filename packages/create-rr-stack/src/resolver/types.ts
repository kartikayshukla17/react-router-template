/**
 * Shared data shapes for the stack resolver and everything downstream of it
 * (scaffolder, provider manifests). These mirror PRD.md §8 (Data Models) and
 * §9 (Interface Surface), with two intentional, narrow extensions explained
 * inline below.
 */

export type Layer = "database" | "orm" | "auth" | "storage" | "realtime";

/** A single prompt option surfaced by `options(layer, partial)`. */
export interface Option {
  value: string;
  label: string;
  /** True when `partial` rules this option out given selections made so far. */
  disabled?: boolean;
  /** Present when `disabled` is true: why this option is unavailable. */
  reason?: string;
}

export interface EnvVar {
  name: string;
  description: string;
  whereToFind: string;
  secret: boolean;
}

/** `requires`/`conflicts` entry: a layer must (or must not) be one of a set of ids. */
export interface Constraint {
  layer: Layer;
  oneOf: string[];
}

export interface Provider {
  layer: Layer;
  id: string;
  label: string;
  baas?: "supabase" | "firebase" | "convex";
  requires?: Constraint[];
  conflicts?: Constraint[];
  deps: Record<string, string>;
  devDeps?: Record<string, string>;
  env: EnvVar[];
  /**
   * Folder (relative to the templates root) holding this provider's files to
   * overlay onto the generated project.
   */
  files: string;
  /**
   * Relative paths, within `files`, that this provider actually ships.
   *
   * The scaffolder's injectable `FileSystem` seam intentionally exposes only
   * readFile/writeFile/mkdir/exists (no directory listing), so it cannot
   * discover a fragment's contents by walking `files` on disk. Declaring the
   * manifest explicitly keeps the scaffolder free of any disk-specific
   * traversal logic and fully testable against an in-memory `FileSystem`.
   */
  fileManifest: readonly string[];
  nextSteps: string[];
}

export interface Glue {
  between: [providerId: string, providerId: string];
  files: string;
  deps?: Record<string, string>;
}

/**
 * PRD.md §8 declares `extras` as a required field on `Selections`. This
 * ticket's acceptance criteria call `resolve({})` and
 * `resolve({ database: "postgres", postgresHost: "docker" })` directly, with
 * no `extras` key, so `extras` is optional here — a defaulting concern for
 * the (out-of-scope) CLI shell, not the pure resolver.
 */
export interface Selections {
  database?: string;
  orm?: string;
  auth?: string;
  storage?: string;
  realtime?: string;
  postgresHost?: "docker" | "neon" | "supabase";
  extras?: { shadcn: boolean; docker: boolean; example: boolean };
}

export interface Plan {
  providers: Provider[];
  glue: Glue[];
  installOrder: string[];
  env: EnvVar[];
  nextSteps: string[];
}

export interface ResolverError {
  code: string;
  message: string;
  layer?: Layer;
}

export interface Errors {
  errors: ResolverError[];
}

export type ResolveResult = Plan | Errors;

/** Type guard distinguishing the two `resolve()` outcomes. */
export function isErrors(result: ResolveResult): result is Errors {
  return "errors" in result;
}
