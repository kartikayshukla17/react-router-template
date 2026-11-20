/**
 * Package-manager auto-detection (ticket 016): `npm_config_user_agent` is
 * set by npm, pnpm, yarn, and bun alike (not an npm-specific name despite
 * its own prefix — every one of them writes it for exactly this kind of
 * detection) to `"<pm>/<version> ..."`, so the name before the first `/`
 * identifies which one invoked this CLI (`npm create`, `pnpm create`,
 * `yarn create`, `bun create`). `--pm` (`parse-args.ts`) overrides this
 * outright — `run.ts` only calls this when `--pm` wasn't given.
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const KNOWN_PACKAGE_MANAGERS: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

export function detectPackageManager(env: { npm_config_user_agent?: string }): PackageManager {
  const userAgent = env.npm_config_user_agent;
  if (!userAgent) {
    return "npm";
  }

  const name = userAgent.split("/")[0];
  if (name && (KNOWN_PACKAGE_MANAGERS as readonly string[]).includes(name)) {
    return name as PackageManager;
  }

  return "npm";
}

export interface InstallCommand {
  command: string;
  args: string[];
}

export function installCommandFor(pm: PackageManager): InstallCommand {
  return { command: pm, args: ["install"] };
}
