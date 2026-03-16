export function hasText(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeText(value: string | undefined): string | undefined {
  if (!hasText(value)) return undefined;

  return value.trim();
}

export function normalizeTextList(
  values: string[] | undefined,
): string[] | undefined {
  if (values === undefined) return undefined;

  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}
