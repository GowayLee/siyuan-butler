import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { listButlerCapabilities } from "../application/index.js";
import {
  createButlerMcpRuntimeContext,
  type CreateButlerMcpRuntimeContextOptions,
} from "./runtime/context.js";
import { registerExecuteReviewedWritePlanTool } from "./capabilities/execute-reviewed-write-plan/tool.js";
import { registerPrepareCaptureWritePlanTool } from "./capabilities/prepare-capture-write-plan/tool.js";
import { registerReadJournalContextTool } from "./capabilities/read-journal-context/tool.js";
import { registerResolveDailyJournalTargetTool } from "./capabilities/resolve-daily-journal-target/tool.js";
import { registerReviewWritePlanTool } from "./capabilities/review-write-plan/tool.js";

export interface RegisterButlerCapabilityToolsOptions extends CreateButlerMcpRuntimeContextOptions {}

export function registerButlerCapabilityTools(
  server: McpServer,
  options: RegisterButlerCapabilityToolsOptions = {},
): void {
  const context = createButlerMcpRuntimeContext(options);
  const capabilityIds = new Set(
    listButlerCapabilities().map((item) => item.capability_id),
  );

  if (capabilityIds.has("resolve-daily-journal-target")) {
    registerResolveDailyJournalTargetTool(server, context);
  }

  if (capabilityIds.has("read-journal-context")) {
    registerReadJournalContextTool(server, context);
  }

  if (capabilityIds.has("prepare-capture-write-plan")) {
    registerPrepareCaptureWritePlanTool(server, context);
  }

  if (capabilityIds.has("review-write-plan")) {
    registerReviewWritePlanTool(server, context);
  }

  if (capabilityIds.has("execute-reviewed-write-plan")) {
    registerExecuteReviewedWritePlanTool(server, context);
  }
}
