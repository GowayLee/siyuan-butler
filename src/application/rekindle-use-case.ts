import type { DailyJournalReadModel } from "../adapter/read-model.js";
import { resolveTargetFromWriteHint } from "../adapter/target-resolver.js";
import type { ReviewResult } from "../domain/review-result.js";
import type { RekindleProposal } from "../domain/rekindle-proposal.js";
import { createReviewResultFromWritePlan } from "../domain/policy-guard.js";
import { createRekindleWritePlan } from "../domain/write-plan-builders.js";
import { normalizeWritePlan } from "../domain/write-plan.js";
import type { WritePlan } from "../domain/write-plan.js";

export interface PrepareRekindleForReviewOptions {
  plan_id: string;
  proposal: RekindleProposal;
  journal: DailyJournalReadModel;
  scope_note?: string;
}

export interface RekindleReviewPreparation {
  proposal: RekindleProposal;
  write_plan: WritePlan;
  review_result: ReviewResult;
}

export function prepareRekindleForReview(
  options: PrepareRekindleForReviewOptions,
): RekindleReviewPreparation {
  const target = resolveTargetFromWriteHint(options.journal, options.proposal.write_target);

  const basePlan = createRekindleWritePlan({
    plan_id: options.plan_id,
    proposal: options.proposal,
    target_page: target.target_page,
    target_section: target.target_section,
    scope_note: options.scope_note,
  });

  const writePlan = normalizeWritePlan({
    ...basePlan,
    blocked_by: [...(basePlan.blocked_by ?? []), ...target.blocked_by],
  });

  return {
    proposal: options.proposal,
    write_plan: writePlan,
    review_result: createReviewResultFromWritePlan(writePlan),
  };
}
