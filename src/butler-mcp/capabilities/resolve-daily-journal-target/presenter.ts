import { toToolResult } from "../shared/tool-result.js";

export function presentResolveDailyJournalTargetResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已解析目标日志页与章节。", structuredContent);
}
