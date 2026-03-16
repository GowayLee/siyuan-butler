import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  executeReviewedWritePlanCapability,
  listButlerCapabilities,
  prepareCaptureWritePlanCapability,
  prepareRekindleWritePlanCapability,
  readJournalContextCapability,
  readSparkleRecordCapability,
  resolveDailyJournalTargetCapability,
  reviewWritePlanCapability,
} from "../application/index.js";
import { createSiyuanButlerAdapterFromEnv } from "../adapter/siyuan/adapter.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const sectionKindSchema = z.enum(["sparkles", "journal-body"]);

const sparkleDraftSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  source_type: z.enum([
    "conversation",
    "reading",
    "web",
    "music",
    "image",
    "photo-editing",
    "experiment",
    "work",
    "life",
    "other",
  ]),
  sparkle_kind: z.enum(["affective", "cognitive", "mixed"]),
  source: z.string(),
  glow: z.string(),
  status: z.enum([
    "draft",
    "captured",
    "needs_clarify",
    "paused",
    "rekindled",
    "discarded",
  ]),
  trace: z.array(z.string()).optional(),
  pull: z.array(z.string()).optional(),
  source_excerpt: z.string().optional(),
  context: z.string().optional(),
  why_it_matters: z.string().optional(),
  next_hint: z.string().optional(),
  target_journal_date: z.string().optional(),
  capture_mode: z.enum(["auto-extract", "minimal-followup", "user-directed"]).optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  write_intent: z.enum(["proposal_only", "suggest_save", "user_requested_save"]).optional(),
  tags_hint: z.array(z.string()).optional(),
});

const writeTargetSchema = z.object({
  journal_date: z.string().optional(),
  page_kind: z.literal("daily-note"),
  section_kind: sectionKindSchema,
  section_label: z.string().optional(),
});

const rekindleProposalSchema = z.object({
  source_sparkle_id: z.string(),
  rekindle_mode: z.enum(["brief", "full", "postpone"]),
  maturity: z.enum(["borderline", "ready", "strong"]),
  entry_title: z.string(),
  entry_body: z.string(),
  entry_reason: z.string(),
  write_target: writeTargetSchema,
  summary_line: z.string().optional(),
  open_questions: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
  backref_needed: z.boolean().optional(),
  backref_hint: z.string().optional(),
  downgrade_reason: z.string().optional(),
  style_hint: z.enum(["judgment", "observation", "affective", "mixed"]).optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

const targetPageSchema = z.object({
  page_kind: z.literal("daily-note"),
  journal_date: z.string(),
  page_id: z.string().optional(),
  notebook_hint: z.string().optional(),
});

const targetSectionSchema = z.object({
  section_kind: sectionKindSchema,
  section_id: z.string().optional(),
  section_label: z.string().optional(),
  insertion_mode: z.literal("append"),
});

const writePlanSchema = z.object({
  plan_id: z.string(),
  operation_type: z.enum([
    "append-sparkle",
    "append-journal-entry",
    "update-sparkle-status",
    "record-rekindle-backref",
  ]),
  target_page: targetPageSchema,
  target_section: targetSectionSchema,
  content_preview: z.object({
    title: z.string().optional(),
    body: z.string(),
    preview_format: z.literal("markdown"),
  }),
  side_effects: z.array(
    z.object({
      kind: z.enum(["none", "status-backwrite", "reference-backwrite", "multi-block-write"]),
      note: z.string(),
    }),
  ),
  origin: z.enum(["capture", "rekindle"]),
  backwrite_actions: z
    .array(
      z.object({
        action_type: z.enum(["mark-rekindled", "link-entry", "update-metadata"]),
        target_id: z.string(),
        preview: z.string(),
      }),
    )
    .optional(),
  risk_level: z.enum(["low", "medium", "high"]).optional(),
  needs_confirmation: z.boolean().optional(),
  scope_note: z.string().optional(),
  preconditions: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
  source_refs: z
    .array(
      z.object({
        ref_type: z.enum(["sparkle", "proposal", "conversation"]),
        ref_id: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

const reviewResultSchema = z.object({
  decision: z.enum(["allow", "ask_confirm", "downgrade", "reject"]),
  reason: z.string(),
  review_summary: z.string(),
  user_prompt: z.string().optional(),
  final_write_plan: writePlanSchema.optional(),
  downgrade_to: z.enum(["proposal-only", "sparkle-draft-only", "suggestion-only"]).optional(),
  downgrade_note: z.string().optional(),
  reject_code: z
    .enum([
      "user-opt-out",
      "target-missing",
      "target-ambiguous",
      "semantic-mismatch",
      "low-value-noise",
      "risk-too-high",
    ])
    .optional(),
  confirm_scope: z.string().optional(),
  review_checks: z
    .array(
      z.object({
        check: z.enum([
          "target-clear",
          "preview-clear",
          "semantic-fit",
          "side-effects-acceptable",
        ]),
        result: z.enum(["pass", "warn", "fail"]),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function toToolResult(
  summary: string,
  structuredContent: Record<string, unknown>,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\n${pretty(structuredContent)}`,
      },
    ],
    structuredContent,
  };
}

function resolveCaptureJournalDate(input: { draft: z.infer<typeof sparkleDraftSchema>; journal_date?: string }) {
  return input.journal_date ?? input.draft.target_journal_date;
}

function resolveRekindleJournalDate(input: {
  proposal: z.infer<typeof rekindleProposalSchema>;
  journal_date?: string;
}) {
  return input.journal_date ?? input.proposal.write_target.journal_date;
}

export interface RegisterButlerCapabilityToolsOptions {
  env?: NodeJS.ProcessEnv;
}

export function registerButlerCapabilityTools(
  server: McpServer,
  options: RegisterButlerCapabilityToolsOptions = {},
): void {
  const adapter = createSiyuanButlerAdapterFromEnv(options.env);
  const capabilityIds = new Set(listButlerCapabilities().map((item) => item.capability_id));

  if (capabilityIds.has("resolve-daily-journal-target")) {
    server.registerTool(
      "resolve-daily-journal-target",
      {
        title: "解析日志目标 · resolve-daily-journal-target",
        description: "将 daily note 与目标 section 收敛为 Butler 可稳定追加的写入目标。",
        inputSchema: {
          journal_date: z.string(),
          section_kind: sectionKindSchema,
          section_label: z.string().optional(),
        },
      },
      async ({ journal_date, section_kind, section_label }) => {
        const result = await resolveDailyJournalTargetCapability(adapter, {
          journal_date,
          section_kind,
          section_label,
        });

        return toToolResult("已解析目标日志页与章节。", { resolution: result });
      },
    );
  }

  if (capabilityIds.has("read-sparkle-record")) {
    server.registerTool(
      "read-sparkle-record",
      {
        title: "读取 Sparkle 记录 · read-sparkle-record",
        description: "读取 rekindle 流程所需的最小 Sparkle snapshot 与状态信息。",
        inputSchema: {
          sparkle_id: z.string(),
        },
      },
      async ({ sparkle_id }) => {
        const result = await readSparkleRecordCapability(adapter, sparkle_id);

        return toToolResult(
          result === undefined ? "未找到可复燃的 Sparkle 记录。" : "已读取 Sparkle 记录。",
          { sparkle_record: result },
        );
      },
    );
  }

  if (capabilityIds.has("read-journal-context")) {
    server.registerTool(
      "read-journal-context",
      {
        title: "读取日志上下文 · read-journal-context",
        description: "读取 Butler 在 workflow 收敛时所需的最小 daily-note context 切片。",
        inputSchema: {
          journal_date: z.string(),
          section_kind: sectionKindSchema.optional(),
        },
      },
      async ({ journal_date, section_kind }) => {
        const result = await readJournalContextCapability(adapter, {
          journal_date,
          section_kind,
        });

        return toToolResult("已读取日志上下文。", { journal_context: result });
      },
    );
  }

  if (capabilityIds.has("prepare-capture-write-plan")) {
    server.registerTool(
      "prepare-capture-write-plan",
      {
        title: "准备 Capture 写入计划 · prepare-capture-write-plan",
        description: "将 SparkleDraft 收敛为可进入 review 的 capture WritePlan。",
        inputSchema: {
          plan_id: z.string().optional(),
          journal_date: z.string().optional(),
          section_label: z.string().optional(),
          scope_note: z.string().optional(),
          draft: sparkleDraftSchema,
        },
      },
      async ({ plan_id, journal_date, section_label, scope_note, draft }) => {
        const resolvedJournalDate = resolveCaptureJournalDate({ draft, journal_date });

        if (resolvedJournalDate === undefined) {
          throw new Error("prepare-capture-write-plan 需要 journal_date，或 draft.target_journal_date 已明确。 ");
        }

        const write_plan = await prepareCaptureWritePlanCapability(adapter, {
          plan_id: plan_id ?? randomUUID(),
          draft,
          journal_date: resolvedJournalDate,
          section_label,
          scope_note,
        });

        return toToolResult("已将 SparkleDraft 收敛为待审查 WritePlan。", { write_plan });
      },
    );
  }

  if (capabilityIds.has("prepare-rekindle-write-plan")) {
    server.registerTool(
      "prepare-rekindle-write-plan",
      {
        title: "准备 Rekindle 写入计划 · prepare-rekindle-write-plan",
        description: "将 RekindleProposal 收敛为可进入 review 的 journal-entry WritePlan。",
        inputSchema: {
          plan_id: z.string().optional(),
          journal_date: z.string().optional(),
          scope_note: z.string().optional(),
          proposal: rekindleProposalSchema,
        },
      },
      async ({ plan_id, journal_date, scope_note, proposal }) => {
        const resolvedJournalDate = resolveRekindleJournalDate({ proposal, journal_date });

        if (resolvedJournalDate === undefined) {
          throw new Error(
            "prepare-rekindle-write-plan 需要 journal_date，或 proposal.write_target.journal_date 已明确。",
          );
        }

        const write_plan = await prepareRekindleWritePlanCapability(adapter, {
          plan_id: plan_id ?? randomUUID(),
          proposal,
          journal_date: resolvedJournalDate,
          scope_note,
        });

        return toToolResult("已将 RekindleProposal 收敛为待审查 WritePlan。", { write_plan });
      },
    );
  }

  if (capabilityIds.has("review-write-plan")) {
    server.registerTool(
      "review-write-plan",
      {
        title: "审查写入计划 · review-write-plan",
        description: "对 WritePlan 应用 Butler 的 Policy Guard review 边界。",
        inputSchema: {
          write_plan: writePlanSchema,
        },
      },
      async ({ write_plan }) => {
        const review_result = reviewWritePlanCapability(write_plan);

        return toToolResult("已完成 WritePlan 审查。", { review_result });
      },
    );
  }

  if (capabilityIds.has("execute-reviewed-write-plan")) {
    server.registerTool(
      "execute-reviewed-write-plan",
      {
        title: "执行已审查写入计划 · execute-reviewed-write-plan",
        description: "只执行已经被 Policy Guard 放行的 final_write_plan。",
        inputSchema: {
          review_result: reviewResultSchema,
          confirmation_granted: z.boolean().optional(),
        },
      },
      async ({ review_result, confirmation_granted }) => {
        const receipt = await executeReviewedWritePlanCapability(adapter, {
          review_result,
          confirmation_granted,
        });

        return toToolResult("已执行审查放行后的写入计划。", { receipt });
      },
    );
  }
}
