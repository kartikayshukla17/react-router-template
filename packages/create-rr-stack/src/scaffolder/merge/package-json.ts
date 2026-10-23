import type { Glue, Provider } from "../../resolver/types.js";

interface MinimalPackageJson {
  name: string;
  version: string;
  private: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  [key: string]: unknown;
}

function defaultPackageJson(): MinimalPackageJson {
  return {
    name: "app",
    version: "0.0.0",
    private: true,
    dependencies: {},
    devDependencies: {},
    scripts: {},
  };
}

/**
 * Structured `package.json` merge: parses the existing file (or starts from
 * a stub), then folds in every provider's pinned `deps`/`devDeps`/`scripts`
 * and every glue fragment's `deps`. A later provider's pin for the same
 * package name wins — deterministic, since `plan.providers` order is fixed
 * by `resolve()`.
 */
export function mergePackageJson(
  existing: string | undefined,
  providers: readonly Provider[],
  glue: readonly Glue[] = [],
): string {
  const base: MinimalPackageJson = existing
    ? { ...defaultPackageJson(), ...(JSON.parse(existing) as Partial<MinimalPackageJson>) }
    : defaultPackageJson();

  base.dependencies = { ...base.dependencies };
  base.devDependencies = { ...base.devDependencies };
  base.scripts = { ...base.scripts };

  for (const provider of providers) {
    Object.assign(base.dependencies, provider.deps);
    if (provider.devDeps) {
      Object.assign(base.devDependencies, provider.devDeps);
    }
    if (provider.scripts) {
      Object.assign(base.scripts, provider.scripts);
    }
  }

  for (const fragment of glue) {
    if (fragment.deps) {
      Object.assign(base.dependencies, fragment.deps);
    }
  }

  return `${JSON.stringify(base, null, 2)}\n`;
}
