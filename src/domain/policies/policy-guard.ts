import type { ReviewCheck, ReviewDecision } from "../value-objects/common.js";
import type { ReviewResult } from "../objects/review-result.js";
import type { WritePlan } from "../objects/write-plan.js";
import {
  canWritePlanEnterReview,
  describeWritePlanScope,
  isWritePlanOperationTargetAligned,
  listWritePlanBlockingIssues,
  normalizeWritePlan,
} from "../objects/write-plan.js";

export function buildWritePlanReviewChecks(plan: WritePlan): ReviewCheck[] {
  const hasSideEffectRisk = plan.side_effects.some((effect) => effect.kind !== "none");

  return [
    {
      check: "target-clear",
      result: plan.target_page.journal_date.length > 0 ? "pass" : "fail",
      note:
        plan.target_page.journal_date.length > 0
          ? "目标日志日期已明确。"
          : "目标日志日期仍为空，无法进入受控写入。",
    },
    {
      check: "preview-clear",
      result: plan.content_preview.body.length > 0 ? "pass" : "fail",
      note:
        plan.content_preview.body.length > 0
          ? "写入预览已成形。"
          : "写入预览为空，当前内容还不能被审查。",
    },
    {
      check: "semantic-fit",
      result: isWritePlanOperationTargetAligned(plan) ? "pass" : "fail",
      note: isWritePlanOperationTargetAligned(plan)
        ? "动作类型与目标章节保持一致。"
        : "动作类型与目标章节不匹配，语义边界仍有歧义。",
    },
    {
      check: "side-effects-acceptable",
      result: !canWritePlanEnterReview(plan)
        ? "fail"
        : hasSideEffectRisk || plan.needs_confirmation === true
          ? "warn"
          : "pass",
      note: !canWritePlanEnterReview(plan)
        ? "仍有未收拢的问题，暂不进入执行。"
        : hasSideEffectRisk
          ? "本次写入带有附带影响，建议先确认范围。"
          : plan.needs_confirmation === true
            ? "当前计划建议先做一次用户确认。"
            : "副作用边界清晰，可继续执行。",
    },
  ];
}

export function writePlanNeedsExplicitConfirmation(plan: WritePlan): boolean {
  return (
    plan.needs_confirmation === true ||
    plan.operation_type !== "append-sparkle" ||
    plan.side_effects.some((effect) => effect.kind !== "none")
  );
}

export function deriveReviewDecisionFromWritePlan(plan: WritePlan): ReviewDecision {
  if (!canWritePlanEnterReview(plan)) {
    return "downgrade";
  }

  if (writePlanNeedsExplicitConfirmation(plan)) {
    return "ask_confirm";
  }

  return "allow";
}

export function createReviewResultFromWritePlan(plan: WritePlan): ReviewResult {
  const normalizedPlan = normalizeWritePlan(plan);
  const checks = buildWritePlanReviewChecks(normalizedPlan);
  const decision = deriveReviewDecisionFromWritePlan(normalizedPlan);

  if (decision === "allow") {
    return {
      decision,
      reason: "写入目标清晰，预览完整，且当前计划没有额外副作用需要确认。",
      review_summary: "这次写入边界已经收拢清楚，可以直接继续。",
      final_write_plan: normalizedPlan,
      review_checks: checks,
    };
  }

  if (decision === "ask_confirm") {
    return {
      decision,
      reason: "这次写入涉及正式条目或附带影响，需要在当前范围上先确认。",
      review_summary: "计划已经收拢好了，但最好先确认一次写入范围。",
      user_prompt: "我已经把这次写入范围收拢好了。若按这个计划继续，就只会执行这里列出的内容。",
      final_write_plan: normalizedPlan,
      confirm_scope: describeWritePlanScope(normalizedPlan),
      review_checks: checks,
    };
  }

  const blockers = listWritePlanBlockingIssues(normalizedPlan);

  return {
    decision: "downgrade",
    reason: blockers[0] ?? "这次写入计划还没有收拢到可执行状态。",
    review_summary: "这次先不落盘，先把结果保留在提案层。",
    downgrade_to: normalizedPlan.origin === "capture" ? "sparkle-draft-only" : "proposal-only",
    downgrade_note: blockers.join(" "),
    review_checks: checks,
  };
}
