import { z } from "zod";

export const sectionKindSchema = z.enum(["sparkles", "journal-body"]);

export const sparkleDraftSchema = z.object({
  source: z.string(),
  glow: z.string(),
  trace: z.array(z.string()).optional(),
  pull: z.array(z.string()).optional(),
});

export const writeTargetSchema = z.object({
  journal_date: z.string().optional(),
  page_kind: z.literal("daily-note"),
  section_kind: sectionKindSchema,
  section_label: z.string().optional(),
});

export const rekindleProposalSchema = z.object({
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
  style_hint: z
    .enum(["judgment", "observation", "affective", "mixed"])
    .optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export const targetPageSchema = z.object({
  page_kind: z.literal("daily-note"),
  journal_date: z.string(),
  page_id: z.string().optional(),
  notebook_hint: z.string().optional(),
});

export const targetSectionSchema = z.object({
  section_kind: sectionKindSchema,
  section_id: z.string().optional(),
  section_label: z.string().optional(),
  insertion_mode: z.literal("append"),
});

export const writePlanSchema = z.object({
  plan_id: z.string(),
  operation_type: z.enum(["append-sparkle", "append-journal-entry"]),
  target_page: targetPageSchema,
  target_section: targetSectionSchema,
  content_preview: z.object({
    title: z.string().optional(),
    body: z.string(),
    preview_format: z.literal("markdown"),
  }),
  side_effects: z.array(
    z.object({
      kind: z.enum(["none", "multi-block-write"]),
      preview: z.string(),
    }),
  ),
  origin: z.enum(["capture", "rekindle"]),
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

export const reviewResultSchema = z.object({
  decision: z.enum(["allow", "ask_confirm", "downgrade", "reject"]),
  reason: z.string(),
  review_summary: z.string(),
  user_prompt: z.string().optional(),
  final_write_plan: writePlanSchema.optional(),
  downgrade_to: z
    .enum(["proposal-only", "sparkle-draft-only", "suggestion-only"])
    .optional(),
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
