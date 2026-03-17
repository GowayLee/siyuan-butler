import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { readJournalContextUseCase } from "../../../application/use-cases/read-journal-context.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import { sectionKindSchema } from "../shared/schemas.js";
import { toToolResult } from "../shared/tool-result.js";

export const readJournalContextInputSchema = {
  journal_date: z.string(),
  section_kind: sectionKindSchema.optional(),
};

export async function handleReadJournalContext(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  },
) {
  const journal_context = await readJournalContextUseCase(
    context.adapter,
    input,
  );

  return { journal_context };
}

function presentReadJournalContextResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已读取日志上下文。", structuredContent);
}

export function registerReadJournalContextTool(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
): void {
  server.registerTool(
    "read-journal-context",
    {
      title: "读取日志上下文 · read-journal-context",
      description:
        "读取 Butler 在 workflow 收敛时所需的最小 daily-note context 切片。",
      inputSchema: readJournalContextInputSchema,
    },
    async (input) =>
      presentReadJournalContextResult(
        await handleReadJournalContext(context, input),
      ),
  );
}
