/**
 * The CLI entry point, dispatching to one of two flows (ticket 016):
 *
 * - `runInteractive` — database → host → ORM → auth → storage → realtime →
 *   confirm → scaffold → next steps, one clack prompt at a time. Any
 *   selection already given via a flag (`parseArgs`) skips its prompt.
 * - `runNonInteractive` — zero prompts, plain colorless text. Chosen when
 *   `--yes` was passed, or stdout isn't a TTY (piped output can't answer a
 *   prompt at all, so there's nothing to fall back to). Unspecified flags
 *   fill in from `withDefaults` (`parse-args.ts`) rather than erroring.
 *
 * Both flows build the exact same `Selections` → `resolve()` → `scaffold()`
 * pipeline, then run the same post-scaffold steps (`git init`, the
 * detected/specified package manager's install) unless `--no-git`/
 * `--no-install` opt out.
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import { isErrors, type Option, options, resolve, type Selections } from "../resolver/index.js";
import { NodeFileSystem } from "../scaffolder/fs/node-fs.js";
import { scaffold } from "../scaffolder/scaffold.js";
import { copyBaseTemplate } from "./base-copy.js";
import { detectPackageManager, type PackageManager } from "./detect-package-manager.js";
import { formatNextSteps, printNextSteps } from "./next-steps.js";
import { type ParsedArgs, parseArgs, withDefaults } from "./parse-args.js";
import { initGit, installDependencies } from "./post-scaffold.js";
import { writeProjectRecord } from "./project-record.js";
import { resolvePlanFragmentPaths } from "./resolve-plan-paths.js";
import { runCommand } from "./run-command.js";

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
  const parsed = parseArgs(argv);
  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      console.error(error);
    }
    console.error("");
    console.error("Nothing was written.");
    return 1;
  }

  const nonInteractive = parsed.yes || !process.stdout.isTTY;
  return nonInteractive ? runNonInteractive(parsed, env) : runInteractive(parsed, env);
}

async function runNonInteractive(parsed: ParsedArgs, env: NodeJS.ProcessEnv): Promise<number> {
  const projectName = parsed.projectName ?? "my-app";
  const targetDir = path.resolve(process.cwd(), projectName);

  console.log("create-rrstack");
  console.log("");

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    console.log(`"${projectName}" already exists and isn't empty — writing into it anyway.`);
  }

  const selections = withDefaults(parsed.selections);
  selections.extras = parsed.extras;

  const result = resolve(selections);
  if (isErrors(result)) {
    console.error("This combination of choices can't be resolved:");
    for (const error of result.errors) {
      console.error(`  - ${error.message}`);
    }
    console.error("");
    console.error("Nothing was written.");
    return 1;
  }
  const plan = result;

  console.log(
    formatPlanSummary(
      selections,
      plan.providers.map((provider) => provider.label),
    ),
  );
  console.log("");
  console.log("Scaffolding project...");

  await copyBaseTemplate(targetDir);
  const scaffoldResult = await scaffold(
    resolvePlanFragmentPaths(plan),
    targetDir,
    new NodeFileSystem(),
  );
  if (!scaffoldResult.ok) {
    console.error(scaffoldResult.error.message);
    console.error("The project may be partially written; fix the conflict above and re-run.");
    return 1;
  }

  await writeProjectRecord(targetDir, selections);
  console.log(`Project scaffolded at ${targetDir}`);

  const gitInitialized = parsed.noGit ? false : await initGit(targetDir, runCommand);
  if (!parsed.noGit) {
    console.log(gitInitialized ? "Initialized git." : "git init failed — skipping.");
  }

  let installed = false;
  if (!parsed.noInstall) {
    const pm = parsed.pm ?? detectPackageManager(env);
    console.log(`Installing dependencies with ${pm}...`);
    installed = await installDependencies(targetDir, pm, runCommand);
    if (!installed) {
      console.log("Install failed — run it yourself once you've looked into why.");
    }
  }

  console.log("");
  console.log(`Done! Your project is ready at ${targetDir}`);
  console.log("");
  console.log(formatNextSteps(plan, projectName, { installed, gitInitialized }));

  return 0;
}

async function runInteractive(parsed: ParsedArgs, env: NodeJS.ProcessEnv): Promise<number> {
  p.intro("create-rrstack");

  let projectName = parsed.projectName;
  if (projectName === undefined) {
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
    projectName = String(projectNameResult || "my-app");
  }
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

  const selections: Selections = { ...parsed.selections };

  if (selections.database === undefined) {
    const database = await p.select<ClackOption["value"]>({
      message: "Database",
      options: availableOptions(options("database", selections)),
    });
    if (p.isCancel(database)) {
      return cancelledWithNothingWritten();
    }
    selections.database = database;
  }

  if (selections.database === "postgres" && selections.postgresHost === undefined) {
    const host = await p.select<Selections["postgresHost"]>({
      message: "Postgres host",
      options: [
        { value: "neon", label: "Neon (hosted)" },
        { value: "supabase", label: "Supabase (hosted)" },
        { value: "docker", label: "Docker (local)" },
      ],
    });
    if (p.isCancel(host) || host === undefined) {
      return cancelledWithNothingWritten();
    }
    selections.postgresHost = host;
  }

  if (selections.database === "mongodb" && selections.mongoHost === undefined) {
    const host = await p.select<Selections["mongoHost"]>({
      message: "MongoDB host",
      options: [
        { value: "hosted", label: "Hosted (e.g. MongoDB Atlas)" },
        { value: "docker", label: "Docker (local)" },
      ],
    });
    if (p.isCancel(host) || host === undefined) {
      return cancelledWithNothingWritten();
    }
    selections.mongoHost = host;
  }

  if (selections.database === "convex") {
    // Ticket 012's documented decision: Convex is all-or-nothing across
    // database/auth/realtime, not three independently-combinable layers.
    // No ORM prompt at all (Convex's own client is the data layer), and
    // auth is pre-filled rather than asked — `resolve()` would reject any
    // other answer anyway (`rules.ts`'s `convex-is-all-or-nothing`), so
    // asking would only ever offer one real choice.
    selections.auth = "convex-auth";
    p.log.info(
      "Convex selected: skipping the ORM prompt (Convex's client is the data layer) " +
        'and using "Convex Auth" for auth — Convex bundles database, auth, and realtime together.',
    );
  } else {
    if (selections.orm === undefined) {
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
    }

    if (selections.auth === undefined) {
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
    }
  }

  if (selections.storage === undefined) {
    const storageChoices: ClackOption[] = [
      ...availableOptions(options("storage", selections)),
      { value: "none", label: "None" },
    ];
    const storage = await p.select<string>({ message: "Storage", options: storageChoices });
    if (p.isCancel(storage)) {
      return cancelledWithNothingWritten();
    }
    if (storage !== "none") {
      selections.storage = storage;
    }
  }

  if (selections.database === "convex") {
    // Already pre-filled by the Convex bundle (ticket 012) — asking would
    // only ever offer one real choice, same reasoning as skipping the
    // ORM/auth prompts above.
    p.log.info('Convex selected: skipping the realtime prompt — using "Convex Realtime".');
  } else if (selections.realtime === undefined) {
    const realtimeChoices: ClackOption[] = [
      ...availableOptions(options("realtime", selections)),
      { value: "none", label: "None" },
    ];
    const realtime = await p.select<string>({ message: "Realtime", options: realtimeChoices });
    if (p.isCancel(realtime)) {
      return cancelledWithNothingWritten();
    }
    if (realtime !== "none") {
      selections.realtime = realtime;
    }
  }

  // No interactive "Include the demo app?"/"Use shadcn?"/"Add a
  // docker-compose?" prompts: `--no-example`/`--shadcn`/`--docker` are
  // flag-only (ticket 016) — there's no prompt for them to skip, so
  // `parsed.extras` (defaults: demo on, shadcn/docker off) is simply the
  // final answer either way.
  selections.extras = parsed.extras;

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
  const scaffoldResult = await scaffold(
    resolvePlanFragmentPaths(plan),
    targetDir,
    new NodeFileSystem(),
  );

  if (!scaffoldResult.ok) {
    spinner.stop("Scaffold failed");
    p.log.error(scaffoldResult.error.message);
    p.outro("The project may be partially written; fix the conflict above and re-run.");
    return 1;
  }

  await writeProjectRecord(targetDir, selections);
  spinner.stop("Project scaffolded");

  let gitInitialized = false;
  if (!parsed.noGit) {
    const gitSpinner = p.spinner();
    gitSpinner.start("Initializing git");
    gitInitialized = await initGit(targetDir, runCommand);
    gitSpinner.stop(gitInitialized ? "Initialized git" : "git init failed — skipping");
  }

  let installed = false;
  if (!parsed.noInstall) {
    const pm: PackageManager = parsed.pm ?? detectPackageManager(env);
    const installSpinner = p.spinner();
    installSpinner.start(`Installing dependencies with ${pm}`);
    installed = await installDependencies(targetDir, pm, runCommand);
    installSpinner.stop(installed ? "Dependencies installed" : "Install failed — run it yourself");
  }

  p.outro(`Done! Your project is ready at ${targetDir}`);
  printNextSteps(plan, projectName, { installed, gitInitialized });

  return 0;
}

function formatPlanSummary(selections: Selections, providerLabels: readonly string[]): string {
  const lines = [
    `Database: ${selections.database ?? "none"}${selections.postgresHost ? ` (${selections.postgresHost})` : ""}${selections.mongoHost ? ` (${selections.mongoHost})` : ""}`,
    `ORM: ${selections.orm ?? "none"}`,
    `Auth: ${selections.auth ?? "none"}`,
    `Storage: ${selections.storage ?? "none"}`,
    `Realtime: ${selections.realtime ?? "none"}`,
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
