import type {
  TargetPageRef,
  TargetSectionRef,
} from "../value-objects/common.js";
import { hasText, normalizeText } from "../support/helpers.js";
import type { RekindleProposal } from "../objects/rekindle-proposal.js";
import {
  listRekindleProposalWriteBlockers,
  normalizeRekindleProposal,
} from "../objects/rekindle-proposal.js";
import type { SparkleDraft } from "../objects/sparkle-draft.js";
import {
  listSparkleDraftCoreGaps,
  normalizeSparkleDraft,
} from "../objects/sparkle-draft.js";
import type { WritePlan } from "../objects/write-plan.js";
import { normalizeWritePlan } from "../objects/write-plan.js";

export interface CaptureWritePlanOptions {
  plan_id: string;
  draft: SparkleDraft;
  target_page: TargetPageRef;
  target_section?: TargetSectionRef;
  section_label?: string;
  scope_note?: string;
}

export interface RekindleWritePlanOptions {
  plan_id: string;
  proposal: RekindleProposal;
  target_page?: TargetPageRef;
  target_section?: TargetSectionRef;
  section_label?: string;
  scope_note?: string;
}

export function renderSparkleDraftPreview(draft: SparkleDraft): string {
  const normalized = normalizeSparkleDraft(draft);
  const lines = [`- ${normalized.glow}`, `  - source: ${normalized.source}`];

  if ((normalized.trace?.length ?? 0) > 0) {
    lines.push(`  - trace: ${normalized.trace?.join(" | ")}`);
  }

  if ((normalized.pull?.length ?? 0) > 0) {
    lines.push(`  - pull: ${normalized.pull?.join(" | ")}`);
  }

  return lines.join("\n");
}

export function createCaptureWritePlan(
  options: CaptureWritePlanOptions,
): WritePlan {
  const draft = normalizeSparkleDraft(options.draft);
  const blockedBy = listSparkleDraftCoreGaps(draft);
  const targetSection = options.target_section ?? {
    section_kind: "sparkles",
    section_label: normalizeText(options.section_label) ?? "Sparkles",
    insertion_mode: "append",
  };

  return normalizeWritePlan({
    plan_id: options.plan_id,
    operation_type: "append-sparkle",
    target_page: options.target_page,
    target_section: targetSection,
    content_preview: {
      body: renderSparkleDraftPreview(draft),
      preview_format: "markdown",
    },
    side_effects: [
      {
        kind: "none",
        preview: "Append the captured Sparkle into the Sparkles section only.",
      },
    ],
    origin: "capture",
    risk_level: "low",
    needs_confirmation: false,
    scope_note: options.scope_note,
    blocked_by: blockedBy.length > 0 ? blockedBy : undefined,
    source_refs: [
      {
        ref_type: "conversation",
        note: "Captured from the current conversation as a Sparkle draft.",
      },
    ],
  });
}

export function createRekindleWritePlan(
  options: RekindleWritePlanOptions,
): WritePlan {
  const proposal = normalizeRekindleProposal(options.proposal);
  const blockedBy = [...listRekindleProposalWriteBlockers(proposal)];
  const targetPage = options.target_page ?? {
    page_kind: proposal.write_target.page_kind,
    journal_date: proposal.write_target.journal_date ?? "",
  };

  if (!hasText(targetPage.journal_date)) {
    blockedBy.push(
      "RekindleProposal 缺少明确的 journal_date，暂不能收敛成可执行 WritePlan。",
    );
  }

  const targetSection = options.target_section ?? {
    section_kind: proposal.write_target.section_kind,
    section_label:
      normalizeText(options.section_label) ??
      proposal.write_target.section_label ??
      "Journal Body",
    insertion_mode: "append",
  };

  return normalizeWritePlan({
    plan_id: options.plan_id,
    operation_type: "append-journal-entry",
    target_page: targetPage,
    target_section: targetSection,
    content_preview: {
      title: proposal.entry_title,
      body: proposal.entry_body,
      preview_format: "markdown",
    },
    side_effects: [
      {
        kind: "none",
        preview: "Append the rekindled journal entry to the journal body only.",
      },
    ],
    origin: "rekindle",
    risk_level: "low",
    needs_confirmation: true,
    scope_note: options.scope_note,
    blocked_by: blockedBy.length > 0 ? blockedBy : undefined,
    source_refs: [
      {
        ref_type: "sparkle",
        ref_id: proposal.source_sparkle_id,
        note: "Source Sparkle for the rekindle proposal.",
      },
      {
        ref_type: "proposal",
        note: "Rekindle proposal converged into a controlled journal-entry write plan.",
      },
    ],
  });
}
