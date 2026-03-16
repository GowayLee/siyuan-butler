export type ButlerCapabilityId =
  | "resolve-daily-journal-target"
  | "read-sparkle-record"
  | "read-journal-context"
  | "prepare-capture-write-plan"
  | "prepare-rekindle-write-plan"
  | "review-write-plan"
  | "execute-reviewed-write-plan";

export type ButlerWorkflowStage =
  | "shared-read"
  | "capture"
  | "rekindle"
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
    purpose: "Resolve a daily-note page and section into a stable append target.",
    forbidden_calls: [
      "Do not generate note content.",
      "Do not infer whether the text is a valid Sparkle.",
    ],
  },
  {
    capability_id: "read-sparkle-record",
    workflow_stage: "shared-read",
    consumes: ["sparkle_id"],
    produces: ["SparkleRecordReadModel"],
    purpose: "Load the minimal Sparkle read-model needed for rekindle flow.",
    forbidden_calls: [
      "Do not decide maturity inside the adapter.",
      "Do not mutate Sparkle state while reading.",
    ],
  },
  {
    capability_id: "read-journal-context",
    workflow_stage: "shared-read",
    consumes: ["journal_date", "section_kind?"],
    produces: ["JournalContextReadModel"],
    purpose: "Read the smallest journal context slice needed by application use-cases.",
    forbidden_calls: [
      "Do not expose raw SQL or unrestricted full-library browsing.",
    ],
  },
  {
    capability_id: "prepare-capture-write-plan",
    workflow_stage: "capture",
    consumes: ["SparkleDraft", "DailyJournalReadModel"],
    produces: ["WritePlan"],
    purpose: "Converge a SparkleDraft into a reviewable append-sparkle plan.",
    forbidden_calls: [
      "Do not execute writes.",
      "Do not bypass Policy Guard.",
    ],
  },
  {
    capability_id: "prepare-rekindle-write-plan",
    workflow_stage: "rekindle",
    consumes: ["RekindleProposal", "DailyJournalReadModel"],
    produces: ["WritePlan"],
    purpose: "Converge a RekindleProposal into a reviewable journal-entry write plan.",
    forbidden_calls: [
      "Do not silently perform Sparkle backwrite.",
      "Do not re-author proposal content inside runtime.",
    ],
  },
  {
    capability_id: "review-write-plan",
    workflow_stage: "review",
    consumes: ["WritePlan"],
    produces: ["ReviewResult"],
    purpose: "Apply the stable Policy Guard review boundary before any write.",
    forbidden_calls: [
      "Do not author SparkleDraft or RekindleProposal here.",
    ],
  },
  {
    capability_id: "execute-reviewed-write-plan",
    workflow_stage: "controlled-write",
    consumes: ["ReviewResult", "confirmation_granted?"],
    produces: ["ControlledWriteReceipt"],
    purpose: "Execute only the final_write_plan that review has already approved.",
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
