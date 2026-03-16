import { toToolResult } from "../shared/tool-result.js";

export function presentExecuteReviewedWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已执行审查放行后的写入计划。", structuredContent);
}
