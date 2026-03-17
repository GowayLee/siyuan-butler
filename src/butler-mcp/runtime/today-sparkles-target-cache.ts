import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { hasText, normalizeText } from "../../domain/support/helpers.js";

export interface TodaySparklesTargetSnapshot {
  journal_date: string;
  page_id: string;
  section_id: string;
  section_label?: string;
  updated_at: string;
}

export interface WriteTodaySparklesTargetSnapshot {
  journal_date: string;
  page_id: string;
  section_id: string;
  section_label?: string;
}

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isTodayJournalDate(journalDate: string): boolean {
  return journalDate === getTodayLocalDate();
}

async function deleteFileIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

export class TodaySparklesTargetCache {
  constructor(private readonly filePath: string) {}

  async read(
    journalDate: string,
  ): Promise<TodaySparklesTargetSnapshot | undefined> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<TodaySparklesTargetSnapshot>;

      if (parsed.journal_date !== getTodayLocalDate()) {
        await deleteFileIfExists(this.filePath);
        return undefined;
      }

      if (!isTodayJournalDate(journalDate)) {
        return undefined;
      }

      if (
        parsed.journal_date !== journalDate ||
        !hasText(parsed.page_id) ||
        !hasText(parsed.section_id)
      )
        return undefined;

      return {
        journal_date: parsed.journal_date,
        page_id: parsed.page_id,
        section_id: parsed.section_id,
        section_label: normalizeText(parsed.section_label),
        updated_at: parsed.updated_at ?? new Date().toISOString(),
      };
    } catch {
      return undefined;
    }
  }

  async write(input: WriteTodaySparklesTargetSnapshot): Promise<void> {
    if (
      !isTodayJournalDate(input.journal_date) ||
      !hasText(input.page_id) ||
      !hasText(input.section_id)
    )
      return;

    const snapshot: TodaySparklesTargetSnapshot = {
      journal_date: input.journal_date,
      page_id: input.page_id,
      section_id: input.section_id,
      section_label: normalizeText(input.section_label),
      updated_at: new Date().toISOString(),
    };

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(snapshot, null, 2), "utf8");
  }
}
