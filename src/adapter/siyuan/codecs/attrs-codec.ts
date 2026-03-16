import { hasText } from "../../../domain/support/helpers.js";

export function parseJournalDateFromHPath(
  hpath: string | undefined,
): string | undefined {
  if (!hasText(hpath)) {
    return undefined;
  }

  const match = hpath.match(/\b\d{4}-\d{2}-\d{2}\b/);

  return match?.[0];
}
