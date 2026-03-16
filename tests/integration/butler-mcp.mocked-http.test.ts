import assert from "node:assert/strict";
import test from "node:test";

import { handleExecuteReviewedWritePlan } from "../../src/butler-mcp/capabilities/execute-reviewed-write-plan/handler.js";
import { handlePrepareCaptureWritePlan } from "../../src/butler-mcp/capabilities/prepare-capture-write-plan/handler.js";
import { handlePrepareRekindleWritePlan } from "../../src/butler-mcp/capabilities/prepare-rekindle-write-plan/handler.js";
import { handleReadJournalContext } from "../../src/butler-mcp/capabilities/read-journal-context/handler.js";
import { handleReadSparkleRecord } from "../../src/butler-mcp/capabilities/read-sparkle-record/handler.js";
import { handleResolveDailyJournalTarget } from "../../src/butler-mcp/capabilities/resolve-daily-journal-target/handler.js";
import { handleReviewWritePlan } from "../../src/butler-mcp/capabilities/review-write-plan/handler.js";
import type { ExpectedSiyuanRequest } from "../fixtures/mock-siyuan-http.js";
import { createMockButlerContext } from "../fixtures/mock-siyuan-http.js";

const JOURNAL_DATE = "2026-03-16";
const PAGE_ID = "page-20260316";
const SPARKLES_SECTION_ID = "heading-sparkles";
const JOURNAL_BODY_SECTION_ID = "heading-journal-body";

function createDailyJournalRoutes(): ExpectedSiyuanRequest[] {
  return [
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: "/daily/2026-03-16",
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
        path: "/daily/2026-03-16",
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
        path: "/daily/2026-03-16",
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
    draft: {
      id: "sparkle-draft-1",
      created_at: "2026-03-16T08:30:00Z",
      source_type: "conversation",
      sparkle_kind: "cognitive",
      source: "A note about keeping review boundaries first",
      glow: "Stabilize review-before-write before expanding capabilities",
      status: "captured",
      write_intent: "user_requested_save",
      target_journal_date: JOURNAL_DATE,
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
    draft: {
      id: "sparkle-draft-missing-target",
      created_at: "2026-03-16T08:30:00Z",
      source_type: "conversation",
      sparkle_kind: "cognitive",
      source: "Need a journal target before saving",
      glow: "Target resolution should block unsafe writes",
      status: "captured",
      write_intent: "user_requested_save",
      target_journal_date: JOURNAL_DATE,
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

test("read-sparkle-record merges mocked attrs, preview markdown, and hpath metadata", async () => {
  const mock = createMockButlerContext([
    {
      path: "/api/block/getBlockKramdown",
      body: { id: "sparkle-001" },
      data: {
        id: "sparkle-001",
        kramdown:
          "- Glow from markdown\n  - source: Source from markdown\n  - trace: alpha | beta\n  - pull: gamma",
      },
    },
    {
      path: "/api/attr/getBlockAttrs",
      body: { id: "sparkle-001" },
      data: {
        "custom-butler-source": "Source from attrs",
        "custom-butler-status": "rekindled",
        updated: "20260316124530",
      },
    },
    {
      path: "/api/filetree/getHPathByID",
      body: { id: "sparkle-001" },
      data: "/daily/2026-03-16",
    },
  ]);

  const result = await handleReadSparkleRecord(mock.context, {
    sparkle_id: "sparkle-001",
  });

  assert.deepEqual(result.sparkle_record, {
    id: "sparkle-001",
    snapshot: {
      id: "sparkle-001",
      source: "Source from attrs",
      glow: "Glow from markdown",
      trace: ["alpha", "beta"],
      pull: ["gamma"],
    },
    status: "rekindled",
    journal_date: JOURNAL_DATE,
    block_id: "sparkle-001",
    updated_at: "2026-03-16T12:45:30Z",
  });
  mock.assertAllRequestsHandled();
});

test("read-sparkle-record returns undefined when source and glow cannot be recovered", async () => {
  const mock = createMockButlerContext([
    {
      path: "/api/block/getBlockKramdown",
      body: { id: "sparkle-empty" },
      data: {
        id: "sparkle-empty",
        kramdown: "Just a plain paragraph without Sparkle structure",
      },
    },
    {
      path: "/api/attr/getBlockAttrs",
      body: { id: "sparkle-empty" },
      data: {
        updated: "20260316124530",
      },
    },
    {
      path: "/api/filetree/getHPathByID",
      body: { id: "sparkle-empty" },
      data: "/daily/2026-03-16",
    },
  ]);

  const result = await handleReadSparkleRecord(mock.context, {
    sparkle_id: "sparkle-empty",
  });

  assert.equal(result.sparkle_record, undefined);
  mock.assertAllRequestsHandled();
});

test("rekindle flow downgrades when the read-model date and write target date disagree", async () => {
  const mock = createMockButlerContext(createDailyJournalRoutes());

  const prepared = await handlePrepareRekindleWritePlan(mock.context, {
    plan_id: "plan-rekindle-date-mismatch",
    journal_date: JOURNAL_DATE,
    proposal: {
      source_sparkle_id: "sparkle-source-2",
      rekindle_mode: "full",
      maturity: "ready",
      entry_title: "Date mismatch",
      entry_body:
        "The proposal points at a different day than the loaded journal model.",
      entry_reason:
        "This should stay blocked until the correct target is loaded.",
      write_target: {
        page_kind: "daily-note",
        journal_date: "2026-03-17",
        section_kind: "journal-body",
        section_label: "Journal Body",
      },
      backref_needed: false,
    },
  });
  const reviewed = handleReviewWritePlan({ write_plan: prepared.write_plan });

  assert.deepEqual(prepared.write_plan.blocked_by, [
    "目标日志页 2026-03-17 尚不存在。",
    "目标章节 journal-body 尚不存在，暂不能形成稳定写入目标。",
    `当前 journal read-model 属于 ${JOURNAL_DATE}，不能直接拿来定位 2026-03-17 的写入目标。`,
  ]);
  assert.equal(reviewed.review_result.decision, "downgrade");
  assert.equal(reviewed.review_result.downgrade_to, "proposal-only");
  mock.assertAllRequestsHandled();
});

test("rekindle flow prepares, reviews, and executes a confirmed write with Sparkle backwrite", async () => {
  const mock = createMockButlerContext([
    ...createDailyJournalRoutes(),
    {
      path: "/api/block/appendBlock",
      body: {
        parentID: JOURNAL_BODY_SECTION_ID,
        data: "### Review Boundaries First\n\nLock the write boundary before widening the MCP surface.",
        dataType: "markdown",
      },
      data: [
        {
          doOperations: [
            {
              action: "append",
              id: "journal-entry-1",
              parentID: JOURNAL_BODY_SECTION_ID,
            },
          ],
        },
      ],
    },
    {
      path: "/api/attr/setBlockAttrs",
      body: {
        id: "sparkle-source-1",
        attrs: {
          "custom-butler-status": "rekindled",
          "custom-butler-journal-date": JOURNAL_DATE,
          "custom-butler-entry-ref": "journal-entry-1",
        },
      },
      data: null,
    },
  ]);

  const prepared = await handlePrepareRekindleWritePlan(mock.context, {
    plan_id: "plan-rekindle-1",
    proposal: {
      source_sparkle_id: "sparkle-source-1",
      rekindle_mode: "full",
      maturity: "ready",
      entry_title: "Review Boundaries First",
      entry_body: "Lock the write boundary before widening the MCP surface.",
      entry_reason:
        "This insight is concrete enough to become a journal entry.",
      write_target: {
        page_kind: "daily-note",
        journal_date: JOURNAL_DATE,
        section_kind: "journal-body",
        section_label: "Journal Body",
      },
      backref_needed: true,
      backref_hint:
        "Mark the source Sparkle as rekindled after the entry lands.",
    },
  });
  const reviewed = handleReviewWritePlan({ write_plan: prepared.write_plan });
  const executed = await handleExecuteReviewedWritePlan(mock.context, {
    review_result: reviewed.review_result,
    confirmation_granted: true,
  });

  assert.equal(reviewed.review_result.decision, "ask_confirm");
  assert.equal(executed.receipt.plan_id, "plan-rekindle-1");
  assert.equal(
    executed.receipt.summary,
    "已写入正式条目，并完成 1 项 Sparkle 回写。",
  );
  assert.deepEqual(executed.receipt.affected_objects, [
    {
      object_type: "daily-note",
      object_id: PAGE_ID,
      note: JOURNAL_DATE,
    },
    {
      object_type: "section",
      object_id: JOURNAL_BODY_SECTION_ID,
      note: "Journal Body",
    },
    {
      object_type: "journal-entry",
      object_id: "journal-entry-1",
    },
    {
      object_type: "sparkle",
      object_id: "sparkle-source-1",
      note: "backwrite",
    },
  ]);
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
                note: "Append the rekindled journal entry to the journal body only.",
              },
            ],
          },
        },
      }),
    /当前 WritePlan 仍需用户确认，不能提前执行。/,
  );

  mock.assertAllRequestsHandled();
});

test("prepare handlers require a journal date when their payload does not already pin one down", async () => {
  const mock = createMockButlerContext([]);

  await assert.rejects(
    () =>
      handlePrepareCaptureWritePlan(mock.context, {
        plan_id: "plan-capture-no-date",
        draft: {
          id: "sparkle-draft-no-date",
          created_at: "2026-03-16T08:30:00Z",
          source_type: "conversation",
          sparkle_kind: "cognitive",
          source: "No journal date yet",
          glow: "The handler should reject ambiguous targets",
          status: "captured",
        },
      }),
    /prepare-capture-write-plan 需要 journal_date，或 draft.target_journal_date 已明确。/,
  );

  await assert.rejects(
    () =>
      handlePrepareRekindleWritePlan(mock.context, {
        plan_id: "plan-rekindle-no-date",
        proposal: {
          source_sparkle_id: "sparkle-source-no-date",
          rekindle_mode: "full",
          maturity: "ready",
          entry_title: "No journal date",
          entry_body: "The handler should demand an explicit target date.",
          entry_reason:
            "Without a journal date the target page remains ambiguous.",
          write_target: {
            page_kind: "daily-note",
            section_kind: "journal-body",
            section_label: "Journal Body",
          },
        },
      }),
    /prepare-rekindle-write-plan 需要 journal_date，或 proposal.write_target.journal_date 已明确。/,
  );

  mock.assertAllRequestsHandled();
});

test("mocked SiYuan API failures surface through Butler MCP handlers", async () => {
  const mock = createMockButlerContext([
    {
      path: "/api/filetree/getIDsByHPath",
      body: {
        path: "/daily/2026-03-16",
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
        path: "/daily/2026-03-16",
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
