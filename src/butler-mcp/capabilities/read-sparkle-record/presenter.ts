import { toToolResult } from "../shared/tool-result.js";

export function presentReadSparkleRecordResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    structuredContent.sparkle_record === undefined
      ? "未找到可复燃的 Sparkle 记录。"
      : "已读取 Sparkle 记录。",
    structuredContent,
  );
}
