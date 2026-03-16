import type {
  DailyJournalReadModel,
  JournalSectionReadModel,
} from "../../models/read-model.js";
import { hasText } from "../../../domain/support/helpers.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";
import {
  extractHeadingLabel,
  normalizeSectionLabel,
} from "../codecs/markdown-codec.js";
import { buildDailyNoteHPath } from "../support/journal-path.js";

function createMissingSection(
  section_kind: "sparkles" | "journal-body",
  section_label: string,
): JournalSectionReadModel {
  return {
    section_kind,
    section_label,
    exists: false,
    append_supported: false,
  };
}

function matchSection(
  section_kind: "sparkles" | "journal-body",
  expectedLabel: string,
  headings: Array<{ id: string; label: string | undefined }>,
): JournalSectionReadModel {
  const matched = headings.find(
    (heading) =>
      hasText(heading.label) &&
      normalizeSectionLabel(heading.label) ===
        normalizeSectionLabel(expectedLabel),
  );

  if (matched === undefined || !hasText(matched.label)) {
    return createMissingSection(section_kind, expectedLabel);
  }

  return {
    section_kind,
    section_id: matched.id,
    section_label: matched.label,
    exists: true,
    append_supported: true,
  };
}

export async function readDailyJournal(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  journal_date: string,
): Promise<DailyJournalReadModel> {
  const pageIds = await client.getIDsByHPath(
    buildDailyNoteHPath(config.daily_note_hpath_template, journal_date),
    config.notebook,
  );
  const pageId = pageIds[0];

  if (!hasText(pageId)) {
    return {
      journal_date,
      notebook_id: config.notebook,
      notebook_hint: config.notebook,
      page_exists: false,
      sparkles_section: createMissingSection(
        "sparkles",
        config.sparkles_section_label,
      ),
      journal_body_section: createMissingSection(
        "journal-body",
        config.journal_body_section_label,
      ),
    };
  }

  const childBlocks = await client.getChildBlocks(pageId);
  const headings = await Promise.all(
    childBlocks
      .filter((block) => block.type === "h")
      .map(async (block) => ({
        id: block.id,
        label: extractHeadingLabel(
          (await client.getBlockKramdown(block.id)).kramdown,
        ),
      })),
  );

  return {
    journal_date,
    page_id: pageId,
    notebook_id: config.notebook,
    notebook_hint: config.notebook,
    page_exists: true,
    sparkles_section: matchSection(
      "sparkles",
      config.sparkles_section_label,
      headings,
    ),
    journal_body_section: matchSection(
      "journal-body",
      config.journal_body_section_label,
      headings,
    ),
  };
}
