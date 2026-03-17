import { reviewWritePlanCapability } from "../../../application/services/review-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { planTokenSchema } from "../shared/schemas.js";
import type { z } from "zod";

export async function handleReviewWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    plan_token: z.infer<typeof planTokenSchema>;
  },
) {
  const writePlan = await context.handoffStore.loadPlan(input.plan_token);
  const reviewResult = reviewWritePlanCapability(writePlan);
  const needsConfirmation = reviewResult.decision === "ask_confirm";
  const nextAction =
    reviewResult.decision === "allow"
      ? "execute"
      : reviewResult.decision === "ask_confirm"
        ? "ask-user-confirmation"
        : "stop";
  const blockedBy =
    nextAction === "stop"
      ? writePlan.blocked_by && writePlan.blocked_by.length > 0
        ? writePlan.blocked_by
        : [reviewResult.reason]
      : undefined;
  const reviewToken =
    reviewResult.decision === "allow" || reviewResult.decision === "ask_confirm"
      ? await context.handoffStore.saveReview(reviewResult)
      : undefined;

  await context.handoffStore.deletePlan(input.plan_token);

  return {
    decision: reviewResult.decision,
    review_token: reviewToken,
    needs_confirmation: needsConfirmation,
    confirm_scope: reviewResult.confirm_scope,
    blocked_by: blockedBy,
    next_action: nextAction,
  };
}
