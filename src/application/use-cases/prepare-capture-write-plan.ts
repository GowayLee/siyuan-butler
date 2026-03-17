import type { ButlerReadModelPort } from "../../adapter/contracts.js";
import type { DailyJournalReadModel } from "../../adapter/read-models.js";
import { hasText } from "../../domain/support/helpers.js";
import type { SparkleDraft } from "../../domain/objects/sparkle-draft.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import { normalizeWritePlan } from "../../domain/objects/write-plan.js";
import { createCaptureWritePlan } from "../../domain/builders/write-plan-builders.js";
import { resolveDailyJournalTarget } from "../shared/target-resolution.js";

export interface PrepareCaptureWritePlanInput {
  plan_id: string;
  draft: SparkleDraft;
  journal_date: string;
  section_label?: string;
  scope_note?: string;
}

export interface TodaySparklesTargetSnapshot {
  journal_date: string;
  page_id: string;
  section_id: string;
  section_label?: string;
}

export interface TodaySparklesTargetCachePort {
  read(journal_date: string): Promise<TodaySparklesTargetSnapshot | undefined>;
  write(snapshot: TodaySparklesTargetSnapshot): Promise<void>;
}

function createDailyJournalFromTodaySparklesTarget(
  snapshot: TodaySparklesTargetSnapshot,
): DailyJournalReadModel {
  return {
    journal_date: snapshot.journal_date,
    page_id: snapshot.page_id,
    page_exists: true,
    sparkles_section: {
      section_kind: "sparkles",
      section_id: snapshot.section_id,
      section_label: snapshot.section_label,
      exists: true,
      append_supported: true,
    },
  };
}

export async function prepareCaptureWritePlanUseCase(
  reader: ButlerReadModelPort,
  input: PrepareCaptureWritePlanInput,
  options: {
    today_sparkles_target_cache?: TodaySparklesTargetCachePort;
  } = {},
): Promise<WritePlan> {
  const cachedTarget = await options.today_sparkles_target_cache?.read(
    input.journal_date,
  );
  const journal =
    cachedTarget !== undefined
      ? createDailyJournalFromTodaySparklesTarget(cachedTarget)
      : await reader.readDailyJournal(input.journal_date);

  if (
    cachedTarget === undefined &&
    hasText(journal.page_id) &&
    hasText(journal.sparkles_section?.section_id)
  ) {
    await options.today_sparkles_target_cache?.write({
      journal_date: journal.journal_date,
      page_id: journal.page_id,
      section_id: journal.sparkles_section.section_id,
      section_label: journal.sparkles_section.section_label,
    });
  }

  const target = resolveDailyJournalTarget({
    journal,
    section_kind: "sparkles",
    preferred_section_label: input.section_label,
  });
  const basePlan = createCaptureWritePlan({
    plan_id: input.plan_id,
    draft: input.draft,
    target_page: target.target_page,
    target_section: target.target_section,
    scope_note: input.scope_note,
  });

  return normalizeWritePlan({
    ...basePlan,
    blocked_by: [...(basePlan.blocked_by ?? []), ...target.blocked_by],
  });
}
