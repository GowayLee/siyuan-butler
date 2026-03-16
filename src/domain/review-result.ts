import type {
  DowngradeTarget,
  RejectCode,
  ReviewCheck,
  ReviewDecision,
} from "./common.js";
import type { WritePlan } from "./write-plan.js";

export interface ReviewResult {
  decision: ReviewDecision;
  reason: string;
  review_summary: string;
  user_prompt?: string;
  final_write_plan?: WritePlan;
  downgrade_to?: DowngradeTarget;
  downgrade_note?: string;
  reject_code?: RejectCode;
  confirm_scope?: string;
  review_checks?: ReviewCheck[];
}
