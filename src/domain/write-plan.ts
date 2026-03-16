import type {
  BackwriteAction,
  ContentPreview,
  SideEffect,
  SourceRef,
  TargetPageRef,
  TargetSectionRef,
  WriteOperationType,
  WritePlanOrigin,
  WriteRiskLevel,
} from "./common.js";
import { hasText, normalizeText, normalizeTextList } from "./helpers.js";

export interface WritePlan {
  plan_id: string;
  operation_type: WriteOperationType;
  target_page: TargetPageRef;
  target_section: TargetSectionRef;
  content_preview: ContentPreview;
  side_effects: SideEffect[];
  origin: WritePlanOrigin;
  backwrite_actions?: BackwriteAction[];
  risk_level?: WriteRiskLevel;
  needs_confirmation?: boolean;
  scope_note?: string;
  preconditions?: string[];
  blocked_by?: string[];
  source_refs?: SourceRef[];
}

export function isWritePlanOperationTargetAligned(plan: WritePlan): boolean {
  switch (plan.operation_type) {
    case "append-sparkle":
      return plan.target_section.section_kind === "sparkles";
    case "append-journal-entry":
      return plan.target_section.section_kind === "journal-body";
    case "update-sparkle-status":
    case "record-rekindle-backref":
      return plan.target_section.section_kind === "sparkles";
  }
}

export function normalizeWritePlan(plan: WritePlan): WritePlan {
  return {
    ...plan,
    content_preview: {
      ...plan.content_preview,
      title: normalizeText(plan.content_preview.title),
      body: plan.content_preview.body.trim(),
    },
    side_effects: plan.side_effects.map((effect) => ({
      ...effect,
      note: effect.note.trim(),
    })),
    backwrite_actions: plan.backwrite_actions?.map((action) => ({
      ...action,
      preview: action.preview.trim(),
    })),
    scope_note: normalizeText(plan.scope_note),
    preconditions: normalizeTextList(plan.preconditions),
    blocked_by: normalizeTextList(plan.blocked_by),
    source_refs: plan.source_refs?.map((ref) => ({
      ...ref,
      note: normalizeText(ref.note),
    })),
  };
}

export function listWritePlanBlockingIssues(plan: WritePlan): string[] {
  const issues: string[] = [];

  if (!hasText(plan.plan_id)) {
    issues.push("WritePlan 缺少 plan_id，无法作为稳定的受控动作对象。");
  }

  if (!hasText(plan.target_page.journal_date)) {
    issues.push("WritePlan 缺少明确的 journal_date，目标页面仍不清晰。");
  }

  if (!hasText(plan.content_preview.body)) {
    issues.push("WritePlan 缺少 content_preview.body，当前写入内容不可预览。");
  }

  if (plan.side_effects.length === 0) {
    issues.push("WritePlan 没有 side_effects 说明，不符合 review-before-write 边界。");
  }

  if (!isWritePlanOperationTargetAligned(plan)) {
    issues.push("WritePlan 的 operation_type 与 target_section 不匹配，语义边界仍有歧义。");
  }

  if ((plan.blocked_by?.length ?? 0) > 0) {
    issues.push(...(plan.blocked_by ?? []));
  }

  return issues;
}

export function hasWritePlanBlockingIssues(plan: WritePlan): boolean {
  return listWritePlanBlockingIssues(plan).length > 0;
}

export function canWritePlanEnterReview(plan: WritePlan): boolean {
  return !hasWritePlanBlockingIssues(plan);
}

export function describeWritePlanScope(plan: WritePlan): string {
  const sectionLabel = plan.target_section.section_label ?? plan.target_section.section_kind;

  return `${plan.operation_type} -> ${plan.target_page.journal_date} / ${sectionLabel}`;
}
