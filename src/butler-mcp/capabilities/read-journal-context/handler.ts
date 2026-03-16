import { readJournalContextCapability } from "../../../application/services/daily-journal-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";

export async function handleReadJournalContext(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  },
) {
  const journal_context = await readJournalContextCapability(context.adapter, input);

  return { journal_context };
}
