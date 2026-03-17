import type { ButlerReadModelPort } from "../../adapter/contracts.js";
import type { JournalContextReadModel } from "../../adapter/read-models.js";

export interface ReadJournalContextInput {
  journal_date: string;
  section_kind?: "sparkles" | "journal-body";
}

export async function readJournalContextUseCase(
  reader: ButlerReadModelPort,
  input: ReadJournalContextInput,
): Promise<JournalContextReadModel> {
  return reader.readJournalContext(input);
}
