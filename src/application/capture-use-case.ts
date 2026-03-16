import type { DailyJournalReadModel } from "../adapter/read-model.js";
import { resolveDailyJournalTarget } from "../adapter/target-resolver.js";
import type { ReviewResult } from "../domain/review-result.js";
import type { SparkleDraft } from "../domain/sparkle-draft.js";
import { createReviewResultFromWritePlan } from "../domain/policy-guard.js";
import { createCaptureWritePlan } from "../domain/write-plan-builders.js";
import { normalizeWritePlan } from "../domain/write-plan.js";
import type { WritePlan } from "../domain/write-plan.js";

export interface PrepareCaptureForReviewOptions {
  plan_id: string;
  draft: SparkleDraft;
  journal: DailyJournalReadModel;
  section_label?: string;
  scope_note?: string;
}

export interface CaptureReviewPreparation {
  draft: SparkleDraft;
  write_plan: WritePlan;
  review_result: ReviewResult;
}

export interface CaptureWritePlanPreparation {
  draft: SparkleDraft;
  journal: DailyJournalReadModel;
  write_plan: WritePlan;
}

export interface PrepareCaptureWritePlanOptions {
  plan_id: string;
  draft: SparkleDraft;
  journal: DailyJournalReadModel;
  section_label?: string;
  scope_note?: string;
}

export function prepareCaptureWritePlan(
  options: PrepareCaptureWritePlanOptions,
): CaptureWritePlanPreparation {
  const target = resolveDailyJournalTarget({
    journal: options.journal,
    section_kind: "sparkles",
    preferred_section_label: options.section_label,
  });

  const basePlan = createCaptureWritePlan({
    plan_id: options.plan_id,
    draft: options.draft,
    target_page: target.target_page,
    target_section: target.target_section,
    scope_note: options.scope_note,
  });

  return {
    draft: options.draft,
    journal: options.journal,
    write_plan: normalizeWritePlan({
      ...basePlan,
      blocked_by: [...(basePlan.blocked_by ?? []), ...target.blocked_by],
    }),
  };
}

export function prepareCaptureForReview(
  options: PrepareCaptureForReviewOptions,
): CaptureReviewPreparation {
  const prepared = prepareCaptureWritePlan(options);

  return {
    draft: prepared.draft,
    write_plan: prepared.write_plan,
    review_result: createReviewResultFromWritePlan(prepared.write_plan),
  };
}
