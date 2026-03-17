import type {
  TargetPageRef,
  TargetSectionRef,
} from "../../domain/value-objects/common.js";
import { normalizeText } from "../../domain/support/helpers.js";
import type {
  DailyJournalReadModel,
  JournalSectionReadModel,
} from "../../adapter/read-models.js";

export interface ResolveDailyJournalTargetInput {
  journal: DailyJournalReadModel;
  section_kind: TargetSectionRef["section_kind"];
  preferred_section_label?: string;
}

export interface ResolvedDailyJournalTarget {
  target_page: TargetPageRef;
  target_section: TargetSectionRef;
  blocked_by: string[];
}

function selectJournalSection(
  journal: DailyJournalReadModel,
  sectionKind: TargetSectionRef["section_kind"],
): JournalSectionReadModel | undefined {
  return sectionKind === "sparkles"
    ? journal.sparkles_section
    : journal.journal_body_section;
}

export function resolveDailyJournalTarget(
  input: ResolveDailyJournalTargetInput,
): ResolvedDailyJournalTarget {
  const section = selectJournalSection(input.journal, input.section_kind);
  const blockedBy: string[] = [];
  const canRepairMissingSparklesSection =
    input.section_kind === "sparkles" && input.journal.page_exists;

  if (!input.journal.page_exists) {
    blockedBy.push(`目标日志页 ${input.journal.journal_date} 尚不存在。`);
  }

  if (
    (section === undefined || !section.exists) &&
    !canRepairMissingSparklesSection
  ) {
    blockedBy.push(
      `目标章节 ${input.section_kind} 尚不存在，暂不能形成稳定写入目标。`,
    );
  }

  if (
    section !== undefined &&
    !section.exists &&
    canRepairMissingSparklesSection
  ) {
    return {
      target_page: {
        page_kind: "daily-note",
        journal_date: input.journal.journal_date,
        page_id: input.journal.page_id,
        notebook_hint: input.journal.notebook_hint ?? input.journal.notebook_id,
      },
      target_section: {
        section_kind: input.section_kind,
        section_id: undefined,
        section_label:
          normalizeText(input.preferred_section_label) ?? section.section_label,
        insertion_mode: "append",
      },
      blocked_by: blockedBy,
    };
  }

  if (section !== undefined && !section.append_supported) {
    blockedBy.push(`目标章节 ${input.section_kind} 当前不支持 append。`);
  }

  return {
    target_page: {
      page_kind: "daily-note",
      journal_date: input.journal.journal_date,
      page_id: input.journal.page_id,
      notebook_hint: input.journal.notebook_hint ?? input.journal.notebook_id,
    },
    target_section: {
      section_kind: input.section_kind,
      section_id: section?.section_id,
      section_label:
        normalizeText(input.preferred_section_label) ?? section?.section_label,
      insertion_mode: "append",
    },
    blocked_by: blockedBy,
  };
}
