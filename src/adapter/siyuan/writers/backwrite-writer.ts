import { hasText } from "../../../domain/support/helpers.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";

export async function applyBackwriteActions(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  plan: WritePlan,
  journalEntryId: string | undefined,
): Promise<string[]> {
  const touchedIds: string[] = [];

  for (const action of plan.backwrite_actions ?? []) {
    if (!hasText(action.target_id)) {
      continue;
    }

    switch (action.action_type) {
      case "mark-rekindled":
        await client.setBlockAttrs({
          id: action.target_id,
          attrs: {
            [config.sparkle_status_attr]: "rekindled",
            [config.sparkle_journal_date_attr]: plan.target_page.journal_date,
            [config.sparkle_entry_ref_attr]: journalEntryId ?? "",
          },
        });
        touchedIds.push(action.target_id);
        break;
      default:
        throw new Error(
          `SiyuanButlerAdapter 暂不支持 backwrite action ${action.action_type}。`,
        );
    }
  }

  return touchedIds;
}
