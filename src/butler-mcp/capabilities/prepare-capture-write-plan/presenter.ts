import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export function presentPrepareCaptureWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  const nextAction = structuredContent.next_action;

  return toToolResult(
    buildKeyValueToolText(
      [
        nextAction === "review"
          ? "已生成 plan token，可进入 review。"
          : "已生成 plan token，但当前计划仍有阻塞项。",
      ],
      [
        ["plan_token", structuredContent.plan_token],
        ["journal_date", structuredContent.journal_date],
        ["next_action", structuredContent.next_action],
        ["blocked_by", structuredContent.blocked_by],
      ],
    ),
    structuredContent,
  );
}
