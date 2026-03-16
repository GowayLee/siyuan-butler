import type { ButlerReadModelPort, ButlerWritePort } from "../adapter/contracts.js";
import type {
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
  SparkleRecordReadModel,
} from "../adapter/read-model.js";
import { resolveDailyJournalTarget } from "../adapter/target-resolver.js";
import type { TargetSectionRef } from "../domain/common.js";
import { createReviewResultFromWritePlan } from "../domain/policy-guard.js";
import type { ReviewResult } from "../domain/review-result.js";
import type { RekindleProposal } from "../domain/rekindle-proposal.js";
import type { SparkleDraft } from "../domain/sparkle-draft.js";
import type { WritePlan } from "../domain/write-plan.js";
import { executeApprovedWritePlan } from "./controlled-write.js";
import { prepareCaptureWritePlan } from "./capture-use-case.js";
import { prepareRekindleWritePlan } from "./rekindle-use-case.js";

export interface ResolveDailyJournalTargetCapabilityInput {
  journal_date: string;
  section_kind: TargetSectionRef["section_kind"];
  section_label?: string;
}

export interface ResolveDailyJournalTargetResult {
  journal: DailyJournalReadModel;
  target_page: WritePlan["target_page"];
  target_section: WritePlan["target_section"];
  blocked_by: string[];
}

export interface PrepareCaptureWritePlanInput {
  plan_id: string;
  draft: SparkleDraft;
  journal_date: string;
  section_label?: string;
  scope_note?: string;
}

export interface PrepareRekindleWritePlanInput {
  plan_id: string;
  proposal: RekindleProposal;
  journal_date: string;
  scope_note?: string;
}

export async function resolveDailyJournalTargetCapability(
  reader: ButlerReadModelPort,
  input: ResolveDailyJournalTargetCapabilityInput,
): Promise<ResolveDailyJournalTargetResult> {
  const journal = await reader.readDailyJournal(input.journal_date);
  const resolved = resolveDailyJournalTarget({
    journal,
    section_kind: input.section_kind,
    preferred_section_label: input.section_label,
  });

  return {
    journal,
    target_page: resolved.target_page,
    target_section: resolved.target_section,
    blocked_by: resolved.blocked_by,
  };
}

export async function readSparkleRecordCapability(
  reader: ButlerReadModelPort,
  sparkle_id: string,
): Promise<SparkleRecordReadModel | undefined> {
  return reader.readSparkleRecord(sparkle_id);
}

export async function readJournalContextCapability(
  reader: ButlerReadModelPort,
  input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  },
): Promise<JournalContextReadModel> {
  return reader.readJournalContext(input);
}

export async function prepareCaptureWritePlanCapability(
  reader: ButlerReadModelPort,
  input: PrepareCaptureWritePlanInput,
): Promise<WritePlan> {
  const journal = await reader.readDailyJournal(input.journal_date);

  return prepareCaptureWritePlan({
    plan_id: input.plan_id,
    draft: input.draft,
    journal,
    section_label: input.section_label,
    scope_note: input.scope_note,
  }).write_plan;
}

export async function prepareRekindleWritePlanCapability(
  reader: ButlerReadModelPort,
  input: PrepareRekindleWritePlanInput,
): Promise<WritePlan> {
  const journal = await reader.readDailyJournal(input.journal_date);

  return prepareRekindleWritePlan({
    plan_id: input.plan_id,
    proposal: input.proposal,
    journal,
    scope_note: input.scope_note,
  }).write_plan;
}

export function reviewWritePlanCapability(write_plan: WritePlan): ReviewResult {
  return createReviewResultFromWritePlan(write_plan);
}

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
