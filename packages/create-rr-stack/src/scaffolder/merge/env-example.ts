import type { EnvVar } from "../../resolver/types.js";

function nameOf(line: string): string {
  const [name] = line.split("=");
  return name ?? line;
}

/**
 * Structured `.env.example` merge: appends each new `EnvVar` as a comment +
 * `NAME=` line, skipping names that already appear in the existing file so
 * re-running the scaffolder (or layering multiple providers) never
 * duplicates an entry.
 */
export function mergeEnvExample(existing: string | undefined, envVars: readonly EnvVar[]): string {
  const lines = existing ? existing.split("\n").filter((line) => line.length > 0) : [];
  const existingNames = new Set(lines.filter((line) => !line.startsWith("#")).map(nameOf));

  for (const envVar of envVars) {
    if (existingNames.has(envVar.name)) {
      continue;
    }
    lines.push(`# ${envVar.description} (${envVar.whereToFind})`);
    lines.push(`${envVar.name}=`);
    existingNames.add(envVar.name);
  }

  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}
