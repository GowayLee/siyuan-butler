import type { ButlerReadModelPort, ReviewAwareWritePort } from "../contracts.js";
import type {
  AffectedObjectRef,
  ControlledWriteReceipt,
  DailyJournalReadModel,
  JournalContextReadModel,
  JournalSectionReadModel,
  SparkleRecordReadModel,
} from "../read-model.js";
import type { SparkleDraftStatus, SparkleSnapshot } from "../../domain/common.js";
import { reviewDecisionNeedsWritePlan } from "../../domain/review-result.js";
import type { ReviewResult } from "../../domain/review-result.js";
import type { WritePlan } from "../../domain/write-plan.js";
import { hasText, normalizeText, normalizeTextList } from "../../domain/helpers.js";
import type { SiyuanButlerAdapterConfig } from "./config.js";
import { loadSiyuanButlerAdapterConfigFromEnv } from "./config.js";
import { SiyuanClient } from "./client.js";
import type { SiyuanOperationBatch } from "./types.js";

function buildDailyNoteHPath(prefix: string, journalDate: string): string {
  if (prefix === "/") {
    return `/${journalDate}`;
  }

  return `${prefix}/${journalDate}`;
}

function normalizeSectionLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractHeadingLabel(kramdown: string): string | undefined {
  const firstLine = kramdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (firstLine === undefined || !firstLine.startsWith("#")) {
    return undefined;
  }

  return firstLine
    .replace(/^#+\s*/, "")
    .replace(/\s*\{:\s*id="[^"]+"\}\s*$/, "")
    .trim();
}

function extractFirstMeaningfulLine(markdown: string): string | undefined {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function parseJournalDateFromHPath(hpath: string | undefined): string | undefined {
  if (!hasText(hpath)) {
    return undefined;
  }

  const match = hpath.match(/\b\d{4}-\d{2}-\d{2}\b/);

  return match?.[0];
}

function toIsoTimestamp(value: string | undefined): string | undefined {
  if (!hasText(value) || value.length !== 14) {
    return undefined;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`;
}

function extractOperationIds(batches: SiyuanOperationBatch[]): string[] {
  return batches.flatMap((batch) =>
    (batch.doOperations ?? []).flatMap((operation) =>
      hasText(operation.id) ? [operation.id] : [],
    ),
  );
}

function parseSparklePreview(markdown: string): SparkleSnapshot | undefined {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const glowLine = lines.find((line) => /^[-*]\s+/.test(line));
  const glow = glowLine?.replace(/^[-*]\s+/, "").trim();

  const source = lines
    .find((line) => /^[-*]\s+source:\s*/i.test(line))
    ?.replace(/^[-*]\s+source:\s*/i, "")
    .trim();

  if (!hasText(source) || !hasText(glow)) {
    return undefined;
  }

  const traceLine = lines
    .find((line) => /^[-*]\s+trace:\s*/i.test(line))
    ?.replace(/^[-*]\s+trace:\s*/i, "");
  const pullLine = lines
    .find((line) => /^[-*]\s+pull:\s*/i.test(line))
    ?.replace(/^[-*]\s+pull:\s*/i, "");

  const trace = normalizeTextList(traceLine?.split("|").map((item) => item.trim()));
  const pull = normalizeTextList(pullLine?.split("|").map((item) => item.trim()));

  return {
    id: "",
    source,
    glow,
    trace,
    pull,
  };
}

function parseSparkleStatus(value: string | undefined): SparkleDraftStatus {
  switch (value) {
    case "draft":
    case "captured":
    case "needs_clarify":
    case "paused":
    case "rekindled":
    case "discarded":
      return value;
    default:
      return "captured";
  }
}

function renderJournalEntryMarkdown(title: string | undefined, body: string): string {
  const normalizedTitle = normalizeText(title);

  if (normalizedTitle === undefined) {
    return body.trim();
  }

  return `### ${normalizedTitle}\n\n${body.trim()}`;
}

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
    const pageIds = await this.client.getIDsByHPath(
      buildDailyNoteHPath(this.config.daily_note_hpath_prefix, journal_date),
      this.config.notebook,
    );
    const pageId = pageIds[0];

    if (!hasText(pageId)) {
      return {
        journal_date,
        notebook_id: this.config.notebook,
        notebook_hint: this.config.notebook,
        page_exists: false,
        sparkles_section: this.createMissingSection("sparkles", this.config.sparkles_section_label),
        journal_body_section: this.createMissingSection(
          "journal-body",
          this.config.journal_body_section_label,
        ),
      };
    }

    const childBlocks = await this.client.getChildBlocks(pageId);
    const headings = await Promise.all(
      childBlocks
        .filter((block) => block.type === "h")
        .map(async (block) => ({
          id: block.id,
          label: extractHeadingLabel((await this.client.getBlockKramdown(block.id)).kramdown),
        })),
    );

    return {
      journal_date,
      page_id: pageId,
      notebook_id: this.config.notebook,
      notebook_hint: this.config.notebook,
      page_exists: true,
      sparkles_section: this.matchSection(
        "sparkles",
        this.config.sparkles_section_label,
        headings,
      ),
      journal_body_section: this.matchSection(
        "journal-body",
        this.config.journal_body_section_label,
        headings,
      ),
    };
  }

  async readSparkleRecord(
    sparkle_id: string,
  ): Promise<SparkleRecordReadModel | undefined> {
    const [kramdown, attrs, hpath] = await Promise.all([
      this.client.getBlockKramdown(sparkle_id),
      this.client.getBlockAttrs(sparkle_id),
      this.client.getHPathByID(sparkle_id),
    ]);
    const parsedPreview = parseSparklePreview(kramdown.kramdown);
    const source = normalizeText(attrs[this.config.sparkle_source_attr]) ?? parsedPreview?.source;
    const glow = normalizeText(attrs[this.config.sparkle_glow_attr]) ?? parsedPreview?.glow;

    if (!hasText(source) || !hasText(glow)) {
      return undefined;
    }

    return {
      id: sparkle_id,
      snapshot: {
        id: sparkle_id,
        source,
        glow,
        trace: parsedPreview?.trace,
        pull: parsedPreview?.pull,
      },
      status: parseSparkleStatus(attrs[this.config.sparkle_status_attr]),
      journal_date:
        normalizeText(attrs[this.config.sparkle_journal_date_attr]) ??
        parseJournalDateFromHPath(hpath),
      block_id: sparkle_id,
      updated_at: toIsoTimestamp(attrs.updated),
    };
  }

  async readJournalContext(input: {
    journal_date: string;
    section_kind?: "sparkles" | "journal-body";
  }): Promise<JournalContextReadModel> {
    const journal = await this.readDailyJournal(input.journal_date);

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
      const childBlocks = await this.client.getChildBlocks(targetSection.section_id);
      const previewBlocks = childBlocks.slice(0, 3);
      const previewLines = await Promise.all(
        previewBlocks.map(async (block) => {
          const kramdown = await this.client.getBlockKramdown(block.id);
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
          : `未找到章节 ${this.config.sparkles_section_label}`,
        journal.journal_body_section?.exists
          ? `已找到章节 ${journal.journal_body_section.section_label ?? "journal-body"}`
          : `未找到章节 ${this.config.journal_body_section_label}`,
      ],
    };
  }

  async executeApprovedWritePlan(
    plan: WritePlan,
  ): Promise<ControlledWriteReceipt> {
    switch (plan.operation_type) {
      case "append-sparkle":
        return this.executeAppendSparkle(plan);
      case "append-journal-entry":
        return this.executeAppendJournalEntry(plan);
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

  private createMissingSection(
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

  private matchSection(
    section_kind: "sparkles" | "journal-body",
    expectedLabel: string,
    headings: Array<{ id: string; label: string | undefined }>,
  ): JournalSectionReadModel {
    const matched = headings.find(
      (heading) =>
        hasText(heading.label) &&
        normalizeSectionLabel(heading.label) === normalizeSectionLabel(expectedLabel),
    );

    if (matched === undefined || !hasText(matched.label)) {
      return this.createMissingSection(section_kind, expectedLabel);
    }

    return {
      section_kind,
      section_id: matched.id,
      section_label: matched.label,
      exists: true,
      append_supported: true,
    };
  }

  private requireAppendParent(plan: WritePlan): string {
    const parentId = plan.target_section.section_id ?? plan.target_page.page_id;

    if (!hasText(parentId)) {
      throw new Error("当前 WritePlan 缺少可追加的 parent id，不能执行思源写入。");
    }

    return parentId;
  }

  private async executeAppendSparkle(
    plan: WritePlan,
  ): Promise<ControlledWriteReceipt> {
    const parentID = this.requireAppendParent(plan);
    const result = await this.client.appendBlock({
      parentID,
      data: plan.content_preview.body,
    });
    const insertedIds = extractOperationIds(result);
    const sparkleId = insertedIds[0];

    if (hasText(sparkleId)) {
      const parsedSparkle = parseSparklePreview(plan.content_preview.body);
      await this.client.setBlockAttrs({
        id: sparkleId,
        attrs: {
          [this.config.sparkle_status_attr]: "captured",
          [this.config.sparkle_source_attr]: parsedSparkle?.source ?? "",
          [this.config.sparkle_glow_attr]: parsedSparkle?.glow ?? "",
          [this.config.sparkle_journal_date_attr]: plan.target_page.journal_date,
        },
      });
    }

    return {
      plan_id: plan.plan_id,
      summary: `已向 ${plan.target_page.journal_date} 的 Sparkles 节追加 1 条 Sparkle。`,
      affected_objects: this.buildAffectedObjects(plan, insertedIds, []),
    };
  }

  private async executeAppendJournalEntry(
    plan: WritePlan,
  ): Promise<ControlledWriteReceipt> {
    const parentID = this.requireAppendParent(plan);
    const markdown = renderJournalEntryMarkdown(
      plan.content_preview.title,
      plan.content_preview.body,
    );
    const result = await this.client.appendBlock({
      parentID,
      data: markdown,
    });
    const insertedIds = extractOperationIds(result);
    const journalEntryId = insertedIds[0];
    const backwriteTargets = await this.applyBackwriteActions(plan, journalEntryId);

    return {
      plan_id: plan.plan_id,
      summary:
        backwriteTargets.length > 0
          ? `已写入正式条目，并完成 ${backwriteTargets.length} 项 Sparkle 回写。`
          : "已写入正式条目。",
      affected_objects: this.buildAffectedObjects(plan, insertedIds, backwriteTargets),
    };
  }

  private async applyBackwriteActions(
    plan: WritePlan,
    journalEntryId: string | undefined,
  ): Promise<string[]> {
    const touchedIds: string[] = [];

    for (const action of plan.backwrite_actions ?? []) {
      if (!hasText(action.target_id)) {
        continue;
      }

      switch (action.action_type) {
        case "mark-rekindled":
          await this.client.setBlockAttrs({
            id: action.target_id,
            attrs: {
              [this.config.sparkle_status_attr]: "rekindled",
              [this.config.sparkle_journal_date_attr]: plan.target_page.journal_date,
              [this.config.sparkle_entry_ref_attr]: journalEntryId ?? "",
            },
          });
          touchedIds.push(action.target_id);
          break;
        default:
          throw new Error(
            `SiyuanButlerAdapter 暂不支持 backwrite action ${action.action_type}。`,
          );
      }
    }

    return touchedIds;
  }

  private buildAffectedObjects(
    plan: WritePlan,
    insertedIds: string[],
    backwriteIds: string[],
  ): AffectedObjectRef[] {
    const insertedObjects: AffectedObjectRef[] = insertedIds.map((id) => ({
      object_type:
        plan.operation_type === "append-sparkle" ? "sparkle" : "journal-entry",
      object_id: id,
    }));
    const backwriteObjects: AffectedObjectRef[] = backwriteIds.map((id) => ({
      object_type: "sparkle",
      object_id: id,
      note: "backwrite",
    }));

    return [
      {
        object_type: "daily-note",
        object_id: plan.target_page.page_id,
        note: plan.target_page.journal_date,
      },
      {
        object_type: "section",
        object_id: plan.target_section.section_id,
        note: plan.target_section.section_label ?? plan.target_section.section_kind,
      },
      ...insertedObjects,
      ...backwriteObjects,
    ];
  }
}

export function createSiyuanButlerAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SiyuanButlerAdapter {
  return new SiyuanButlerAdapter(loadSiyuanButlerAdapterConfigFromEnv(env));
}
