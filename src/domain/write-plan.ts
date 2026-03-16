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
