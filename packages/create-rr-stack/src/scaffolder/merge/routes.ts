import type { Glue, Provider, RouteEntry } from "../../resolver/types.js";

/**
 * Structured `app/routes.ts` merge (ticket 013): every provider's/glue
 * fragment's declared `routes` (`Provider.routes`/`Glue.routes`) becomes
 * one `index(file)`/`route(path, file)` entry, in `plan.providers`/
 * `plan.glue` order (same determinism rationale as `mergePackageJson`).
 *
 * Falls back to a single `index("routes/home.tsx")` when nothing declares
 * an index route — the "no auth, no storage, nothing selected" case this
 * project has always supported, now produced by this merger instead of a
 * static file the base template shipped, so the base template's own
 * `app/home.tsx`-pointing default stays reachable without every other
 * fragment having to know about it. That fallback is also what makes
 * `includeDemo: false` (ticket 016's `--no-example`) work for free: with
 * `demoRoutes` excluded, an auth provider that declared *only* demo
 * routes contributes nothing here, `hasIndex` comes back false, and the
 * base template's own landing page becomes the index again.
 */
export function mergeRoutes(
  providers: readonly Provider[],
  glue: readonly Glue[],
  includeDemo = true,
): string {
  const declared: RouteEntry[] = [
    ...providers.flatMap((provider) => [
      ...(provider.routes ?? []),
      ...(includeDemo ? (provider.demoRoutes ?? []) : []),
    ]),
    ...glue.flatMap((fragment) => [
      ...(fragment.routes ?? []),
      ...(includeDemo ? (fragment.demoRoutes ?? []) : []),
    ]),
  ];

  const hasIndex = declared.some((entry) => "index" in entry);
  const entries = hasIndex
    ? declared
    : [{ index: true, file: "routes/home.tsx" } as const, ...declared];

  const lines = entries.map((entry) =>
    "index" in entry
      ? `  index(${JSON.stringify(entry.file)}),`
      : `  route(${JSON.stringify(entry.path)}, ${JSON.stringify(entry.file)}),`,
  );

  return [
    'import { index, route, type RouteConfig } from "@react-router/dev/routes";',
    "",
    "export default [",
    ...lines,
    "] satisfies RouteConfig;",
    "",
  ].join("\n");
}
