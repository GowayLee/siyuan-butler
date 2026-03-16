import type { ButlerWritePort } from "../adapter/contracts.js";
import type { ControlledWriteReceipt } from "../adapter/read-model.js";
import type { ReviewResult } from "../domain/review-result.js";
import { reviewDecisionNeedsWritePlan } from "../domain/review-result.js";
import type { WritePlan } from "../domain/write-plan.js";

export function canExecuteReviewResult(
  reviewResult: ReviewResult,
  confirmationGranted = false,
): boolean {
  if (!reviewDecisionNeedsWritePlan(reviewResult.decision)) {
    return false;
  }

  if (reviewResult.decision === "ask_confirm") {
    return confirmationGranted;
  }

  return true;
}

export function requireExecutableWritePlan(
  reviewResult: ReviewResult,
  confirmationGranted = false,
): WritePlan {
  if (!reviewDecisionNeedsWritePlan(reviewResult.decision)) {
    throw new Error("当前 ReviewResult 未放行写入，不能进入受控执行。");
  }

  if (reviewResult.final_write_plan === undefined) {
    throw new Error("当前 ReviewResult 缺少 final_write_plan，不能进入受控执行。");
  }

  if (reviewResult.decision === "ask_confirm" && !confirmationGranted) {
    throw new Error("当前 WritePlan 仍需用户确认，不能提前执行。");
  }

  return reviewResult.final_write_plan;
}

export async function executeApprovedWritePlan(
  writer: ButlerWritePort,
  reviewResult: ReviewResult,
  confirmationGranted = false,
): Promise<ControlledWriteReceipt> {
  const writePlan = requireExecutableWritePlan(reviewResult, confirmationGranted);

  return writer.executeApprovedWritePlan(writePlan);
}
