import { toToolResult } from "../shared/tool-result.js";

export function presentReadJournalContextResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult("已读取日志上下文。", structuredContent);
}
