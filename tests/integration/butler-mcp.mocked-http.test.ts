import assert from "node:assert/strict";
import test from "node:test";

import { handleExecuteReviewedWritePlan } from "../../src/butler-mcp/capabilities/execute-reviewed-write-plan/handler.js";
import { handlePrepareCaptureWritePlan } from "../../src/butler-mcp/capabilities/prepare-capture-write-plan/handler.js";
import { handleReadJournalContext } from "../../src/butler-mcp/capabilities/read-journal-context/handler.js";
import { handleResolveDailyJournalTarget } from "../../src/butler-mcp/capabilities/resolve-daily-journal-target/handler.js";
import { handleReviewWritePlan } from "../../src/butler-mcp/capabilities/review-write-plan/handler.js";
import type { ExpectedSiyuanRequest } from "../fixtures/mock-siyuan-http.js";
import { createMockButlerContext } from "../fixtures/mock-siyuan-http.js";

const JOURNAL_DATE = "2026-03-16";
const DAILY_NOTE_PATH = "/2026/03/2026-03-16";
const PAGE_ID = "page-20260316";
const SPARKLES_SECTION_ID = "heading-sparkles";
const JOURNAL_BODY_SECTION_ID = "heading-journal-body";
const REPAIRED_SPARKLES_SECTION_ID = "heading-sparkles-repaired";
const NEW_SPARKLE_BLOCK_ID = "sparkle-new-block";

function createDailyJournalRoutes(): ExpectedSiyuanRequest[] {
  return [
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: DAILY_NOTE_PATH,
        notebook: "daily-notebook",
      },
      data: [PAGE_ID],
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [
        { id: SPARKLES_SECTION_ID, type: "h" },
        { id: JOURNAL_BODY_SECTION_ID, type: "h" },
        { id: "body-paragraph", type: "p" },
      ],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: SPARKLES_SECTION_ID },
      data: { id: SPARKLES_SECTION_ID, kramdown: "# Sparkles" },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: JOURNAL_BODY_SECTION_ID },
      data: { id: JOURNAL_BODY_SECTION_ID, kramdown: "# Journal Body" },
    },
  ];
}

function createMissingDailyJournalRoutes(): ExpectedSiyuanRequest[] {
  return [
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: DAILY_NOTE_PATH,
        notebook: "daily-notebook",
      },
      data: [],
    },
  ];
}

function createJournalRoutesWithoutSparklesSection(): ExpectedSiyuanRequest[] {
  return [
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: DAILY_NOTE_PATH,
        notebook: "daily-notebook",
      },
      data: [PAGE_ID],
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [{ id: JOURNAL_BODY_SECTION_ID, type: "h" }],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: JOURNAL_BODY_SECTION_ID },
      data: { id: JOURNAL_BODY_SECTION_ID, kramdown: "# Journal Body" },
    },
  ];
}

async function saveAppendSparkleReview(
  mock: ReturnType<typeof createMockButlerContext>,
  input: {
    todayDate: string;
    sectionId: string;
    body?: string;
  },
): Promise<string> {
  return mock.context.handoffStore.saveReview({
    decision: "allow",
    reason: "safe to write",
    review_summary: "go ahead",
    final_write_plan: {
      plan_id: "plan-stale-sparkles-section",
      operation_type: "append-sparkle",
      origin: "capture",
      risk_level: "low",
      target_page: {
        page_kind: "daily-note",
        journal_date: input.todayDate,
        page_id: PAGE_ID,
        notebook_hint: "daily-notebook",
      },
      target_section: {
        section_kind: "sparkles",
        section_id: input.sectionId,
        section_label: "Sparkles",
        insertion_mode: "append",
      },
      content_preview: {
        body: input.body ?? "- repaired sparkle body",
        preview_format: "markdown",
      },
      side_effects: [
        {
          kind: "none",
          preview: "append one sparkle",
        },
      ],
    },
  });
}

test("prepare-capture-write-plan builds a stable Sparkles write plan from mocked HTTP reads", async () => {
  const mock = createMockButlerContext(createDailyJournalRoutes());

  const result = await handlePrepareCaptureWritePlan(mock.context, {
    journal_date: JOURNAL_DATE,
    draft: {
      source: "A note about keeping review boundaries first",
      glow: "Stabilize review-before-write before expanding capabilities",
      trace: ["runtime", "policy guard"],
    },
  });

  assert.match(result.plan_token, /^plan_[0-9a-f-]+$/);
  assert.equal(result.journal_date, JOURNAL_DATE);
  assert.equal(result.next_action, "review");
  assert.equal(result.blocked_by, undefined);

  const storedPlan = await mock.context.handoffStore.loadPlan(
    result.plan_token,
  );

  assert.match(storedPlan.plan_id, /^[0-9a-f-]+$/);
  assert.equal(storedPlan.operation_type, "append-sparkle");
  assert.equal(storedPlan.target_page.page_id, PAGE_ID);
  assert.deepEqual(storedPlan.target_section, {
    section_kind: "sparkles",
    section_id: SPARKLES_SECTION_ID,
    section_label: "Sparkles",
    insertion_mode: "append",
  });
  assert.equal(storedPlan.needs_confirmation, false);
  assert.match(
    storedPlan.content_preview.body,
    /Stabilize review-before-write before expanding capabilities/,
  );
  assert.equal(storedPlan.blocked_by, undefined);
  mock.assertAllRequestsHandled();
});

test("read-journal-context returns the first three block previews from the requested section", async () => {
  const mock = createMockButlerContext([
    ...createDailyJournalRoutes(),
    {
      path: "/api/block/getChildBlocks",
      body: { id: SPARKLES_SECTION_ID },
      data: [
        { id: "spark-1", type: "l" },
        { id: "spark-2", type: "p" },
        { id: "spark-3", type: "p" },
        { id: "spark-4", type: "p" },
      ],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: "spark-1" },
      data: { id: "spark-1", kramdown: "- First spark line" },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: "spark-2" },
      data: {
        id: "spark-2",
        kramdown: "Second spark paragraph\n\nMore detail",
      },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: "spark-3" },
      data: { id: "spark-3", kramdown: "Third spark paragraph" },
    },
  ]);

  const result = await handleReadJournalContext(mock.context, {
    journal_date: JOURNAL_DATE,
    section_kind: "sparkles",
  });

  assert.deepEqual(result.journal_context.summary_lines, [
    "- First spark line",
    "Second spark paragraph",
    "Third spark paragraph",
  ]);
  assert.deepEqual(result.journal_context.related_block_ids, [
    "spark-1",
    "spark-2",
    "spark-3",
  ]);
  mock.assertAllRequestsHandled();
});

test("read-journal-context reports a missing target section when the page exists but the section does not", async () => {
  const mock = createMockButlerContext(
    createJournalRoutesWithoutSparklesSection(),
  );

  const result = await handleReadJournalContext(mock.context, {
    journal_date: JOURNAL_DATE,
    section_kind: "sparkles",
  });

  assert.deepEqual(result.journal_context, {
    journal_date: JOURNAL_DATE,
    page_id: PAGE_ID,
    section_kind: "sparkles",
    summary_lines: ["目标章节 sparkles 尚不存在。"],
  });
  mock.assertAllRequestsHandled();
});

test("read-journal-context reports an empty target section when no preview blocks exist", async () => {
  const mock = createMockButlerContext([
    ...createDailyJournalRoutes(),
    {
      path: "/api/block/getChildBlocks",
      body: { id: SPARKLES_SECTION_ID },
      data: [],
    },
  ]);

  const result = await handleReadJournalContext(mock.context, {
    journal_date: JOURNAL_DATE,
    section_kind: "sparkles",
  });

  assert.deepEqual(result.journal_context, {
    journal_date: JOURNAL_DATE,
    page_id: PAGE_ID,
    section_kind: "sparkles",
    summary_lines: ["章节 Sparkles 目前为空。"],
    related_block_ids: [],
  });
  mock.assertAllRequestsHandled();
});

test("resolve-daily-journal-target reports blockers when the daily note does not exist", async () => {
  const mock = createMockButlerContext(createMissingDailyJournalRoutes());

  const result = await handleResolveDailyJournalTarget(mock.context, {
    journal_date: JOURNAL_DATE,
    section_kind: "sparkles",
  });

  assert.equal(result.resolution.journal.page_exists, false);
  assert.equal(result.resolution.target_page.page_id, undefined);
  assert.deepEqual(result.resolution.blocked_by, [
    `目标日志页 ${JOURNAL_DATE} 尚不存在。`,
    "目标章节 sparkles 尚不存在，暂不能形成稳定写入目标。",
    "目标章节 sparkles 当前不支持 append。",
  ]);
  mock.assertAllRequestsHandled();
});

test("capture flow downgrades when the target daily note is still missing", async () => {
  const mock = createMockButlerContext(createMissingDailyJournalRoutes());

  const prepared = await handlePrepareCaptureWritePlan(mock.context, {
    journal_date: JOURNAL_DATE,
    draft: {
      source: "Need a journal target before saving",
      glow: "Target resolution should block unsafe writes",
    },
  });
  const reviewed = await handleReviewWritePlan(mock.context, {
    plan_token: prepared.plan_token,
  });

  await assert.rejects(
    () => mock.context.handoffStore.loadPlan(prepared.plan_token),
    /未找到对应的 plan token 文件/,
  );

  assert.deepEqual(prepared.blocked_by, [
    `目标日志页 ${JOURNAL_DATE} 尚不存在。`,
    "目标章节 sparkles 尚不存在，暂不能形成稳定写入目标。",
    "目标章节 sparkles 当前不支持 append。",
  ]);
  assert.equal(prepared.next_action, "stop");
  assert.equal(reviewed.decision, "downgrade");
  assert.equal(reviewed.next_action, "stop");
  assert.equal(reviewed.review_token, undefined);
  assert.deepEqual(reviewed.blocked_by, [
    `目标日志页 ${JOURNAL_DATE} 尚不存在。`,
    "目标章节 sparkles 尚不存在，暂不能形成稳定写入目标。",
    "目标章节 sparkles 当前不支持 append。",
  ]);
  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan refuses ask_confirm results before confirmation and makes no HTTP calls", async () => {
  const mock = createMockButlerContext([]);
  const reviewToken = await mock.context.handoffStore.saveReview({
    decision: "ask_confirm",
    reason: "Need confirmation before write.",
    review_summary: "Still waiting for explicit confirmation.",
    final_write_plan: {
      plan_id: "plan-rekindle-pending",
      operation_type: "append-journal-entry",
      origin: "rekindle",
      target_page: {
        page_kind: "daily-note",
        journal_date: JOURNAL_DATE,
        page_id: PAGE_ID,
        notebook_hint: "daily-notebook",
      },
      target_section: {
        section_kind: "journal-body",
        section_id: JOURNAL_BODY_SECTION_ID,
        section_label: "Journal Body",
        insertion_mode: "append",
      },
      content_preview: {
        title: "Pending confirmation",
        body: "Wait for the user before writing.",
        preview_format: "markdown",
      },
      side_effects: [
        {
          kind: "none",
          preview:
            "Append the rekindled journal entry to the journal body only.",
        },
      ],
    },
  });

  await assert.rejects(
    () =>
      handleExecuteReviewedWritePlan(mock.context, {
        review_token: reviewToken,
      }),
    /当前 WritePlan 仍需用户确认，不能提前执行。/,
  );

  await assert.doesNotReject(() =>
    mock.context.handoffStore.loadReview(reviewToken),
  );

  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan retargets when the cached Sparkles section is missing but the page already has a valid heading", async () => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getPathByID",
      body: { id: PAGE_ID },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/filetree/getPathByID",
      body: { id: SPARKLES_SECTION_ID },
      payload: {
        code: 404,
        msg: "块不存在",
        data: null,
      },
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [{ id: REPAIRED_SPARKLES_SECTION_ID, type: "h" }],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: REPAIRED_SPARKLES_SECTION_ID },
      data: {
        id: REPAIRED_SPARKLES_SECTION_ID,
        kramdown: "# Sparkles",
      },
    },
    {
      path: "/api/attr/getBlockAttrs",
      body: { id: REPAIRED_SPARKLES_SECTION_ID },
      data: { "custom-daily-note-flow": "sparkle" },
    },
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: REPAIRED_SPARKLES_SECTION_ID,
        data: "- repaired sparkle body",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: NEW_SPARKLE_BLOCK_ID,
              parentID: REPAIRED_SPARKLES_SECTION_ID,
            },
          ],
        },
      ],
    },
  ]);
  const reviewToken = await saveAppendSparkleReview(mock, {
    todayDate,
    sectionId: SPARKLES_SECTION_ID,
  });

  const result = await handleExecuteReviewedWritePlan(mock.context, {
    review_token: reviewToken,
  });

  await assert.rejects(
    () => mock.context.handoffStore.loadReview(reviewToken),
    /未找到对应的 review token 文件/,
  );

  assert.equal(result.journal_date, todayDate);
  assert.equal(result.page_id, PAGE_ID);
  assert.equal(result.section_id, REPAIRED_SPARKLES_SECTION_ID);
  assert.equal(result.sparkle_block_id, NEW_SPARKLE_BLOCK_ID);
  assert.equal(result.repaired_section, true);
  assert.equal(result.next_action, "done");

  const cachedTarget =
    await mock.context.todaySparklesTargetCache.read(todayDate);

  assert.equal(cachedTarget?.page_id, PAGE_ID);
  assert.equal(cachedTarget?.section_id, REPAIRED_SPARKLES_SECTION_ID);
  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan retargets when the cached Sparkles section now points at another page", async () => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const movedSectionId = "heading-sparkles-moved";
  const currentSectionId = "heading-sparkles-current";
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getPathByID",
      body: { id: PAGE_ID },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/filetree/getPathByID",
      body: { id: movedSectionId },
      data: {
        notebook: "daily-notebook",
        path: "/archive/2026/03/2026-03-15.sy",
      },
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [{ id: currentSectionId, type: "h" }],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: currentSectionId },
      data: { id: currentSectionId, kramdown: "# Sparkles" },
    },
    {
      path: "/api/attr/getBlockAttrs",
      body: { id: currentSectionId },
      data: { "custom-daily-note-flow": "sparkle" },
    },
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: currentSectionId,
        data: "- repaired sparkle body",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: NEW_SPARKLE_BLOCK_ID,
              parentID: currentSectionId,
            },
          ],
        },
      ],
    },
  ]);
  const reviewToken = await saveAppendSparkleReview(mock, {
    todayDate,
    sectionId: movedSectionId,
  });

  const result = await handleExecuteReviewedWritePlan(mock.context, {
    review_token: reviewToken,
  });

  await assert.rejects(
    () => mock.context.handoffStore.loadReview(reviewToken),
    /未找到对应的 review token 文件/,
  );

  assert.equal(result.section_id, currentSectionId);
  assert.equal(result.repaired_section, true);
  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan retargets when the cached Sparkles heading label no longer matches but another valid heading exists", async () => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const renamedSectionId = "heading-sparkles-renamed";
  const currentSectionId = "heading-sparkles-current";
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getPathByID",
      body: { id: PAGE_ID },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/filetree/getPathByID",
      body: { id: renamedSectionId },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: renamedSectionId },
      data: { id: renamedSectionId, kramdown: "# Archived Sparkles" },
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [
        { id: renamedSectionId, type: "h" },
        { id: currentSectionId, type: "h" },
      ],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: renamedSectionId },
      data: { id: renamedSectionId, kramdown: "# Archived Sparkles" },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: currentSectionId },
      data: { id: currentSectionId, kramdown: "# Sparkles" },
    },
    {
      path: "/api/attr/getBlockAttrs",
      body: { id: currentSectionId },
      data: {},
    },
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: currentSectionId,
        data: "- repaired sparkle body",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: NEW_SPARKLE_BLOCK_ID,
              parentID: currentSectionId,
            },
          ],
        },
      ],
    },
  ]);
  const reviewToken = await saveAppendSparkleReview(mock, {
    todayDate,
    sectionId: renamedSectionId,
  });

  const result = await handleExecuteReviewedWritePlan(mock.context, {
    review_token: reviewToken,
  });

  await assert.rejects(
    () => mock.context.handoffStore.loadReview(reviewToken),
    /未找到对应的 review token 文件/,
  );

  assert.equal(result.section_id, currentSectionId);
  assert.equal(result.repaired_section, true);
  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan auto-repairs when the cached Sparkles heading is stale and the page has no valid replacement", async () => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const renamedSectionId = "heading-sparkles-renamed";
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getPathByID",
      body: { id: PAGE_ID },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/filetree/getPathByID",
      body: { id: renamedSectionId },
      data: {
        notebook: "daily-notebook",
        path: "/daily/2026/03/2026-03-17.sy",
      },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: renamedSectionId },
      data: { id: renamedSectionId, kramdown: "# Archived Sparkles" },
    },
    {
      path: "/api/block/getChildBlocks",
      body: { id: PAGE_ID },
      data: [
        { id: renamedSectionId, type: "h" },
        { id: JOURNAL_BODY_SECTION_ID, type: "h" },
      ],
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: renamedSectionId },
      data: { id: renamedSectionId, kramdown: "# Archived Sparkles" },
    },
    {
      path: "/api/block/getBlockKramdown",
      body: { id: JOURNAL_BODY_SECTION_ID },
      data: { id: JOURNAL_BODY_SECTION_ID, kramdown: "# Journal Body" },
    },
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: PAGE_ID,
        data: "## Sparkles",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: REPAIRED_SPARKLES_SECTION_ID,
              parentID: PAGE_ID,
            },
          ],
        },
      ],
    },
    {
      path: "/api/attr/setBlockAttrs",
      body: {
        id: REPAIRED_SPARKLES_SECTION_ID,
        attrs: { "custom-daily-note-flow": "sparkle" },
      },
      data: null,
    },
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: REPAIRED_SPARKLES_SECTION_ID,
        data: "- repaired sparkle body",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: NEW_SPARKLE_BLOCK_ID,
              parentID: REPAIRED_SPARKLES_SECTION_ID,
            },
          ],
        },
      ],
    },
  ]);
  const reviewToken = await saveAppendSparkleReview(mock, {
    todayDate,
    sectionId: renamedSectionId,
  });

  const result = await handleExecuteReviewedWritePlan(mock.context, {
    review_token: reviewToken,
  });

  await assert.rejects(
    () => mock.context.handoffStore.loadReview(reviewToken),
    /未找到对应的 review token 文件/,
  );

  assert.equal(result.journal_date, todayDate);
  assert.equal(result.page_id, PAGE_ID);
  assert.equal(result.section_id, REPAIRED_SPARKLES_SECTION_ID);
  assert.equal(result.sparkle_block_id, NEW_SPARKLE_BLOCK_ID);
  assert.equal(result.repaired_section, true);
  assert.equal(result.next_action, "done");

  const cachedTarget =
    await mock.context.todaySparklesTargetCache.read(todayDate);

  assert.equal(cachedTarget?.page_id, PAGE_ID);
  assert.equal(cachedTarget?.section_id, REPAIRED_SPARKLES_SECTION_ID);
  mock.assertAllRequestsHandled();
});

test("mocked SiYuan API failures surface through Butler MCP handlers", async () => {
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: DAILY_NOTE_PATH,
        notebook: "daily-notebook",
      },
      payload: {
        code: -1,
        msg: "mocked failure",
        data: null,
      },
    },
  ]);

  await assert.rejects(
    () =>
      handleResolveDailyJournalTarget(mock.context, {
        journal_date: JOURNAL_DATE,
        section_kind: "sparkles",
      }),
    /SiYuan API \/api\/filetree\/getIDsByHPath 调用失败: mocked failure/,
  );

  mock.assertAllRequestsHandled();
});

test("mocked HTTP status failures surface through Butler MCP handlers", async () => {
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: DAILY_NOTE_PATH,
        notebook: "daily-notebook",
      },
      status: 503,
      payload: {
        code: -1,
        msg: "service unavailable",
        data: null,
      },
    },
  ]);

  await assert.rejects(
    () =>
      handleResolveDailyJournalTarget(mock.context, {
        journal_date: JOURNAL_DATE,
        section_kind: "sparkles",
      }),
    /SiYuan API \/api\/filetree\/getIDsByHPath 返回 HTTP 503。/,
  );

  mock.assertAllRequestsHandled();
});

test("daily note path templates expand year month day and date variables", async () => {
  const mock = createMockButlerContext(
    [
      {
        path: "/api/filetree/getIDsByHPath",
        body: {
          path: "/journals/2026/03/16/2026-03-16",
          notebook: "daily-notebook",
        },
        data: [],
      },
    ],
    {
      SIYUAN_DAILY_NOTE_HPATH_TEMPLATE:
        "/journals/{{year}}/{{month}}/{{day}}/{{date}}",
    },
  );

  const result = await handleResolveDailyJournalTarget(mock.context, {
    journal_date: JOURNAL_DATE,
    section_kind: "sparkles",
  });

  assert.equal(result.resolution.journal.page_exists, false);
  mock.assertAllRequestsHandled();
});
