import type { ControlledWriteReceipt } from "../../models/read-model.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanClient } from "../client.js";
import { renderJournalEntryMarkdown } from "../codecs/markdown-codec.js";
import { extractOperationIds } from "../support/operations.js";
import { buildAffectedObjects } from "./receipt.js";

export async function executeAppendJournalEntry(
  client: SiyuanClient,
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

  return {
    plan_id: plan.plan_id,
    summary: "已写入正式条目。",
    affected_objects: buildAffectedObjects(plan, insertedIds, []),
  };
}
