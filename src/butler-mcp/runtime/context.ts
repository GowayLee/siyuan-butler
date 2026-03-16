import type {
  ButlerReadModelPort,
  ButlerWritePort,
} from "../../adapter/ports/contracts.js";
import { createSiyuanButlerAdapterFromEnv } from "../../adapter/siyuan/adapter.js";

export interface ButlerMcpRuntimeContext {
  adapter: ButlerReadModelPort & ButlerWritePort;
}

export interface CreateButlerMcpRuntimeContextOptions {
  env?: NodeJS.ProcessEnv;
}

export function createButlerMcpRuntimeContext(
  options: CreateButlerMcpRuntimeContextOptions = {},
): ButlerMcpRuntimeContext {
  return {
    adapter: createSiyuanButlerAdapterFromEnv(options.env),
  };
}
