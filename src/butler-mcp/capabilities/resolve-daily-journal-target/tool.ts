import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { resolveDailyJournalTargetUseCase } from "../../../application/use-cases/resolve-daily-journal-target.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import { sectionKindSchema } from "../shared/schemas.js";
import { toToolResult } from "../shared/tool-result.js";

export const resolveDailyJournalTargetInputSchema = {
  journal_date: z.string(),
  section_kind: sectionKindSchema,
  section_label: z.string().optional(),
};

export async function handleResolveDailyJournalTarget(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_kind: "sparkles" | "journal-body";
    section_label?: string;
  },
) {
  const resolution = await resolveDailyJournalTargetUseCase(
    context.adapter,
    input,
  );

  return { resolution };
}

function presentResolveDailyJournalTargetResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已解析目标日志页与章节。", structuredContent);
}

export function registerResolveDailyJournalTargetTool(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
): void {
  server.registerTool(
    "resolve-daily-journal-target",
    {
      title: "解析日志目标 · resolve-daily-journal-target",
      description:
        "将 daily note 与目标 section 收敛为 Butler 可稳定追加的写入目标。",
      inputSchema: resolveDailyJournalTargetInputSchema,
    },
    async (input) =>
      presentResolveDailyJournalTargetResult(
        await handleResolveDailyJournalTarget(context, input),
      ),
  );
}
