import type {
  JournalDate,
  MaturityHint,
  RekindleDepth,
  RekindleGoal,
  RekindleTrigger,
  SparkleSnapshot,
} from "./common.js";

export interface RekindleRequest {
  sparkle_id: string;
  sparkle_snapshot: SparkleSnapshot;
  trigger: RekindleTrigger;
  user_goal: RekindleGoal;
  desired_depth: RekindleDepth;
  related_context?: string[];
  focus_question?: string;
  maturity_hint?: MaturityHint;
  target_journal_date?: JournalDate;
  constraints?: string[];
  conversation_excerpt?: string;
  proposed_title_direction?: string;
}
