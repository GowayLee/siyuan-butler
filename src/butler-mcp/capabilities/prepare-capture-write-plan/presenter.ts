import { toToolResult } from "../shared/tool-result.js";

export function presentPrepareCaptureWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已将 SparkleDraft 收敛为待审查 WritePlan。", structuredContent);
}
