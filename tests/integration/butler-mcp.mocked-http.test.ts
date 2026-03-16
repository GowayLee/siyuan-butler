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

test("prepare-capture-write-plan builds a stable Sparkles write plan from mocked HTTP reads", async () => {
  const mock = createMockButlerContext(createDailyJournalRoutes());

  const result = await handlePrepareCaptureWritePlan(mock.context, {
    plan_id: "plan-capture-1",
    journal_date: JOURNAL_DATE,
    draft: {
      source: "A note about keeping review boundaries first",
      glow: "Stabilize review-before-write before expanding capabilities",
      trace: ["runtime", "policy guard"],
    },
  });

  assert.equal(result.write_plan.plan_id, "plan-capture-1");
  assert.equal(result.write_plan.operation_type, "append-sparkle");
  assert.equal(result.write_plan.target_page.page_id, PAGE_ID);
  assert.deepEqual(result.write_plan.target_section, {
    section_kind: "sparkles",
    section_id: SPARKLES_SECTION_ID,
    section_label: "Sparkles",
    insertion_mode: "append",
  });
  assert.equal(result.write_plan.needs_confirmation, false);
  assert.match(
    result.write_plan.content_preview.body,
    /Stabilize review-before-write before expanding capabilities/,
  );
  assert.equal(result.write_plan.blocked_by, undefined);
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
    plan_id: "plan-capture-missing-target",
    journal_date: JOURNAL_DATE,
    draft: {
      source: "Need a journal target before saving",
      glow: "Target resolution should block unsafe writes",
    },
  });
  const reviewed = handleReviewWritePlan({ write_plan: prepared.write_plan });

  assert.deepEqual(prepared.write_plan.blocked_by, [
    `目标日志页 ${JOURNAL_DATE} 尚不存在。`,
    "目标章节 sparkles 尚不存在，暂不能形成稳定写入目标。",
    "目标章节 sparkles 当前不支持 append。",
  ]);
  assert.equal(reviewed.review_result.decision, "downgrade");
  assert.equal(reviewed.review_result.downgrade_to, "sparkle-draft-only");
  mock.assertAllRequestsHandled();
});

test("execute-reviewed-write-plan refuses ask_confirm results before confirmation and makes no HTTP calls", async () => {
  const mock = createMockButlerContext([]);

  await assert.rejects(
    () =>
      handleExecuteReviewedWritePlan(mock.context, {
        review_result: {
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
        },
      }),
    /当前 WritePlan 仍需用户确认，不能提前执行。/,
  );

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
