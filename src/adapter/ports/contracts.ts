import type { ReviewResult } from "../../domain/objects/review-result.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import type {
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
} from "../models/read-model.js";

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

export interface ReviewAwareWritePort extends ButlerWritePort {
  executeFromReview(
    review_result: ReviewResult,
    confirmation_granted?: boolean,
  ): Promise<ControlledWriteReceipt>;
}
