import type { ButlerReadModelPort } from "../../adapter/ports/contracts.js";
import type {
  JournalContextReadModel,
  SparkleRecordReadModel,
} from "../../adapter/models/read-model.js";
import {
  resolveDailyJournalTargetWorkflow,
  type ResolveDailyJournalTargetCapabilityInput,
  type ResolveDailyJournalTargetResult,
} from "../workflows/shared/resolve-daily-journal-target.js";

export type {
  ResolveDailyJournalTargetCapabilityInput,
  ResolveDailyJournalTargetResult,
} from "../workflows/shared/resolve-daily-journal-target.js";

export async function resolveDailyJournalTargetCapability(
  reader: ButlerReadModelPort,
  input: ResolveDailyJournalTargetCapabilityInput,
): Promise<ResolveDailyJournalTargetResult> {
  return resolveDailyJournalTargetWorkflow(reader, input);
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
