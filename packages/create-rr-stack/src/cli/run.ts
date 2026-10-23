/**
 * The interactive prompt flow: database → host → ORM → auth → extras →
 * confirm → scaffold → next steps. `cli.ts` stays a thin shell that only
 * does the Node-version guard and calls `runCli()` — this module holds the
 * actual logic so it stays unit-reachable and `cli.ts` doesn't balloon.
 *
 * No flags/`--yes` mode yet (ticket 016): `argv`/`env` are accepted for a
 * stable signature but unused this ticket.
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import { isErrors, type Option, options, resolve, type Selections } from "../resolver/index.js";
import { NodeFileSystem } from "../scaffolder/fs/node-fs.js";
import { scaffold } from "../scaffolder/scaffold.js";
import { copyBaseTemplate } from "./base-copy.js";
import { printNextSteps } from "./next-steps.js";
import { writeProjectRecord } from "./project-record.js";

type ClackOption = { value: string; label: string; hint?: string };

/** Drops disabled options and logs why, instead of showing an unselectable item. */
function availableOptions(allOptions: Option[]): ClackOption[] {
  for (const option of allOptions) {
    if (option.disabled) {
      p.log.warn(`"${option.label}" isn't available yet: ${option.reason}`);
    }
  }
  return allOptions.filter((option) => !option.disabled).map((option) => ({ ...option }));
}

export async function runCli(argv: readonly string[], env: NodeJS.ProcessEnv): Promise<number> {
  void argv;
  void env;

  p.intro("create-rr-stack");

  const projectNameResult = await p.text({
    message: "Project name (also the directory to create)",
    placeholder: "my-app",
    defaultValue: "my-app",
    validate: (value) =>
      (value ?? "").trim().length === 0 ? "Project name can't be empty." : undefined,
  });
  if (p.isCancel(projectNameResult)) {
    return cancelledWithNothingWritten();
  }
  const projectName = String(projectNameResult || "my-app");
  const targetDir = path.resolve(process.cwd(), projectName);

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    const overwrite = await p.confirm({
      message: `"${projectName}" already exists and isn't empty. Write into it anyway?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      return cancelledWithNothingWritten();
    }
  }

  const selections: Selections = {};

  const database = await p.select<ClackOption["value"]>({
    message: "Database",
    options: availableOptions(options("database", selections)),
  });
  if (p.isCancel(database)) {
    return cancelledWithNothingWritten();
  }
  selections.database = database;

  if (selections.database === "postgres") {
    const host = await p.select<Selections["postgresHost"]>({
      message: "Postgres host",
      options: [
        { value: "neon", label: "Neon (hosted)" },
        { value: "docker", label: "Docker (local)" },
      ],
    });
    if (p.isCancel(host) || host === undefined) {
      return cancelledWithNothingWritten();
    }
    selections.postgresHost = host;
  }

  const ormChoices: ClackOption[] = [
    ...availableOptions(options("orm", selections)),
    { value: "none", label: "None" },
  ];
  const orm = await p.select<string>({ message: "ORM", options: ormChoices });
  if (p.isCancel(orm)) {
    return cancelledWithNothingWritten();
  }
  if (orm !== "none") {
    selections.orm = orm;
  }

  const authChoices: ClackOption[] = [
    ...availableOptions(options("auth", selections)),
    { value: "none", label: "None" },
  ];
  const auth = await p.select<string>({ message: "Auth", options: authChoices });
  if (p.isCancel(auth)) {
    return cancelledWithNothingWritten();
  }
  if (auth !== "none") {
    selections.auth = auth;
  }

  const includeExample = await p.confirm({
    message: "Include the demo app (landing, sign-in, dashboard, notes)?",
    initialValue: true,
  });
  if (p.isCancel(includeExample)) {
    return cancelledWithNothingWritten();
  }
  selections.extras = { shadcn: false, docker: false, example: Boolean(includeExample) };

  const result = resolve(selections);
  if (isErrors(result)) {
    p.log.error("This combination of choices can't be resolved:");
    for (const error of result.errors) {
      p.log.error(`  - ${error.message}`);
    }
    p.outro("Nothing was written.");
    return 1;
  }
  const plan = result;

  p.note(
    formatPlanSummary(
      selections,
      plan.providers.map((provider) => provider.label),
    ),
    "Plan",
  );

  const confirmed = await p.confirm({
    message: `Write this project to ${targetDir}?`,
    initialValue: true,
  });
  if (p.isCancel(confirmed) || !confirmed) {
    return cancelledWithNothingWritten();
  }

  const spinner = p.spinner();
  spinner.start("Scaffolding project");

  await copyBaseTemplate(targetDir);
  const scaffoldResult = await scaffold(plan, targetDir, new NodeFileSystem());

  if (!scaffoldResult.ok) {
    spinner.stop("Scaffold failed");
    p.log.error(scaffoldResult.error.message);
    p.outro("The project may be partially written; fix the conflict above and re-run.");
    return 1;
  }

  await writeProjectRecord(targetDir, selections);
  spinner.stop("Project scaffolded");

  p.outro(`Done! Your project is ready at ${targetDir}`);
  printNextSteps(plan, projectName);

  return 0;
}

function formatPlanSummary(selections: Selections, providerLabels: readonly string[]): string {
  const lines = [
    `Database: ${selections.database ?? "none"}${selections.postgresHost ? ` (${selections.postgresHost})` : ""}`,
    `ORM: ${selections.orm ?? "none"}`,
    `Auth: ${selections.auth ?? "none"}`,
    `Demo app: ${selections.extras?.example ? "yes" : "no"}`,
    "",
    `Providers to install: ${providerLabels.length > 0 ? providerLabels.join(", ") : "(none)"}`,
  ];
  return lines.join("\n");
}

function cancelledWithNothingWritten(): number {
  p.cancel("Cancelled. Nothing was written to disk.");
  return 1;
}
