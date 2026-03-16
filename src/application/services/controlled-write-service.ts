import type { ButlerWritePort } from "../../adapter/ports/contracts.js";
import type { ControlledWriteReceipt } from "../../adapter/models/read-model.js";
import type { ReviewResult } from "../../domain/objects/review-result.js";
import { executeApprovedWritePlan } from "../workflows/review/controlled-write.js";

export async function executeReviewedWritePlanCapability(
  writer: ButlerWritePort,
  input: {
    review_result: ReviewResult;
    confirmation_granted?: boolean;
  },
): Promise<ControlledWriteReceipt> {
  return executeApprovedWritePlan(
    writer,
    input.review_result,
    input.confirmation_granted ?? false,
  );
}
