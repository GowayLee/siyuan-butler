import { executeReviewedWritePlanCapability } from "../../../application/services/controlled-write-service.js";
import type { AffectedObjectRef } from "../../../adapter/models/read-model.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { reviewTokenSchema } from "../shared/schemas.js";
import type { z } from "zod";

function findAffectedObject(
  affectedObjects: AffectedObjectRef[],
  objectType: AffectedObjectRef["object_type"],
): AffectedObjectRef | undefined {
  return affectedObjects.find(
    (objectRef) => objectRef.object_type === objectType,
  );
}

export async function handleExecuteReviewedWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    review_token: z.infer<typeof reviewTokenSchema>;
    confirmation_granted?: boolean;
  },
) {
  const reviewResult = await context.handoffStore.loadReview(
    input.review_token,
  );
  const receipt = await executeReviewedWritePlanCapability(context.adapter, {
    review_result: reviewResult,
    confirmation_granted: input.confirmation_granted,
  });
  const writePlan = reviewResult.final_write_plan;
  const pageRef = findAffectedObject(receipt.affected_objects, "daily-note");
  const sectionRef = findAffectedObject(receipt.affected_objects, "section");
  const sparkleRef = findAffectedObject(receipt.affected_objects, "sparkle");
  const repairedSection = receipt.section_repaired === true;

  if (
    writePlan?.operation_type === "append-sparkle" &&
    pageRef?.object_id !== undefined &&
    sectionRef?.object_id !== undefined
  ) {
    await context.todaySparklesTargetCache.write({
      journal_date: writePlan.target_page.journal_date,
      page_id: pageRef.object_id,
      section_id: sectionRef.object_id,
      section_label: writePlan.target_section.section_label,
    });
  }

  return {
    journal_date: writePlan?.target_page.journal_date,
    page_id: pageRef?.object_id,
    section_id: sectionRef?.object_id,
    sparkle_block_id: sparkleRef?.object_id,
    repaired_section: repairedSection,
    next_action: "done",
  };
}
