import type { ControlledWriteReceipt } from "../../models/read-model.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanClient } from "../client.js";
import { extractOperationIds } from "../support/operations.js";
import { buildAffectedObjects } from "./receipt.js";

export async function executeAppendSparkle(
  client: SiyuanClient,
  plan: WritePlan,
  parentID: string,
): Promise<ControlledWriteReceipt> {
  const result = await client.appendBlock({
    parentID,
    data: plan.content_preview.body,
  });
  const insertedIds = extractOperationIds(result);

  return {
    plan_id: plan.plan_id,
    summary: `已向 ${plan.target_page.journal_date} 的 Sparkles 节追加 1 条 Sparkle。`,
    affected_objects: buildAffectedObjects(plan, insertedIds, []),
  };
}
