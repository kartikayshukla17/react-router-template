/**
 * The two side-effecting steps after `scaffold()` writes files (ticket
 * 016): `git init` (opt out with `--no-git`, default on) and the
 * detected/specified package manager's install (opt out with
 * `--no-install`, default on). Both take a `CommandRunner` so `run.ts`
 * can inject the real `runCommand` while tests inject a stub — neither
 * function spawns a process itself.
 */
import type { InstallCommand, PackageManager } from "./detect-package-manager.js";
import { installCommandFor } from "./detect-package-manager.js";
import type { CommandRunner } from "./run-command.js";

export async function initGit(targetDir: string, runner: CommandRunner): Promise<boolean> {
  const result = await runner("git", ["init"], targetDir);
  return result.code === 0;
}

export async function installDependencies(
  targetDir: string,
  pm: PackageManager,
  runner: CommandRunner,
): Promise<boolean> {
  const { command, args }: InstallCommand = installCommandFor(pm);
  const result = await runner(command, args, targetDir);
  return result.code === 0;
}
