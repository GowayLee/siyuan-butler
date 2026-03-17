import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export function presentReviewWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    buildKeyValueToolText(
      [],
      [
        ["decision", structuredContent.decision],
        ["review_token", structuredContent.review_token],
        ["needs_confirmation", structuredContent.needs_confirmation],
        ["confirm_scope", structuredContent.confirm_scope],
        ["next_action", structuredContent.next_action],
        ["blocked_by", structuredContent.blocked_by],
      ],
    ),
    structuredContent,
  );
}
