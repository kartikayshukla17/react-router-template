import { spawn } from "node:child_process";

export interface CommandResult {
  code: number;
}

/**
 * The injectable seam for every child process this CLI spawns (`git
 * init`, the package manager's `install`) — same rationale as the
 * scaffolder's `FileSystem`: `post-scaffold.ts`'s tests inject a stub
 * runner instead of actually spawning processes, and `runCommand` below
 * is the one real implementation `run.ts` wires in.
 */
export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<CommandResult>;

export const runCommand: CommandRunner = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1 }));
  });
