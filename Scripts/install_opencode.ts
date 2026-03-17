import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";

type InstallMode = "copy" | "symlink";
type DefaultChoice = "y" | "n";

interface CliOptions {
  baseDir: string | "";
  mode: InstallMode | "";
  force: boolean;
  backupConfig: boolean;
}

interface InstallerPaths {
  repoRoot: string;
  skillsSourceDir: string;
  defaultMcpEntry: string;
}

type EnvironmentMap = Record<string, string>;

class UsageError extends Error {}

class Prompter {
  readonly #readline = createInterface({ input: stdin, output: stdout });

  async prompt(text: string, defaultValue = ""): Promise<string> {
    const suffix = defaultValue.length > 0 ? ` [${defaultValue}]: ` : ": ";
    const reply = await this.#readline.question(`${text}${suffix}`);
    return reply.length > 0 ? reply : defaultValue;
  }

  async promptYesNo(
    text: string,
    defaultValue: DefaultChoice = "n",
  ): Promise<boolean> {
    const label = defaultValue === "y" ? "Y/n" : "y/N";
    const reply = (await this.#readline.question(`${text} [${label}]: `))
      .trim()
      .toLowerCase();
    const effectiveReply = reply.length > 0 ? reply : defaultValue;
    return effectiveReply === "y" || effectiveReply === "yes";
  }

  async requireNonEmpty(text: string, defaultValue = ""): Promise<string> {
    while (true) {
      const value = await this.prompt(text, defaultValue);
      if (value.length > 0) {
        return value;
      }

      process.stderr.write("This value is required.\n");
    }
  }

  async chooseInstallMode(
    currentMode: CliOptions["mode"],
  ): Promise<InstallMode> {
    if (currentMode === "copy" || currentMode === "symlink") {
      return currentMode;
    }

    stdout.write("\nSkill install mode\n");
    stdout.write("- copy: create standalone copies under ~/.opencode/skills\n");
    stdout.write("- symlink: point OpenCode at this repo's skill folders\n");
    stdout.write(
      "- copy is safer for one-off installs; symlink is better while iterating on skills\n\n",
    );

    while (true) {
      const value = (await this.prompt("Install mode (copy/symlink)", "copy"))
        .trim()
        .toLowerCase();

      if (value === "copy" || value === "symlink") {
        return value;
      }

      process.stderr.write("Please enter 'copy' or 'symlink'.\n");
    }
  }

  async chooseBaseDir(currentBaseDir: CliOptions["baseDir"]): Promise<string> {
    if (currentBaseDir.length > 0) {
      return resolveExistingDirectory(currentBaseDir);
    }

    const defaultBaseDir = process.env.HOME ?? ".";

    stdout.write("\nOpenCode base directory\n");
    stdout.write(
      "- The installer will create or update <base-dir>/.opencode\n",
    );
    stdout.write("- Use your home directory for the usual per-user setup\n");
    stdout.write(
      "- Pick another directory only if you intentionally keep a separate OpenCode profile\n\n",
    );

    while (true) {
      const value = await this.requireNonEmpty(
        "Base directory for .opencode",
        defaultBaseDir,
      );

      try {
        return resolveExistingDirectory(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
      }
    }
  }

  close(): void {
    this.#readline.close();
  }
}

function printUsage(): void {
  stdout.write(
    `Usage:\n  npm run install:opencode -- [options]\n  Scripts/install_opencode.sh [options]\n\nOptions:\n  --base-dir PATH   Base directory that will contain .opencode (prompted interactively by default)\n  --mode MODE       Skill install mode: copy or symlink\n  --force           Replace existing installed skill folders without prompting\n  --no-backup       Do not create a .bak copy before updating opencode.json\n  --help            Show this help message\n`,
  );
}

function parseArgs(argv: string[]): CliOptions | null {
  const options: CliOptions = {
    baseDir: "",
    mode: "",
    force: false,
    backupConfig: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--base-dir": {
        const value = argv[index + 1];
        if (value === undefined) {
          throw new UsageError("Error: --base-dir requires a value");
        }
        options.baseDir = value;
        index += 1;
        break;
      }
      case "--mode": {
        const value = argv[index + 1];
        if (value === undefined) {
          throw new UsageError("Error: --mode requires a value");
        }
        if (value !== "copy" && value !== "symlink") {
          throw new UsageError("Error: install mode must be copy or symlink");
        }
        options.mode = value;
        index += 1;
        break;
      }
      case "--force":
        options.force = true;
        break;
      case "--no-backup":
        options.backupConfig = false;
        break;
      case "--help":
        return null;
      default:
        throw new UsageError(`Error: unknown argument: ${arg}`);
    }
  }

  return options;
}

function expandHomeDirectory(pathValue: string): string {
  if (!pathValue.startsWith("~")) {
    return pathValue;
  }

  const home = process.env.HOME;
  if (home === undefined) {
    return pathValue;
  }

  return pathValue === "~" ? home : join(home, pathValue.slice(2));
}

function resolveExistingDirectory(pathValue: string): string {
  const expandedPath = expandHomeDirectory(pathValue);
  const resolvedPath = realpathSync(resolve(expandedPath));

  if (!statSync(resolvedPath).isDirectory()) {
    throw new Error(`Expected directory: ${resolvedPath}`);
  }

  return resolvedPath;
}

function pathExists(pathValue: string): boolean {
  try {
    lstatSync(pathValue);
    return true;
  } catch {
    return false;
  }
}

function removeExistingPath(pathValue: string): void {
  if (!pathExists(pathValue)) {
    return;
  }

  rmSync(pathValue, { recursive: true, force: true });
}

function discoverSkillDirs(skillsSourceDir: string): string[] {
  const entries = readdirSync(skillsSourceDir, { withFileTypes: true });
  const skillDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(skillsSourceDir, entry.name))
    .filter((entryPath) => existsSync(join(entryPath, "SKILL.md")));

  if (skillDirs.length === 0) {
    throw new Error(
      `Error: no skill packages with SKILL.md found under ${skillsSourceDir}`,
    );
  }

  return skillDirs;
}

function formatCommand(command: readonly string[]): string {
  return command
    .map((part) => (/[\s"]/u.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

function createDefaultMcpCommand(paths: InstallerPaths): string[] {
  return ["node", paths.defaultMcpEntry];
}

async function collectCommand(
  prompter: Prompter,
  defaultCommand: string[],
): Promise<string[]> {
  if (
    await prompter.promptYesNo(
      `Use default MCP command: ${formatCommand(defaultCommand)}?`,
      "y",
    )
  ) {
    return [...defaultCommand];
  }

  const command = [await prompter.requireNonEmpty("MCP command executable")];

  while (await prompter.promptYesNo("Add a command argument?", "y")) {
    command.push(await prompter.requireNonEmpty("Command argument"));
  }

  return command;
}

async function collectEnvironment(prompter: Prompter): Promise<EnvironmentMap> {
  const environment: EnvironmentMap = {};

  stdout.write("\nMCP environment setup\n");
  stdout.write("- SIYUAN_NOTEBOOK is required.\n");
  stdout.write(
    "- Connection can use SIYUAN_URL, or SIYUAN_HOST + SIYUAN_PORT.\n",
  );
  stdout.write("- Leave optional prompts empty to keep Butler defaults.\n");
  stdout.write(
    "- Section labels should match the actual daily-note headings used in SiYuan.\n\n",
  );

  if (
    await prompter.promptYesNo(
      "Use SIYUAN_URL instead of SIYUAN_HOST/SIYUAN_PORT?",
      "y",
    )
  ) {
    environment.SIYUAN_URL = await prompter.requireNonEmpty(
      "SIYUAN_URL",
      "http://127.0.0.1:6806",
    );
  } else {
    environment.SIYUAN_HOST = await prompter.requireNonEmpty(
      "SIYUAN_HOST",
      "127.0.0.1",
    );
    environment.SIYUAN_PORT = await prompter.requireNonEmpty(
      "SIYUAN_PORT",
      "6806",
    );
  }

  const token = await prompter.prompt("SIYUAN_TOKEN (optional)");
  if (token.length > 0) {
    environment.SIYUAN_TOKEN = token;
  }

  environment.SIYUAN_NOTEBOOK =
    await prompter.requireNonEmpty("SIYUAN_NOTEBOOK");

  const dailyTemplate = await prompter.prompt(
    "SIYUAN_DAILY_NOTE_HPATH_TEMPLATE (optional; default: /{{year}}/{{month}}/{{date}})",
  );
  if (dailyTemplate.length > 0) {
    environment.SIYUAN_DAILY_NOTE_HPATH_TEMPLATE = dailyTemplate;
  }

  const sparklesLabel = await prompter.prompt(
    "SIYUAN_SPARKLES_SECTION_LABEL (optional; heading text for Sparkles, default: Sparkles)",
  );
  if (sparklesLabel.length > 0) {
    environment.SIYUAN_SPARKLES_SECTION_LABEL = sparklesLabel;
  }

  const journalLabel = await prompter.prompt(
    "SIYUAN_JOURNAL_BODY_SECTION_LABEL (optional; heading text for Journal Body, default: Journal Body)",
  );
  if (journalLabel.length > 0) {
    environment.SIYUAN_JOURNAL_BODY_SECTION_LABEL = journalLabel;
  }

  return environment;
}

function readConfigFile(configPath: string): Record<string, unknown> {
  if (!existsSync(configPath)) {
    return {};
  }

  const raw = readFileSync(configPath, "utf8");
  if (raw.trim().length === 0) {
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Expected top-level JSON object in ${configPath}`);
  }

  return parsed as Record<string, unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function updateOpencodeConfig(
  configPath: string,
  command: readonly string[],
  environment: EnvironmentMap,
  backupConfig: boolean,
): void {
  if (backupConfig && existsSync(configPath)) {
    copyFileSync(configPath, `${configPath}.bak`);
    stdout.write(`Backed up existing config to ${configPath}.bak\n`);
  }

  const data = readConfigFile(configPath);
  const mcp = isPlainObject(data.mcp) ? data.mcp : {};

  data.$schema = "https://opencode.ai/config.json";
  data.mcp = mcp;
  mcp["siyuan-butler"] = {
    type: "local",
    command: [...command],
    enabled: true,
    environment: { ...environment },
  };

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function installSkills(
  skillDirs: readonly string[],
  skillsTargetDir: string,
  mode: InstallMode,
  force: boolean,
  prompter: Prompter,
): Promise<string[]> {
  const results: string[] = [];

  for (const skillDir of skillDirs) {
    const skillName = skillDir.slice(skillDir.lastIndexOf("/") + 1);
    const destination = join(skillsTargetDir, skillName);

    if (pathExists(destination)) {
      if (!force) {
        const shouldReplace = await prompter.promptYesNo(
          `Skill '${skillName}' already exists at ${destination}. Replace it?`,
          "n",
        );

        if (!shouldReplace) {
          results.push(`${skillName}: skipped`);
          continue;
        }
      }

      removeExistingPath(destination);
    }

    if (mode === "copy") {
      cpSync(skillDir, destination, { recursive: true });
      results.push(`${skillName}: copied`);
      continue;
    }

    symlinkSync(skillDir, destination, "dir");
    results.push(`${skillName}: symlinked`);
  }

  return results;
}

async function run(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, "..");
  const paths: InstallerPaths = {
    repoRoot,
    skillsSourceDir: join(repoRoot, "skills"),
    defaultMcpEntry: join(repoRoot, "dist", "butler-mcp", "main.js"),
  };

  const parsedArgs = parseArgs(process.argv.slice(2));
  if (parsedArgs === null) {
    printUsage();
    return;
  }

  const prompter = new Prompter();

  try {
    const baseDir = await prompter.chooseBaseDir(parsedArgs.baseDir);
    const opencodeDir = join(baseDir, ".opencode");
    const skillsTargetDir = join(opencodeDir, "skills");
    const configPath = join(opencodeDir, "opencode.json");
    const mode = await prompter.chooseInstallMode(parsedArgs.mode);
    const defaultMcpCommand = createDefaultMcpCommand(paths);
    const command = await collectCommand(prompter, defaultMcpCommand);

    if (
      formatCommand(command) === formatCommand(defaultMcpCommand) &&
      !existsSync(paths.defaultMcpEntry)
    ) {
      stdout.write(
        "Warning: default MCP entry does not exist yet. Run 'npm run build' before starting OpenCode.\n",
      );
    }

    const environment = await collectEnvironment(prompter);
    const skillDirs = discoverSkillDirs(paths.skillsSourceDir);

    stdout.write("\nInstall summary\n");
    stdout.write(` - Repository root: ${paths.repoRoot}\n`);
    stdout.write(` - OpenCode dir:    ${opencodeDir}\n`);
    stdout.write(` - Skills dir:      ${skillsTargetDir}\n`);
    stdout.write(` - Config path:     ${configPath}\n`);
    stdout.write(` - Skill mode:      ${mode}\n`);
    stdout.write(` - MCP command:     ${formatCommand(command)}\n`);
    stdout.write(
      ` - Environment keys: ${Object.keys(environment).join(" ")}\n`,
    );

    if (!(await prompter.promptYesNo("Continue with installation?", "y"))) {
      stdout.write("Installation cancelled.\n");
      return;
    }

    mkdirSync(skillsTargetDir, { recursive: true });
    const installResults = await installSkills(
      skillDirs,
      skillsTargetDir,
      mode,
      parsedArgs.force,
      prompter,
    );

    updateOpencodeConfig(
      configPath,
      command,
      environment,
      parsedArgs.backupConfig,
    );

    stdout.write("\nDone.\n");
    for (const result of installResults) {
      stdout.write(` - ${result}\n`);
    }
    stdout.write(` - opencode.json updated: ${configPath}\n`);

    if (formatCommand(command) === formatCommand(defaultMcpCommand)) {
      stdout.write(" - Default MCP command points to the built dist entry.\n");
      stdout.write(" - If needed, rebuild with: npm run build\n");
    }
  } finally {
    prompter.close();
  }
}

await run().catch((error: unknown) => {
  const message =
    error instanceof UsageError
      ? error.message
      : error instanceof Error
        ? (error.stack ?? error.message)
        : String(error);

  process.stderr.write(`${message}\n`);
  if (error instanceof UsageError) {
    printUsage();
  }
  process.exitCode = 1;
});
