import type { SparkleSnapshot } from "../../../domain/value-objects/common.js";
import {
  hasText,
  normalizeText,
  normalizeTextList,
} from "../../../domain/support/helpers.js";

export function normalizeSectionLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function extractHeadingLabel(kramdown: string): string | undefined {
  const firstLine = kramdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (firstLine === undefined || !firstLine.startsWith("#")) {
    return undefined;
  }

  return firstLine
    .replace(/^#+\s*/, "")
    .replace(/\s*\{:\s*id="[^"]+"\}\s*$/, "")
    .trim();
}

export function extractFirstMeaningfulLine(markdown: string): string | undefined {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

export function parseSparklePreview(markdown: string): SparkleSnapshot | undefined {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const glowLine = lines.find((line) => /^[-*]\s+/.test(line));
  const glow = glowLine?.replace(/^[-*]\s+/, "").trim();
  const source = lines
    .find((line) => /^[-*]\s+source:\s*/i.test(line))
    ?.replace(/^[-*]\s+source:\s*/i, "")
    .trim();

  if (!hasText(source) || !hasText(glow)) {
    return undefined;
  }

  const traceLine = lines
    .find((line) => /^[-*]\s+trace:\s*/i.test(line))
    ?.replace(/^[-*]\s+trace:\s*/i, "");
  const pullLine = lines
    .find((line) => /^[-*]\s+pull:\s*/i.test(line))
    ?.replace(/^[-*]\s+pull:\s*/i, "");

  return {
    id: "",
    source,
    glow,
    trace: normalizeTextList(traceLine?.split("|").map((item) => item.trim())),
    pull: normalizeTextList(pullLine?.split("|").map((item) => item.trim())),
  };
}

export function renderJournalEntryMarkdown(
  title: string | undefined,
  body: string,
): string {
  const normalizedTitle = normalizeText(title);

  if (normalizedTitle === undefined) {
    return body.trim();
  }

  return `### ${normalizedTitle}\n\n${body.trim()}`;
}
