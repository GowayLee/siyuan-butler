import type { SparkleRecordReadModel } from "../../models/read-model.js";
import { normalizeText, hasText } from "../../../domain/support/helpers.js";
import type { SiyuanButlerAdapterConfig } from "../config.js";
import type { SiyuanClient } from "../client.js";
import { parseJournalDateFromHPath, parseSparkleStatus, toIsoTimestamp } from "../codecs/attrs-codec.js";
import { parseSparklePreview } from "../codecs/markdown-codec.js";

export async function readSparkleRecord(
  client: SiyuanClient,
  config: SiyuanButlerAdapterConfig,
  sparkle_id: string,
): Promise<SparkleRecordReadModel | undefined> {
  const [kramdown, attrs, hpath] = await Promise.all([
    client.getBlockKramdown(sparkle_id),
    client.getBlockAttrs(sparkle_id),
    client.getHPathByID(sparkle_id),
  ]);
  const parsedPreview = parseSparklePreview(kramdown.kramdown);
  const source = normalizeText(attrs[config.sparkle_source_attr]) ?? parsedPreview?.source;
  const glow = normalizeText(attrs[config.sparkle_glow_attr]) ?? parsedPreview?.glow;

  if (!hasText(source) || !hasText(glow)) {
    return undefined;
  }

  return {
    id: sparkle_id,
    snapshot: {
      id: sparkle_id,
      source,
      glow,
      trace: parsedPreview?.trace,
      pull: parsedPreview?.pull,
    },
    status: parseSparkleStatus(attrs[config.sparkle_status_attr]),
    journal_date:
      normalizeText(attrs[config.sparkle_journal_date_attr]) ??
      parseJournalDateFromHPath(hpath),
    block_id: sparkle_id,
    updated_at: toIsoTimestamp(attrs.updated),
  };
}
