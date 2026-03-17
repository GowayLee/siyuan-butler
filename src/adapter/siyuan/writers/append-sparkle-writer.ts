import type { ControlledWriteReceipt } from "../../models/read-model.js";
import { hasText } from "../../../domain/support/helpers.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";
import { SiyuanApiError, type SiyuanClient } from "../client.js";
import {
  extractHeadingLabel,
  isHeadingLabelMatch,
} from "../codecs/markdown-codec.js";
import { extractOperationIds } from "../support/operations.js";
import { buildAffectedObjects } from "./receipt.js";

type EnsuredSparklesSectionResult = {
  section_id: string;
  section_note?: string;
  section_repaired: boolean;
  section_status: "unchanged" | "retargeted" | "auto-created";
};

type SparklesHeadingCandidate = {
  id: string;
  label: string;
  has_sparkle_flow_attr: boolean;
};

function isSparklesHeadingCandidate(
  candidate: SparklesHeadingCandidate | undefined,
): candidate is SparklesHeadingCandidate {
  return candidate !== undefined;
}

function renderSparklesHeadingMarkdown(sectionLabel: string): string {
  return `## ${sectionLabel}`;
}

function isMissingBlockError(
  error: unknown,
  apiPath?: string | string[],
): boolean {
  if (!(error instanceof SiyuanApiError)) {
    return false;
  }

  const allowedApiPaths =
    apiPath === undefined
      ? undefined
      : Array.isArray(apiPath)
        ? apiPath
        : [apiPath];

  if (
    allowedApiPaths !== undefined &&
    !allowedApiPaths.includes(error.apiPath)
  ) {
    return false;
  }

  if (error.apiCode === 404 || error.httpStatus === 404) {
    return true;
  }

  const diagnosticText =
    `${error.apiMessage ?? ""} ${error.message}`.toLowerCase();

  return (
    diagnosticText.includes("不存在") ||
    diagnosticText.includes("not found") ||
    diagnosticText.includes("not exist")
  );
}

async function readExistingPath(client: SiyuanClient, id: string) {
  try {
    return await client.getPathByID(id);
  } catch (error) {
    if (isMissingBlockError(error, "/api/filetree/getPathByID")) {
      return undefined;
    }

    throw error;
  }
}

async function readSparklesHeadingCandidate(
  client: SiyuanClient,
  sectionId: string,
  expectedLabel: string,
): Promise<SparklesHeadingCandidate | undefined> {
  let kramdown: string;

  try {
    kramdown = (await client.getBlockKramdown(sectionId)).kramdown;
  } catch (error) {
    if (isMissingBlockError(error, "/api/block/getBlockKramdown")) {
      return undefined;
    }

    throw error;
  }

  if (!isHeadingLabelMatch(kramdown, expectedLabel)) {
    return undefined;
  }

  const label = extractHeadingLabel(kramdown);

  if (!hasText(label)) {
    return undefined;
  }

  try {
    const attrs = await client.getBlockAttrs(sectionId);

    return {
      id: sectionId,
      label,
      has_sparkle_flow_attr: attrs["custom-daily-note-flow"] === "sparkle",
    };
  } catch (error) {
    if (isMissingBlockError(error, "/api/attr/getBlockAttrs")) {
      return undefined;
    }

    throw error;
  }
}

async function resolvePageSparklesSection(
  client: SiyuanClient,
  pageId: string,
  expectedLabel: string,
): Promise<SparklesHeadingCandidate | undefined> {
  const childBlocks = await client.getChildBlocks(pageId);
  const headingIds = childBlocks
    .filter((block) => block.type === "h")
    .map((block) => block.id);
  const candidates = (
    await Promise.all(
      headingIds.map((headingId) =>
        readSparklesHeadingCandidate(client, headingId, expectedLabel),
      ),
    )
  ).filter(isSparklesHeadingCandidate);

  return (
    candidates.find((candidate) => candidate.has_sparkle_flow_attr) ??
    candidates[0]
  );
}

async function resolveTargetSparklesSection(
  client: SiyuanClient,
  input: {
    pageId: string;
    sectionId: string;
    expectedLabel: string;
  },
): Promise<SparklesHeadingCandidate | undefined> {
  const pagePath = await client.getPathByID(input.pageId);
  const sectionPath = await readExistingPath(client, input.sectionId);

  if (
    sectionPath !== undefined &&
    sectionPath.notebook === pagePath.notebook &&
    sectionPath.path === pagePath.path
  ) {
    const originalCandidate = await readSparklesHeadingCandidate(
      client,
      input.sectionId,
      input.expectedLabel,
    );

    if (originalCandidate !== undefined) {
      return originalCandidate;
    }
  }

  return resolvePageSparklesSection(client, input.pageId, input.expectedLabel);
}

async function ensureSparklesSection(
  client: SiyuanClient,
  plan: WritePlan,
): Promise<EnsuredSparklesSectionResult> {
  if (!hasText(plan.target_page.page_id)) {
    throw new Error(
      "当前 Sparkle 写入缺少日志页 page_id，无法校验或补建 Sparkles 标题。",
    );
  }

  const pageId = plan.target_page.page_id;
  const sectionLabel = plan.target_section.section_label ?? "Sparkles";
  const originalSectionId = hasText(plan.target_section.section_id)
    ? plan.target_section.section_id
    : undefined;
  const resolvedSection =
    originalSectionId !== undefined
      ? await resolveTargetSparklesSection(client, {
          pageId,
          sectionId: originalSectionId,
          expectedLabel: sectionLabel,
        })
      : await resolvePageSparklesSection(client, pageId, sectionLabel);

  if (resolvedSection !== undefined) {
    const sectionRepaired = resolvedSection.id !== originalSectionId;

    return {
      section_id: resolvedSection.id,
      section_note: sectionRepaired
        ? `${resolvedSection.label} (retargeted)`
        : undefined,
      section_repaired: sectionRepaired,
      section_status: sectionRepaired ? "retargeted" : "unchanged",
    };
  }

  const headingResult = await client.appendBlock({
    parentID: pageId,
    data: renderSparklesHeadingMarkdown(sectionLabel),
  });
  const headingIds = extractOperationIds(headingResult);
  const headingId = headingIds[0];

  if (!hasText(headingId)) {
    throw new Error(
      "补建 Sparkles 标题后未拿到标题块 ID，无法继续写入 Sparkle。",
    );
  }

  await client.setBlockAttrs({
    id: headingId,
    attrs: { "custom-daily-note-flow": "sparkle" },
  });

  return {
    section_id: headingId,
    section_note: `${sectionLabel} (auto-created)`,
    section_repaired: true,
    section_status: "auto-created",
  };
}

export async function executeAppendSparkle(
  client: SiyuanClient,
  plan: WritePlan,
): Promise<ControlledWriteReceipt> {
  const { section_id, section_note, section_repaired, section_status } =
    await ensureSparklesSection(client, plan);
  const result = await client.appendBlock({
    parentID: section_id,
    data: plan.content_preview.body,
  });
  const insertedIds = extractOperationIds(result);
  const repairedSummary =
    section_status === "auto-created"
      ? "，并补建了 Sparkles 标题"
      : section_status === "retargeted"
        ? "，并修复了失真的 Sparkles 目标"
        : "";

  return {
    plan_id: plan.plan_id,
    summary: `已向 ${plan.target_page.journal_date} 的 Sparkles 节追加 1 条 Sparkle${repairedSummary}。`,
    affected_objects: buildAffectedObjects(plan, insertedIds, [], {
      section_id,
      section_note,
    }),
    section_repaired,
  };
}
