import { toToolResult } from "../shared/tool-result.js";

export function presentReviewWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已完成 WritePlan 审查。", structuredContent);
}
