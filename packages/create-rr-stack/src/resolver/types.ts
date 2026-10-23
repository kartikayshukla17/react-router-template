/**
 * Shared data shapes for the stack resolver and everything downstream of it
 * (scaffolder, provider manifests). These mirror PRD.md §8 (Data Models) and
 * §9 (Interface Surface), with two intentional, narrow extensions explained
 * inline below.
 */

/**
 * `"baas"` is the third intentional extension beyond PRD.md §8's literal
 * `Layer` union (alongside `Provider.baas` and `Selections.postgresHost`,
 * both already present): the layer a shared BaaS client fragment (e.g.
 * `supabase-client`, see `providers/baas/`) lives on. Nothing is ever
 * selected directly onto this layer through `Selections` — no prompt asks
 * for it — `resolve()`'s `selectBaasClients()` is the only thing that ever
 * adds a `baas`-layer provider to a `Plan`, computed from which *other*
 * selected providers declare `Provider.baas`.
 */
export type Layer = "database" | "orm" | "auth" | "storage" | "realtime" | "baas";

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
  /**
   * npm scripts to merge into the generated project's `package.json`
   * (structured merge, same discipline as `deps`/`devDeps`). Optional
   * because most providers don't need their own scripts; `orm/drizzle`
   * is the first one that does (`db:push`, `db:studio`).
   */
  scripts?: Record<string, string>;
}

export interface Glue {
  between: [providerId: string, providerId: string];
  files: string;
  deps?: Record<string, string>;
  /**
   * Same rationale as `Provider.fileManifest`: the scaffolder's `FileSystem`
   * seam has no directory-listing primitive, so a glue fragment declares the
   * relative paths it ships instead of the scaffolder discovering them by
   * walking `files` on disk.
   */
  fileManifest: readonly string[];
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
  /**
   * No prompt ever sets this directly (see `Layer`'s doc comment above) —
   * present only so `selections[layer]` type-checks for every `Layer`
   * value in `rules.ts`/`options.ts`, which index `Selections` generically
   * by whatever `Layer` a `Constraint` or availability check names.
   */
  baas?: string;
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
