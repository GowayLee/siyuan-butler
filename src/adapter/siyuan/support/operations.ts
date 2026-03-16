import { hasText } from "../../../domain/support/helpers.js";
import type { SiyuanOperationBatch } from "../types.js";

export function extractOperationIds(batches: SiyuanOperationBatch[]): string[] {
  return batches.flatMap((batch) =>
    (batch.doOperations ?? []).flatMap((operation) =>
      hasText(operation.id) ? [operation.id] : [],
    ),
  );
}
