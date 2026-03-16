import { createReviewResultFromWritePlan } from "../../domain/policies/policy-guard.js";
import type { ReviewResult } from "../../domain/objects/review-result.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";

export function reviewWritePlanCapability(write_plan: WritePlan): ReviewResult {
  return createReviewResultFromWritePlan(write_plan);
}
