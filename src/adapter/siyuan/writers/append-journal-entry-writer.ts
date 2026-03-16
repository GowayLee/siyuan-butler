import type { ControlledWriteReceipt } from "../../models/read-model.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";
import { renderJournalEntryMarkdown } from "../codecs/markdown-codec.js";
import { extractOperationIds } from "../support/operations.js";
import { applyBackwriteActions } from "./backwrite-writer.js";
import { buildAffectedObjects } from "./receipt.js";

export async function executeAppendJournalEntry(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  plan: WritePlan,
  parentID: string,
): Promise<ControlledWriteReceipt> {
  const markdown = renderJournalEntryMarkdown(
    plan.content_preview.title,
    plan.content_preview.body,
  );
  const result = await client.appendBlock({
    parentID,
    data: markdown,
  });
  const insertedIds = extractOperationIds(result);
  const journalEntryId = insertedIds[0];
  const backwriteTargets = await applyBackwriteActions(
    client,
    config,
    plan,
    journalEntryId,
  );

  return {
    plan_id: plan.plan_id,
    summary:
      backwriteTargets.length > 0
        ? `已写入正式条目，并完成 ${backwriteTargets.length} 项 Sparkle 回写。`
        : "已写入正式条目。",
    affected_objects: buildAffectedObjects(plan, insertedIds, backwriteTargets),
  };
}
