import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { listButlerCapabilities } from "../../application/index.js";
import { registerReadCapabilities } from "./register-read-capabilities.js";
import { registerWriteCapabilities } from "./register-write-capabilities.js";
import {
  createButlerMcpRuntimeContext,
  type CreateButlerMcpRuntimeContextOptions,
} from "../runtime/context.js";

export interface RegisterButlerCapabilityToolsOptions
  extends CreateButlerMcpRuntimeContextOptions {}

export function registerButlerCapabilityTools(
  server: McpServer,
  options: RegisterButlerCapabilityToolsOptions = {},
): void {
  const context = createButlerMcpRuntimeContext(options);
  const capabilityIds = new Set(
    listButlerCapabilities().map((item) => item.capability_id),
  );

  registerReadCapabilities(server, context, capabilityIds);
  registerWriteCapabilities(server, context, capabilityIds);
}
