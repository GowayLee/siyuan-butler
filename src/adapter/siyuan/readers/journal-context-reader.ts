import type { JournalContextReadModel } from "../../models/read-model.js";
import { hasText } from "../../../domain/support/helpers.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";
import { extractFirstMeaningfulLine } from "../codecs/markdown-codec.js";
import { readDailyJournal } from "./daily-journal-reader.js";

export async function readJournalContext(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  },
): Promise<JournalContextReadModel> {
  const journal = await readDailyJournal(client, config, input.journal_date);

  if (!journal.page_exists || !hasText(journal.page_id)) {
    return {
      journal_date: input.journal_date,
      section_kind: input.section_kind,
      summary_lines: [`日志页 ${input.journal_date} 尚不存在。`],
    };
  }

  const targetSection =
    input.section_kind === "sparkles"
      ? journal.sparkles_section
      : input.section_kind === "journal-body"
        ? journal.journal_body_section
        : undefined;

  if (targetSection !== undefined && !hasText(targetSection.section_id)) {
    return {
      journal_date: input.journal_date,
      page_id: journal.page_id,
      section_kind: input.section_kind,
      summary_lines: [`目标章节 ${input.section_kind} 尚不存在。`],
    };
  }

  if (targetSection !== undefined && hasText(targetSection.section_id)) {
    const childBlocks = await client.getChildBlocks(targetSection.section_id);
    const previewBlocks = childBlocks.slice(0, 3);
    const previewLines = await Promise.all(
      previewBlocks.map(async (block) => {
        const kramdown = await client.getBlockKramdown(block.id);
        return extractFirstMeaningfulLine(kramdown.kramdown) ?? `[${block.type}]`;
      }),
    );

    return {
      journal_date: input.journal_date,
      page_id: journal.page_id,
      section_kind: input.section_kind,
      summary_lines:
        previewLines.length > 0
          ? previewLines
          : [`章节 ${targetSection.section_label ?? input.section_kind} 目前为空。`],
      related_block_ids: previewBlocks.map((block) => block.id),
    };
  }

  return {
    journal_date: input.journal_date,
    page_id: journal.page_id,
    summary_lines: [
      journal.sparkles_section?.exists
        ? `已找到章节 ${journal.sparkles_section.section_label ?? "sparkles"}`
        : `未找到章节 ${config.sparkles_section_label}`,
      journal.journal_body_section?.exists
        ? `已找到章节 ${journal.journal_body_section.section_label ?? "journal-body"}`
        : `未找到章节 ${config.journal_body_section_label}`,
    ],
  };
}
