import { toToolResult } from "../shared/tool-result.js";

export function presentPrepareRekindleWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    "已将 RekindleProposal 收敛为待审查 WritePlan。",
    structuredContent,
  );
}
