import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { ButlerMcpRuntimeContext } from "../runtime/context.js";
import { handleReadJournalContext } from "../capabilities/read-journal-context/handler.js";
import { presentReadJournalContextResult } from "../capabilities/read-journal-context/presenter.js";
import { readJournalContextInputSchema } from "../capabilities/read-journal-context/schema.js";
import { handleReadSparkleRecord } from "../capabilities/read-sparkle-record/handler.js";
import { presentReadSparkleRecordResult } from "../capabilities/read-sparkle-record/presenter.js";
import { readSparkleRecordInputSchema } from "../capabilities/read-sparkle-record/schema.js";
import { handleResolveDailyJournalTarget } from "../capabilities/resolve-daily-journal-target/handler.js";
import { presentResolveDailyJournalTargetResult } from "../capabilities/resolve-daily-journal-target/presenter.js";
import { resolveDailyJournalTargetInputSchema } from "../capabilities/resolve-daily-journal-target/schema.js";

export function registerReadCapabilities(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
  capabilityIds: Set<string>,
): void {
  if (capabilityIds.has("resolve-daily-journal-target")) {
    server.registerTool(
      "resolve-daily-journal-target",
      {
        title: "解析日志目标 · resolve-daily-journal-target",
        description: "将 daily note 与目标 section 收敛为 Butler 可稳定追加的写入目标。",
        inputSchema: resolveDailyJournalTargetInputSchema,
      },
      async (input) =>
        presentResolveDailyJournalTargetResult(
          await handleResolveDailyJournalTarget(context, input),
        ),
    );
  }

  if (capabilityIds.has("read-sparkle-record")) {
    server.registerTool(
      "read-sparkle-record",
      {
        title: "读取 Sparkle 记录 · read-sparkle-record",
        description: "读取 rekindle 流程所需的最小 Sparkle snapshot 与状态信息。",
        inputSchema: readSparkleRecordInputSchema,
      },
      async (input) => presentReadSparkleRecordResult(await handleReadSparkleRecord(context, input)),
    );
  }

  if (capabilityIds.has("read-journal-context")) {
    server.registerTool(
      "read-journal-context",
      {
        title: "读取日志上下文 · read-journal-context",
        description: "读取 Butler 在 workflow 收敛时所需的最小 daily-note context 切片。",
        inputSchema: readJournalContextInputSchema,
      },
      async (input) =>
        presentReadJournalContextResult(await handleReadJournalContext(context, input)),
    );
  }
}
