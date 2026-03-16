import type {
  JournalDate,
  MaturityHint,
  RekindleDepth,
  RekindleGoal,
  RekindleTrigger,
  SparkleSnapshot,
} from "../value-objects/common.js";
import {
  hasText,
  normalizeText,
  normalizeTextList,
} from "../support/helpers.js";

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

export function listRekindleRequestGaps(request: RekindleRequest): string[] {
  const gaps: string[] = [];

  if (!hasText(request.sparkle_id)) {
    gaps.push("RekindleRequest 缺少 sparkle_id，无法明确要复燃哪条 Sparkle。");
  }

  if (!hasSparkleSnapshotCore(request.sparkle_snapshot)) {
    gaps.push("RekindleRequest 的 sparkle_snapshot 没有保住 source 与 glow。");
  }

  return gaps;
}

export function hasSparkleSnapshotCore(snapshot: SparkleSnapshot): boolean {
  return hasText(snapshot.source) && hasText(snapshot.glow);
}

export function normalizeRekindleRequest(
  request: RekindleRequest,
): RekindleRequest {
  return {
    ...request,
    related_context: normalizeTextList(request.related_context),
    focus_question: normalizeText(request.focus_question),
    constraints: normalizeTextList(request.constraints),
    conversation_excerpt: normalizeText(request.conversation_excerpt),
    proposed_title_direction: normalizeText(request.proposed_title_direction),
    sparkle_snapshot: {
      ...request.sparkle_snapshot,
      source: request.sparkle_snapshot.source.trim(),
      glow: request.sparkle_snapshot.glow.trim(),
      trace: normalizeTextList(request.sparkle_snapshot.trace),
      pull: normalizeTextList(request.sparkle_snapshot.pull),
    },
  };
}

export function canRekindleRequestStartProposal(
  request: RekindleRequest,
): boolean {
  return listRekindleRequestGaps(request).length === 0;
}
