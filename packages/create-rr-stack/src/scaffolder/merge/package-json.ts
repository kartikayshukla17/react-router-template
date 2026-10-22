import type { Provider } from "../../resolver/types.js";

interface MinimalPackageJson {
  name: string;
  version: string;
  private: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: unknown;
}

function defaultPackageJson(): MinimalPackageJson {
  return {
    name: "app",
    version: "0.0.0",
    private: true,
    dependencies: {},
    devDependencies: {},
  };
}

/**
 * Structured `package.json` merge: parses the existing file (or starts from
 * a stub), then folds in every provider's pinned `deps`/`devDeps`. A later
 * provider's pin for the same package name wins — this ticket has only one
 * provider, so that tie-break doesn't come into play yet, but it keeps the
 * merge deterministic for 004+.
 */
export function mergePackageJson(
  existing: string | undefined,
  providers: readonly Provider[],
): string {
  const base: MinimalPackageJson = existing
    ? { ...defaultPackageJson(), ...(JSON.parse(existing) as Partial<MinimalPackageJson>) }
    : defaultPackageJson();

  base.dependencies = { ...base.dependencies };
  base.devDependencies = { ...base.devDependencies };

  for (const provider of providers) {
    Object.assign(base.dependencies, provider.deps);
    if (provider.devDeps) {
      Object.assign(base.devDependencies, provider.devDeps);
    }
  }

  return `${JSON.stringify(base, null, 2)}\n`;
}
