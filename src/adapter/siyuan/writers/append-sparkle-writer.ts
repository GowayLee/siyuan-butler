import type { ControlledWriteReceipt } from "../../models/read-model.js";
import { hasText } from "../../../domain/support/helpers.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanClient } from "../client.js";
import { extractOperationIds } from "../support/operations.js";
import { buildAffectedObjects } from "./receipt.js";

function renderSparklesHeadingMarkdown(sectionLabel: string): string {
  return `## ${sectionLabel}`;
}

async function ensureSparklesSection(
  client: SiyuanClient,
  plan: WritePlan,
): Promise<{ section_id: string; section_note?: string }> {
  if (hasText(plan.target_section.section_id)) {
    return { section_id: plan.target_section.section_id };
  }

  if (!hasText(plan.target_page.page_id)) {
    throw new Error(
      "当前 Sparkle 写入缺少日志页 page_id，无法补建 Sparkles 标题。",
    );
  }

  const sectionLabel = plan.target_section.section_label ?? "Sparkles";
  const headingResult = await client.appendBlock({
    parentID: plan.target_page.page_id,
    data: renderSparklesHeadingMarkdown(sectionLabel),
  });
  const headingIds = extractOperationIds(headingResult);
  const headingId = headingIds[0];

  if (!hasText(headingId)) {
    throw new Error(
      "补建 Sparkles 标题后未拿到标题块 ID，无法继续写入 Sparkle。",
    );
  }

  await client.setBlockAttrs({
    id: headingId,
    attrs: { "custom-daily-note-flow": "sparkle" },
  });

  return {
    section_id: headingId,
    section_note: `${sectionLabel} (auto-created)`,
  };
}

export async function executeAppendSparkle(
  client: SiyuanClient,
  plan: WritePlan,
): Promise<ControlledWriteReceipt> {
  const { section_id, section_note } = await ensureSparklesSection(
    client,
    plan,
  );
  const result = await client.appendBlock({
    parentID: section_id,
    data: plan.content_preview.body,
  });
  const insertedIds = extractOperationIds(result);
  const repairedSummary =
    section_note !== undefined ? "，并补建了 Sparkles 标题" : "";

  return {
    plan_id: plan.plan_id,
    summary: `已向 ${plan.target_page.journal_date} 的 Sparkles 节追加 1 条 Sparkle${repairedSummary}。`,
    affected_objects: buildAffectedObjects(plan, insertedIds, [], {
      section_id,
      section_note,
    }),
  };
}
