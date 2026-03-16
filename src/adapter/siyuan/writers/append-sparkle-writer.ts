import type { ControlledWriteReceipt } from "../../models/read-model.js";
import { hasText } from "../../../domain/support/helpers.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";
import { parseSparklePreview } from "../codecs/markdown-codec.js";
import { extractOperationIds } from "../support/operations.js";
import { buildAffectedObjects } from "./receipt.js";

export async function executeAppendSparkle(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  plan: WritePlan,
  parentID: string,
): Promise<ControlledWriteReceipt> {
  const result = await client.appendBlock({
    parentID,
    data: plan.content_preview.body,
  });
  const insertedIds = extractOperationIds(result);
  const sparkleId = insertedIds[0];

  if (hasText(sparkleId)) {
    const parsedSparkle = parseSparklePreview(plan.content_preview.body);
    await client.setBlockAttrs({
      id: sparkleId,
      attrs: {
        [config.sparkle_status_attr]: "captured",
        [config.sparkle_source_attr]: parsedSparkle?.source ?? "",
        [config.sparkle_glow_attr]: parsedSparkle?.glow ?? "",
        [config.sparkle_journal_date_attr]: plan.target_page.journal_date,
      },
    });
  }

  return {
    plan_id: plan.plan_id,
    summary: `已向 ${plan.target_page.journal_date} 的 Sparkles 节追加 1 条 Sparkle。`,
    affected_objects: buildAffectedObjects(plan, insertedIds, []),
  };
}
