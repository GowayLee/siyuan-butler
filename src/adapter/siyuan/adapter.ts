import type { ButlerReadModelPort, ButlerWritePort } from "../contracts.js";
import type {
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
} from "../read-models.js";
import { hasText } from "../../domain/support/helpers.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import type { SiyuanButlerAdapterConfig } from "./config.js";
import { loadSiyuanButlerAdapterConfigFromEnv } from "./config.js";
import { SiyuanClient } from "./client.js";
import { readDailyJournal } from "./readers/daily-journal-reader.js";
import { readJournalContext } from "./readers/journal-context-reader.js";
import { executeAppendJournalEntry } from "./writers/append-journal-entry-writer.js";
import { executeAppendSparkle } from "./writers/append-sparkle-writer.js";

export class SiyuanButlerAdapter
  implements ButlerReadModelPort, ButlerWritePort
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

  async readJournalContext(input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  }): Promise<JournalContextReadModel> {
    return readJournalContext(this.client, this.config, input);
  }

  async executeApprovedWritePlan(
    plan: WritePlan,
  ): Promise<ControlledWriteReceipt> {
    switch (plan.operation_type) {
      case "append-sparkle":
        return executeAppendSparkle(this.client, plan);
      case "append-journal-entry":
        return executeAppendJournalEntry(
          this.client,
          plan,
          this.requireAppendParent(plan),
        );
      default:
        throw new Error(
          `SiyuanButlerAdapter 暂不支持执行 ${plan.operation_type}。`,
        );
    }
  }

  private requireAppendParent(plan: WritePlan): string {
    const parentId = plan.target_section.section_id ?? plan.target_page.page_id;

    if (!hasText(parentId)) {
      throw new Error(
        "当前 WritePlan 缺少可追加的 parent id，不能执行思源写入。",
      );
    }

    return parentId;
  }
}

export function createSiyuanButlerAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SiyuanButlerAdapter {
  return new SiyuanButlerAdapter(loadSiyuanButlerAdapterConfigFromEnv(env));
}
