import { resolveDailyJournalTargetCapability } from "../../../application/services/daily-journal-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";

export async function handleResolveDailyJournalTarget(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_kind: "sparkles" | "journal-body";
    section_label?: string;
  },
) {
  const resolution = await resolveDailyJournalTargetCapability(context.adapter, input);

  return { resolution };
}
