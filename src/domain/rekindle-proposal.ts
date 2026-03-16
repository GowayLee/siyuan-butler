import type {
  EntryStyleHint,
  ProposalConfidence,
  ProposalMaturity,
  RekindleMode,
  WriteTargetHint,
} from "./common.js";
import { hasText, normalizeText, normalizeTextList } from "./helpers.js";

export interface RekindleProposal {
  source_sparkle_id: string;
  rekindle_mode: RekindleMode;
  maturity: ProposalMaturity;
  entry_title: string;
  entry_body: string;
  entry_reason: string;
  write_target: WriteTargetHint;
  summary_line?: string;
  open_questions?: string[];
  evidence?: string[];
  backref_needed?: boolean;
  backref_hint?: string;
  downgrade_reason?: string;
  style_hint?: EntryStyleHint;
  confidence?: ProposalConfidence;
}

export function listRekindleProposalWriteBlockers(
  proposal: RekindleProposal,
): string[] {
  const blockers: string[] = [];

  if (!hasText(proposal.source_sparkle_id)) {
    blockers.push("RekindleProposal 缺少来源 Sparkle id，无法建立回溯关系。");
  }

  if (proposal.rekindle_mode === "postpone") {
    blockers.push(
      "RekindleProposal 当前为 postpone，只适合保留提案，不应继续进入写入审查。",
    );
  }

  if (!hasText(proposal.entry_title)) {
    blockers.push("RekindleProposal 缺少 entry_title，正式条目标题还不清晰。");
  }

  if (!hasText(proposal.entry_body)) {
    blockers.push("RekindleProposal 缺少 entry_body，正式条目正文还未成形。");
  }

  if (!hasText(proposal.entry_reason)) {
    blockers.push("RekindleProposal 缺少 entry_reason，尚未说明为什么现在值得写入。");
  }

  if (proposal.write_target.section_kind !== "journal-body") {
    blockers.push(
      "RekindleProposal 的 write_target 目前不指向 journal-body，不符合复燃主链路。",
    );
  }

  return blockers;
}

export function normalizeRekindleProposal(
  proposal: RekindleProposal,
): RekindleProposal {
  return {
    ...proposal,
    entry_title: proposal.entry_title.trim(),
    entry_body: proposal.entry_body.trim(),
    entry_reason: proposal.entry_reason.trim(),
    summary_line: normalizeText(proposal.summary_line),
    open_questions: normalizeTextList(proposal.open_questions),
    evidence: normalizeTextList(proposal.evidence),
    backref_hint: normalizeText(proposal.backref_hint),
    downgrade_reason: normalizeText(proposal.downgrade_reason),
  };
}

export function canRekindleProposalEnterWriteReview(
  proposal: RekindleProposal,
): boolean {
  return listRekindleProposalWriteBlockers(proposal).length === 0;
}
