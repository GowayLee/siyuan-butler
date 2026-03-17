import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export function presentExecuteReviewedWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    buildKeyValueToolText(
      [],
      [
        ["journal_date", structuredContent.journal_date],
        ["page_id", structuredContent.page_id],
        ["section_id", structuredContent.section_id],
        ["sparkle_block_id", structuredContent.sparkle_block_id],
        ["repaired_section", structuredContent.repaired_section],
        ["next_action", structuredContent.next_action],
      ],
    ),
    structuredContent,
  );
}
