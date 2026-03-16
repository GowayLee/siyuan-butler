import { readSparkleRecordCapability } from "../../../application/services/daily-journal-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";

export async function handleReadSparkleRecord(
  context: ButlerMcpRuntimeContext,
  input: { sparkle_id: string },
) {
  const sparkle_record = await readSparkleRecordCapability(
    context.adapter,
    input.sparkle_id,
  );

  return { sparkle_record };
}
