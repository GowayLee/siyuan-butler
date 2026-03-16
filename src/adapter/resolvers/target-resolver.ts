import type {
  TargetPageRef,
  TargetSectionRef,
  WriteTargetHint,
} from "../../domain/value-objects/common.js";
import { normalizeText } from "../../domain/support/helpers.js";
import type {
  DailyJournalReadModel,
  JournalSectionReadModel,
} from "../models/read-model.js";

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

  if (!input.journal.page_exists) {
    blockedBy.push(`目标日志页 ${input.journal.journal_date} 尚不存在。`);
  }

  if (section === undefined || !section.exists) {
    blockedBy.push(`目标章节 ${input.section_kind} 尚不存在，暂不能形成稳定写入目标。`);
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

export function resolveTargetFromWriteHint(
  journal: DailyJournalReadModel,
  hint: WriteTargetHint,
): ResolvedDailyJournalTarget {
  const hintedJournalDate = hint.journal_date ?? journal.journal_date;
  const resolved = resolveDailyJournalTarget({
    journal: {
      ...journal,
      journal_date: hintedJournalDate,
      page_id: hintedJournalDate === journal.journal_date ? journal.page_id : undefined,
      page_exists: hintedJournalDate === journal.journal_date ? journal.page_exists : false,
      sparkles_section:
        hintedJournalDate === journal.journal_date ? journal.sparkles_section : undefined,
      journal_body_section:
        hintedJournalDate === journal.journal_date
          ? journal.journal_body_section
          : undefined,
    },
    section_kind: hint.section_kind,
    preferred_section_label: hint.section_label,
  });

  if (hint.journal_date !== undefined && hint.journal_date !== journal.journal_date) {
    return {
      ...resolved,
      blocked_by: [
        ...resolved.blocked_by,
        `当前 journal read-model 属于 ${journal.journal_date}，不能直接拿来定位 ${hint.journal_date} 的写入目标。`,
      ],
    };
  }

  return resolved;
}
