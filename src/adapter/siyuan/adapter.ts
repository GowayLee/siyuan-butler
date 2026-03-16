import type { ButlerReadModelPort, ReviewAwareWritePort } from "../ports/contracts.js";
import type {
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
  SparkleRecordReadModel,
} from "../models/read-model.js";
import { hasText } from "../../domain/support/helpers.js";
import { reviewDecisionNeedsWritePlan } from "../../domain/objects/review-result.js";
import type { ReviewResult } from "../../domain/objects/review-result.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import type { SiyuanButlerAdapterConfig } from "./config.js";
import { loadSiyuanButlerAdapterConfigFromEnv } from "./config.js";
import { SiyuanClient } from "./client.js";
import { readDailyJournal } from "./readers/daily-journal-reader.js";
import { readJournalContext } from "./readers/journal-context-reader.js";
import { readSparkleRecord } from "./readers/sparkle-record-reader.js";
import { executeAppendJournalEntry } from "./writers/append-journal-entry-writer.js";
import { executeAppendSparkle } from "./writers/append-sparkle-writer.js";

export class SiyuanButlerAdapter
  implements ButlerReadModelPort, ReviewAwareWritePort
{
  readonly client: SiyuanClient;

  readonly config: SiyuanButlerAdapterConfig;

  constructor(config: SiyuanButlerAdapterConfig, client?: SiyuanClient) {
    this.config = config;
    this.client = client ?? new SiyuanClient(config);
  }

  async readDailyJournal(journal_date: string): Promise<DailyJournalReadModel> {
    return readDailyJournal(this.client, this.config, journal_date);
  }

  async readSparkleRecord(
    sparkle_id: string,
  ): Promise<SparkleRecordReadModel | undefined> {
    return readSparkleRecord(this.client, this.config, sparkle_id);
  }

  async readJournalContext(input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  }): Promise<JournalContextReadModel> {
    return readJournalContext(this.client, this.config, input);
  }

  async executeApprovedWritePlan(
    plan: WritePlan,
  ): Promise<ControlledWriteReceipt> {
    const parentID = this.requireAppendParent(plan);

    switch (plan.operation_type) {
      case "append-sparkle":
        return executeAppendSparkle(this.client, this.config, plan, parentID);
      case "append-journal-entry":
        return executeAppendJournalEntry(this.client, this.config, plan, parentID);
      default:
        throw new Error(
          `SiyuanButlerAdapter 暂不支持执行 ${plan.operation_type}。`,
        );
    }
  }

  async executeFromReview(
    review_result: ReviewResult,
    confirmation_granted = false,
  ): Promise<ControlledWriteReceipt> {
    if (!reviewDecisionNeedsWritePlan(review_result.decision)) {
      throw new Error("当前 ReviewResult 未放行写入，不能进入 adapter 执行。");
    }

    if (review_result.final_write_plan === undefined) {
      throw new Error("当前 ReviewResult 缺少 final_write_plan。");
    }

    if (review_result.decision === "ask_confirm" && !confirmation_granted) {
      throw new Error("当前 WritePlan 仍需用户确认，不能提前执行。");
    }

    return this.executeApprovedWritePlan(review_result.final_write_plan);
  }

  private requireAppendParent(plan: WritePlan): string {
    const parentId = plan.target_section.section_id ?? plan.target_page.page_id;

    if (!hasText(parentId)) {
      throw new Error("当前 WritePlan 缺少可追加的 parent id，不能执行思源写入。");
    }

    return parentId;
  }
}

export function createSiyuanButlerAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SiyuanButlerAdapter {
  return new SiyuanButlerAdapter(loadSiyuanButlerAdapterConfigFromEnv(env));
}
