import { join } from "node:path";

import type {
  ButlerReadModelPort,
  ButlerWritePort,
} from "../../adapter/ports/contracts.js";
import { createSiyuanButlerAdapterFromEnv } from "../../adapter/siyuan/adapter.js";
import { resolveButlerCacheRoot } from "./cache-root.js";
import { FileHandoffStore } from "./handoff-store.js";
import { TodaySparklesTargetCache } from "./today-sparkles-target-cache.js";

export interface ButlerMcpRuntimeContext {
  adapter: ButlerReadModelPort & ButlerWritePort;
  handoffStore: FileHandoffStore;
  todaySparklesTargetCache: TodaySparklesTargetCache;
}

export interface CreateButlerMcpRuntimeContextOptions {
  env?: NodeJS.ProcessEnv;
}

export function createButlerMcpRuntimeContext(
  options: CreateButlerMcpRuntimeContextOptions = {},
): ButlerMcpRuntimeContext {
  const cacheRoot = resolveButlerCacheRoot(options.env);

  return {
    adapter: createSiyuanButlerAdapterFromEnv(options.env),
    handoffStore: new FileHandoffStore(join(cacheRoot, "handoff")),
    todaySparklesTargetCache: new TodaySparklesTargetCache(
      join(cacheRoot, "today-sparkles-target.json"),
    ),
  };
}
