import type { DailyJournalReadModel } from "../../../adapter/models/read-model.js";
import { resolveTargetFromWriteHint } from "../../../adapter/resolvers/target-resolver.js";
import { createReviewResultFromWritePlan } from "../../../domain/policies/policy-guard.js";
import type { ReviewResult } from "../../../domain/objects/review-result.js";
import type { RekindleProposal } from "../../../domain/objects/rekindle-proposal.js";
import { createRekindleWritePlan } from "../../../domain/builders/write-plan-builders.js";
import { normalizeWritePlan } from "../../../domain/objects/write-plan.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";

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

export interface RekindleWritePlanPreparation {
  proposal: RekindleProposal;
  journal: DailyJournalReadModel;
  write_plan: WritePlan;
}

export interface PrepareRekindleWritePlanOptions {
  plan_id: string;
  proposal: RekindleProposal;
  journal: DailyJournalReadModel;
  scope_note?: string;
}

export function prepareRekindleWritePlan(
  options: PrepareRekindleWritePlanOptions,
): RekindleWritePlanPreparation {
  const target = resolveTargetFromWriteHint(options.journal, options.proposal.write_target);

  const basePlan = createRekindleWritePlan({
    plan_id: options.plan_id,
    proposal: options.proposal,
    target_page: target.target_page,
    target_section: target.target_section,
    scope_note: options.scope_note,
  });

  return {
    proposal: options.proposal,
    journal: options.journal,
    write_plan: normalizeWritePlan({
      ...basePlan,
      blocked_by: [...(basePlan.blocked_by ?? []), ...target.blocked_by],
    }),
  };
}

export function prepareRekindleForReview(
  options: PrepareRekindleForReviewOptions,
): RekindleReviewPreparation {
  const prepared = prepareRekindleWritePlan(options);

  return {
    proposal: prepared.proposal,
    write_plan: prepared.write_plan,
    review_result: createReviewResultFromWritePlan(prepared.write_plan),
  };
}
