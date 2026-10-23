import path from "node:path";
import { getTemplatesRoot } from "../providers/templates-root.js";
import type { Plan } from "../resolver/types.js";

/**
 * Rewrites every provider/glue fragment's `files` field (a templates-root-
 * relative path, e.g. `"providers/database/postgres-neon"`) into an
 * absolute path, by joining it against the real `templates/` directory.
 *
 * Deliberately a CLI-level step, called once right before `scaffold()`
 * actually runs — not inside the resolver and not as a side effect of
 * importing the provider registry. `resolve()`/`options()` and the
 * provider manifests only ever see/produce templates-root-relative
 * strings, so importing (or calling) the resolver module graph never
 * touches the filesystem; only this function, called at scaffold time,
 * does the real-path resolution the scaffolder needs to read fragment
 * files off disk.
 */
export function resolvePlanFragmentPaths(plan: Plan): Plan {
  const root = getTemplatesRoot();

  return {
    ...plan,
    providers: plan.providers.map((provider) => ({
      ...provider,
      files: path.join(root, provider.files),
    })),
    glue: plan.glue.map((glue) => ({
      ...glue,
      files: path.join(root, glue.files),
    })),
  };
}
