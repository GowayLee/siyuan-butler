import type {
  EntryStyleHint,
  ProposalConfidence,
  ProposalMaturity,
  RekindleMode,
  WriteTargetHint,
} from "./common.js";

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
