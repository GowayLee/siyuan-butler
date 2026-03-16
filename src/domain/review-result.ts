import type {
  DowngradeTarget,
  RejectCode,
  ReviewCheck,
  ReviewDecision,
} from "./common.js";
import { hasText, normalizeText } from "./helpers.js";
import type { WritePlan } from "./write-plan.js";
import { canWritePlanEnterReview, normalizeWritePlan } from "./write-plan.js";

export interface ReviewResult {
  decision: ReviewDecision;
  reason: string;
  review_summary: string;
  user_prompt?: string;
  final_write_plan?: WritePlan;
  downgrade_to?: DowngradeTarget;
  downgrade_note?: string;
  reject_code?: RejectCode;
  confirm_scope?: string;
  review_checks?: ReviewCheck[];
}

export function reviewDecisionNeedsWritePlan(
  decision: ReviewDecision,
): boolean {
  return decision === "allow" || decision === "ask_confirm";
}

export function normalizeReviewResult(result: ReviewResult): ReviewResult {
  return {
    ...result,
    reason: result.reason.trim(),
    review_summary: result.review_summary.trim(),
    user_prompt: normalizeText(result.user_prompt),
    downgrade_note: normalizeText(result.downgrade_note),
    confirm_scope: normalizeText(result.confirm_scope),
    final_write_plan: result.final_write_plan
      ? normalizeWritePlan(result.final_write_plan)
      : undefined,
    review_checks: result.review_checks?.map((check) => ({
      ...check,
      note: normalizeText(check.note),
    })),
  };
}

export function isReviewResultCoherent(result: ReviewResult): boolean {
  if (!hasText(result.reason) || !hasText(result.review_summary)) return false;

  if (reviewDecisionNeedsWritePlan(result.decision))
    return (
      result.final_write_plan !== undefined &&
      canWritePlanEnterReview(result.final_write_plan)
    );

  if (result.decision === "downgrade") return result.downgrade_to !== undefined;

  if (result.decision === "reject") return result.reject_code !== undefined;

  return false;
}
