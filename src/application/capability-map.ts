export type ButlerCapabilityId =
  | "resolve-daily-journal-target"
  | "read-journal-context"
  | "prepare-capture-write-plan"
  | "review-write-plan"
  | "execute-reviewed-write-plan";

export type ButlerWorkflowStage =
  | "shared-read"
  | "capture"
  | "review"
  | "controlled-write";

export interface ButlerCapabilityDescriptor {
  capability_id: ButlerCapabilityId;
  workflow_stage: ButlerWorkflowStage;
  consumes: string[];
  produces: string[];
  purpose: string;
  forbidden_calls: string[];
}

export const BUTLER_CAPABILITY_MAP: ButlerCapabilityDescriptor[] = [
  {
    capability_id: "resolve-daily-journal-target",
    workflow_stage: "shared-read",
    consumes: ["journal_date", "section_kind", "DailyJournalReadModel"],
    produces: ["TargetPageRef", "TargetSectionRef", "blocked_by[]"],
    purpose:
      "Resolve a daily-note page and section into a stable append target.",
    forbidden_calls: [
      "Do not generate note content.",
      "Do not infer whether the text is a valid Sparkle.",
    ],
  },
  {
    capability_id: "read-journal-context",
    workflow_stage: "shared-read",
    consumes: ["journal_date", "section_kind?"],
    produces: ["JournalContextReadModel"],
    purpose:
      "Read the smallest journal context slice needed by application use-cases.",
    forbidden_calls: [
      "Do not expose raw SQL or unrestricted full-library browsing.",
    ],
  },
  {
    capability_id: "prepare-capture-write-plan",
    workflow_stage: "capture",
    consumes: ["SparkleDraft", "journal_date", "section_label?", "scope_note?"],
    produces: ["plan_token", "journal_date", "next_action", "blocked_by?"],
    purpose:
      "Converge a SparkleDraft into a cached reviewable append-sparkle plan token that must be passed through unchanged.",
    forbidden_calls: ["Do not execute writes.", "Do not bypass Policy Guard."],
  },
  {
    capability_id: "review-write-plan",
    workflow_stage: "review",
    consumes: ["plan_token (pass through unchanged)"],
    produces: [
      "decision",
      "review_token?",
      "needs_confirmation",
      "confirm_scope?",
      "blocked_by?",
      "next_action",
    ],
    purpose:
      "Apply the stable Policy Guard review boundary to the stored WritePlan behind the original plan token.",
    forbidden_calls: ["Do not author SparkleDraft or RekindleProposal here."],
  },
  {
    capability_id: "execute-reviewed-write-plan",
    workflow_stage: "controlled-write",
    consumes: [
      "review_token (pass through unchanged)",
      "confirmation_granted?",
    ],
    produces: [
      "journal_date",
      "page_id?",
      "section_id?",
      "sparkle_block_id?",
      "repaired_section",
      "next_action",
    ],
    purpose: "Execute only the stored plan that review has already approved.",
    forbidden_calls: [
      "Do not accept free-form text as a write request.",
      "Do not execute plans that have not passed review.",
    ],
  },
];

export function listButlerCapabilities(): ButlerCapabilityDescriptor[] {
  return BUTLER_CAPABILITY_MAP.map((capability) => ({
    ...capability,
    consumes: [...capability.consumes],
    produces: [...capability.produces],
    forbidden_calls: [...capability.forbidden_calls],
  }));
}
