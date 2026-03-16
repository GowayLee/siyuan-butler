import { hasText, normalizeText } from "../../domain/support/helpers.js";

export interface SiyuanConnectionConfig {
  base_url: string;
  token?: string;
}

export interface SiyuanButlerAdapterConfig extends SiyuanConnectionConfig {
  notebook: string;
  daily_note_hpath_template: string;
  sparkles_section_label: string;
  journal_body_section_label: string;
}

const DEFAULT_DAILY_NOTE_HPATH_TEMPLATE = "/{{year}}/{{month}}/{{date}}";
const DEFAULT_SPARKLES_SECTION_LABEL = "Sparkles";
const DEFAULT_JOURNAL_BODY_SECTION_LABEL = "Journal Body";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeDailyNoteHPathTemplate(value: string | undefined): string {
  const normalized = normalizeText(value) ?? DEFAULT_DAILY_NOTE_HPATH_TEMPLATE;

  if (normalized === "/") {
    return normalized;
  }

  return `/${normalized.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function loadSiyuanConnectionConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SiyuanConnectionConfig {
  const token = normalizeText(env.SIYUAN_TOKEN);
  const baseUrl = normalizeText(env.SIYUAN_URL);

  if (baseUrl !== undefined) {
    return {
      base_url: trimTrailingSlash(baseUrl),
      token,
    };
  }

  const host = normalizeText(env.SIYUAN_HOST) ?? "127.0.0.1";
  const port = normalizeText(env.SIYUAN_PORT) ?? "6806";

  return {
    base_url: `http://${host}:${port}`,
    token,
  };
}

export function loadSiyuanButlerAdapterConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SiyuanButlerAdapterConfig {
  const connection = loadSiyuanConnectionConfigFromEnv(env);
  const notebook = normalizeText(env.SIYUAN_NOTEBOOK);

  if (!hasText(notebook)) {
    throw new Error(
      "缺少 SIYUAN_NOTEBOOK，Butler adapter 不能隐式推断笔记本目标。",
    );
  }

  return {
    ...connection,
    notebook,
    daily_note_hpath_template: normalizeDailyNoteHPathTemplate(
      env.SIYUAN_DAILY_NOTE_HPATH_TEMPLATE,
    ),
    sparkles_section_label:
      normalizeText(env.SIYUAN_SPARKLES_SECTION_LABEL) ??
      DEFAULT_SPARKLES_SECTION_LABEL,
    journal_body_section_label:
      normalizeText(env.SIYUAN_JOURNAL_BODY_SECTION_LABEL) ??
      DEFAULT_JOURNAL_BODY_SECTION_LABEL,
  };
}
