import type { AffectedObjectRef } from "../../models/read-model.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";

export function buildAffectedObjects(
  plan: WritePlan,
  insertedIds: string[],
  backwriteIds: string[],
): AffectedObjectRef[] {
  const insertedObjects: AffectedObjectRef[] = insertedIds.map((id) => ({
    object_type:
      plan.operation_type === "append-sparkle" ? "sparkle" : "journal-entry",
    object_id: id,
  }));
  const backwriteObjects: AffectedObjectRef[] = backwriteIds.map((id) => ({
    object_type: "sparkle",
    object_id: id,
    note: "backwrite",
  }));

  return [
    {
      object_type: "daily-note",
      object_id: plan.target_page.page_id,
      note: plan.target_page.journal_date,
    },
    {
      object_type: "section",
      object_id: plan.target_section.section_id,
      note: plan.target_section.section_label ?? plan.target_section.section_kind,
    },
    ...insertedObjects,
    ...backwriteObjects,
  ];
}
