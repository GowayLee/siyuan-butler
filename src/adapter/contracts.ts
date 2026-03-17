import type { WritePlan } from "../domain/objects/write-plan.js";
import type {
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
} from "./read-models.js";

export interface ButlerReadModelPort {
  readDailyJournal(journal_date: string): Promise<DailyJournalReadModel>;
  readJournalContext(input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  }): Promise<JournalContextReadModel>;
}

export interface ButlerWritePort {
  executeApprovedWritePlan(plan: WritePlan): Promise<ControlledWriteReceipt>;
}
