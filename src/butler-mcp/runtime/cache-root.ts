import { join, resolve } from "node:path";

const CACHE_DIR_ENV = "SIYUAN_BUTLER_CACHE_DIR";

// Cache state belongs to the current agent/skill host working directory by
// default, not to the Butler source repository location. This keeps
// prepare/review/execute handoff files aligned with the host session that is
// actually invoking the MCP tools. Use SIYUAN_BUTLER_CACHE_DIR only when the
// host needs to pin a different shared cache root explicitly.
export function resolveButlerCacheRoot(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicitCacheDir = env[CACHE_DIR_ENV]?.trim();

  if (explicitCacheDir !== undefined && explicitCacheDir.length > 0)
    return resolve(explicitCacheDir);

  return join(process.cwd(), ".cache", "siyuan-butler");
}
