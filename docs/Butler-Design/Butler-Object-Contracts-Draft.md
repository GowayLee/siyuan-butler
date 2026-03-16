# Butler 核心对象契约草案

## 1. 文档目的

本文档用于把 V0 主链路中的五个核心对象进一步细化成一版稳定的上游契约草案。

这里的重点是：

- 明确每个对象在工作流中的用途
- 明确核心字段、可选字段、枚举值与语义约束
- 明确对象之间的转换关系
- 区分哪些字段服务于低摩擦 capture，哪些字段服务于 review / controlled write

这里讨论的是 schema / TypeScript 类型草案层面的契约，不是底层存储结构，也不是 MCP 工具入参设计。

## 2. 设计前提

这份对象契约建立在以下前提之上：

- Butler 是笔记管家，不是 CRUD 机器人
- 主链路遵循 `propose -> review -> write`
- `SparkleDraft` 的定义首先受 `docs/Butler-PKM/Sparkle-model.md` 约束
- Sparkle 不是完整笔记，也不是文本摘要，而是“最小可回忆单元”与“重返入口”
- Sparkle 的最低结构必须保住“一个触发物 + 一个方向感”
- `source` / `glow` 是核心槽位，`trace` / `pull` 是可选增强
- 低摩擦优先，不把 capture 退化成表单填写

因此，后续如果在 runtime 中引入更工程化的字段，这些字段也只能为工作流服务，不能把上游对象改写成僵硬的数据表。

## 3. 总体设计原则

### 3.1 对象分层原则

- `SparkleDraft`、`RekindleRequest`、`RekindleProposal` 属于语义对象
- `WritePlan`、`ReviewResult` 属于受控执行边界对象
- 越靠前的对象越应保留模糊但有方向的语义空间
- 越靠后的对象越应减少歧义、增强预览性与可执行性

### 3.2 字段设计原则

- 能从对话与上下文中自动抽取的信息，不要求用户显式提供
- 低摩擦字段优先表达“重返入口”，不优先表达“信息完备”
- review / write 字段优先表达“写到哪里、会影响什么、需不需要确认”
- 不把感受型 sparkle 强行翻译成解释性 prose
- 不把认知型 sparkle 压扁成中性摘要

### 3.3 表达形式原则

为兼容后续 TypeScript 落地，本文同时给出“字段语义”和“类型草案风格”的描述；但这里的主语仍然是上游契约，而不是实现教程。

## 4. 对象一：`SparkleDraft`

### 4.1 对象目的

`SparkleDraft` 表示一个已经被接住、但仍然保持轻量的 Sparkle 草案。

它的目标不是完整表达刚才发生了什么，而是保住一个未来可回到原状态的入口。

### 4.2 核心语义

`SparkleDraft` 必须保住以下判断：

- 它从哪里亮起来
- 它亮的是什么
- 未来的自己可以借它往哪边再碰

如果一个草案看起来信息很多，但无法让未来的自己“回去”，那它仍然是失败的 `SparkleDraft`。

### 4.3 建议字段

#### 必需字段

- `source: string`
  - 核心槽位之一
  - 表示触发源，可是曲目、链接、对话主题、实验场景、图片描述、网页标题等

- `glow: string`
  - 核心槽位之一
  - 表示最想保住的感受、判断、联想或方向

#### 可选字段

- `trace?: string[]`
  - 可选增强槽位
  - 用于保留截图线索、时间戳、引用片段、局部观察、对话摘句等
  - 允许极短，不要求形成说明文

- `pull?: string[]`
  - 可选增强槽位
  - 用于保留后续牵引方向、待展开问题、潜在主题

### 4.4 当前收敛建议

- `SparkleDraft` 在当前 runtime 落地阶段应尽量只保留 `source`、`glow`、`trace?`、`pull?`
- `journal_date` 应作为写入目标输入存在，而不是 `SparkleDraft` 本体字段
- `id`、状态、attrs 映射字段不应成为 capture 成稿前提

### 4.5 关键语义约束

- `source` 与 `glow` 至少都应可用；没有这两者，就不应算成立的 Sparkle
- `trace` 与 `pull` 是增强，不是表单必填项
- `glow` 可以是词组、判断句、意象、类比、待展开问题，不要求完整句法
- 感受型 sparkle 允许比认知型更模糊，但不能完全没有方向感
- 认知型 sparkle 允许只保留一句判断，但不能退化成材料摘抄
- 不让 `SparkleDraft` 背上 id、状态、时间、类型、意图这类管理字段，避免 capture 退化成填表

### 4.6 为低摩擦 capture 服务的字段

- 核心：`source`、`glow`
- 增强：`trace`、`pull`

### 4.7 为 review / write 服务的字段

- `journal_date`（作为 capability 输入，而不是 `SparkleDraft` 字段）

## 5. 当前阶段关于 rekindle 的说明

- `RekindleRequest` 与 `RekindleProposal` 仍保留为未来设计草案
- 当前 runtime 先不把它们当作已稳定落地的执行契约
- 因此下面两节保留为后续设计参考，不代表当前最小落地范围

## 6. 对象二：`RekindleRequest`

### 5.1 对象目的

`RekindleRequest` 用于把“继续展开某条 Sparkle”组织成一个稳定输入对象。

它的重点不是复述原 Sparkle，而是说明：这次为什么要碰它、准备碰到多深、当前已有的补充上下文是什么。

### 5.2 建议字段

#### 必需字段

- `sparkle_id: string`
  - 对应目标 Sparkle

- `sparkle_snapshot: SparkleSnapshot`
  - 目标 Sparkle 的轻量快照
  - 至少应保留 `source`、`glow`、`trace`、`pull` 中的关键部分

- `trigger: RekindleTrigger`
  - 这次为什么进入 rekindle
  - 可能是用户点名、对话自然成熟、或 Butler 建议展开

- `user_goal: RekindleGoal`
  - 用户这次真正想得到什么

- `desired_depth: RekindleDepth`
  - 预期展开深度

#### 可选字段

- `related_context?: string[]`
  - 同日记录、补充讨论、相关观察、引用片段等

- `focus_question?: string`
  - 如果这次复燃是围绕一个待展开问题，可以保存在这里

- `maturity_hint?: MaturityHint`
  - 当前为何判断它可能已成熟，或仍未确定

- `target_journal_date?: string`
  - 预期写入日期，默认通常是当前日记页

- `constraints?: string[]`
  - 用户施加的边界，例如“先写短一点”“只做提案不落盘”

- `conversation_excerpt?: string`
  - 导致本次 rekindle 的对话片段摘要

- `proposed_title_direction?: string`
  - 若对标题方向已初见雏形，可先挂一个提示

### 5.3 建议枚举与辅助类型

```ts
type RekindleTrigger =
  | "user-explicit"
  | "conversation-matured"
  | "butler-suggested";

type RekindleGoal =
  | "test-maturity"
  | "shape-entry"
  | "write-journal-entry"
  | "keep-as-sparkle";

type RekindleDepth = "light" | "standard" | "deep";

type MaturityHint = "unclear" | "emerging" | "ready";

type SparkleSnapshot = {
  source: string;
  glow: string;
  trace?: string[];
  pull?: string[];
};
```

### 5.4 关键语义约束

- `sparkle_snapshot` 不能把原 Sparkle 抹平成普通摘要，必须保住原火花切面
- `user_goal` 表达的是这次复燃意图，不等于最终一定写入
- `desired_depth` 用于控制条目展开力度，不用于逼迫内容变长
- `related_context` 只是补充，不应用它覆盖掉 Sparkle 本身

### 5.5 为低摩擦 rekindle 服务的字段

- `sparkle_snapshot`
- `trigger`
- `focus_question`
- `related_context`

### 5.6 为 review / write 服务的字段

- `user_goal`
- `desired_depth`
- `target_journal_date`
- `constraints`
- `maturity_hint`

## 7. 对象三：`RekindleProposal`

### 6.1 对象目的

`RekindleProposal` 表示“这条 Sparkle 现在可以如何被写成正式条目”的提案结果。

它不是最终写入动作，而是一个可审查、可预览、可拒绝的正式记录候选。

### 6.2 建议字段

#### 必需字段

- `source_sparkle_id: string`
  - 提案来源 Sparkle

- `rekindle_mode: RekindleMode`
  - 本次应简写、完整写，还是延后

- `maturity: ProposalMaturity`
  - 当前成熟度判断

- `entry_title: string`
  - 正式条目标题或标题方向

- `entry_body: string`
  - 正式条目正文提案

- `entry_reason: string`
  - 为什么现在值得写入时间线

- `write_target: WriteTargetHint`
  - 预期写入位置提示

#### 可选字段

- `summary_line?: string`
  - 给 Orchestrator 或 Guard 展示的超短概括

- `open_questions?: string[]`
  - 仍存在但不阻断提案成立的问题

- `evidence?: string[]`
  - 支撑此提案的关键上下文或原话

- `backref_needed?: boolean`
  - 是否需要回写 Sparkle 状态或关联信息

- `backref_hint?: string`
  - 如果要回写，回写的大致意图

- `downgrade_reason?: string`
  - 当 `rekindle_mode = 'postpone'` 时，说明为什么先不写

- `style_hint?: EntryStyleHint`
  - 条目风格方向，例如判断型、观察型、感受型

- `confidence?: ProposalConfidence`
  - skill 对提案成立性的把握

### 6.3 建议枚举与辅助类型

```ts
type RekindleMode = "brief" | "full" | "postpone";

type ProposalMaturity = "borderline" | "ready" | "strong";

type EntryStyleHint = "judgment" | "observation" | "affective" | "mixed";

type ProposalConfidence = "low" | "medium" | "high";

type WriteTargetHint = {
  journal_date?: string;
  page_kind: "daily-note";
  section_kind: "sparkles" | "journal-body";
  section_label?: string;
};
```

### 6.4 关键语义约束

- `rekindle_mode = 'postpone'` 时，`entry_body` 可以保留轻量提案，但不能伪装成已准备写入
- `entry_reason` 必须说明“为什么值得现在写”，而不是重复正文内容
- `write_target.section_kind` 对复燃主链路通常应为 `journal-body`
- `backref_needed` 只表达是否需要回写，不等于已被允许执行回写

### 6.5 为低摩擦 rekindle 服务的字段

- `summary_line`
- `open_questions`
- `style_hint`
- `downgrade_reason`

### 6.6 为 review / write 服务的字段

- `rekindle_mode`
- `maturity`
- `entry_title`
- `entry_body`
- `entry_reason`
- `write_target`
- `backref_needed`

## 7. 对象四：`WritePlan`

### 7.1 对象目的

`WritePlan` 是语义提案进入 Policy Guard 前的受控动作对象。

它的作用是把“这段内容值得写”进一步收敛成“准备写到哪里、写什么、会产生哪些影响”。

### 7.2 建议字段

#### 必需字段

- `plan_id: string`
  - 写入计划 id

- `operation_type: WriteOperationType`
  - 主操作类型

- `target_page: TargetPageRef`
  - 目标页面

- `target_section: TargetSectionRef`
  - 目标章节或逻辑位置

- `content_preview: ContentPreview`
  - 写入预览

- `side_effects: SideEffect[]`
  - 副作用清单

- `origin: WritePlanOrigin`
  - 此计划来自 capture 还是 rekindle

#### 可选字段

- `backwrite_actions?: BackwriteAction[]`
  - 附带的回写动作，例如更新 Sparkle 状态、记录反向关联

- `risk_level?: WriteRiskLevel`
  - 风险级别

- `needs_confirmation?: boolean`
  - 在进入 Guard 前的建议确认标志

- `scope_note?: string`
  - 对本次写入范围的额外说明

- `preconditions?: string[]`
  - 执行前必须满足的前置条件

- `blocked_by?: string[]`
  - 当前仍阻断执行的问题

- `source_refs?: SourceRef[]`
  - 本次计划参考了哪些对象或上下文

### 7.3 建议枚举与辅助类型

```ts
type WriteOperationType =
  | "append-sparkle"
  | "append-journal-entry"
  | "update-sparkle-status"
  | "record-rekindle-backref";

type WritePlanOrigin = "capture" | "rekindle";

type WriteRiskLevel = "low" | "medium" | "high";

type TargetPageRef = {
  page_kind: "daily-note";
  journal_date: string;
  page_id?: string;
  notebook_hint?: string;
};

type TargetSectionRef = {
  section_kind: "sparkles" | "journal-body";
  section_id?: string;
  section_label?: string;
  insertion_mode: "append";
};

type ContentPreview = {
  title?: string;
  body: string;
  preview_format: "markdown";
};

type SideEffect = {
  kind:
    | "none"
    | "status-backwrite"
    | "reference-backwrite"
    | "multi-block-write";
  note: string;
};

type BackwriteAction = {
  action_type: "mark-rekindled" | "link-entry" | "update-metadata";
  target_id: string;
  preview: string;
};

type SourceRef = {
  ref_type: "sparkle" | "proposal" | "conversation";
  ref_id?: string;
  note?: string;
};
```

### 7.4 关键语义约束

- `WritePlan` 必须足够清晰，以便用户能看懂“会写什么、写到哪里、额外会发生什么”
- 如果 `blocked_by` 仍非空，计划原则上不应进入可执行状态
- `side_effects` 不应省略；即使没有副作用，也应明确写出 `none`
- 正式条目写入和状态回写不应混成一句模糊描述，必须能被预览到

### 7.5 为低摩擦 capture / rekindle 服务的字段

- `scope_note`
- `source_refs`

### 7.6 为 review / controlled write 服务的字段

- `operation_type`
- `target_page`
- `target_section`
- `content_preview`
- `side_effects`
- `backwrite_actions`
- `risk_level`
- `needs_confirmation`
- `preconditions`
- `blocked_by`

## 8. 对象五：`ReviewResult`

### 8.1 对象目的

`ReviewResult` 是 `PKM Policy Guard` 对 `WritePlan` 的审核结论。

它决定这次流程是继续执行、先确认、降级成非写入结果，还是直接拒绝。

### 8.2 建议字段

#### 必需字段

- `decision: ReviewDecision`
  - 最终结论

- `reason: string`
  - 做出该判断的主要理由

- `review_summary: string`
  - 给上游与用户的简短判断说明

#### 可选字段

- `user_prompt?: string`
  - 若需要用户动作，推荐的提示表达

- `final_write_plan?: WritePlan`
  - 若结论允许继续，此处带上最终批准版本

- `downgrade_to?: DowngradeTarget`
  - 若降级，降成什么结果形态

- `downgrade_note?: string`
  - 若降级，如何向用户解释

- `reject_code?: RejectCode`
  - 若拒绝，归因类别

- `confirm_scope?: string`
  - 若需确认，确认点是什么

- `review_checks?: ReviewCheck[]`
  - 审查通过/未通过项

### 8.3 建议枚举与辅助类型

```ts
type ReviewDecision = "allow" | "ask_confirm" | "downgrade" | "reject";

type DowngradeTarget =
  | "proposal-only"
  | "sparkle-draft-only"
  | "suggestion-only";

type RejectCode =
  | "user-opt-out"
  | "target-missing"
  | "target-ambiguous"
  | "semantic-mismatch"
  | "low-value-noise"
  | "risk-too-high";

type ReviewCheck = {
  check:
    | "target-clear"
    | "preview-clear"
    | "semantic-fit"
    | "side-effects-acceptable";
  result: "pass" | "warn" | "fail";
  note?: string;
};
```

### 8.4 关键语义约束

- `allow` 与 `ask_confirm` 应带有可执行的 `final_write_plan`
- `downgrade` 不只是说“不写”，还要说明保留下来的非写入结果是什么
- `reject` 应说明不能继续的理由，且不应用含糊表述掩盖真实阻断点
- `user_prompt` 应保持 Butler 语气，不写成系统告警文案

### 8.5 为低摩擦体验服务的字段

- `review_summary`
- `user_prompt`
- `downgrade_note`

### 8.6 为 review / controlled write 服务的字段

- `decision`
- `final_write_plan`
- `confirm_scope`
- `review_checks`
- `reject_code`

## 9. 对象之间的标准转换关系

### 9.1 Capture 主链路

标准顺序：

1. 对话片段或外部触发线索进入 `PKM Orchestrator`
2. `Sparkle Capture` 从中抽取并形成 `SparkleDraft`
3. 若用户或上下文表现出保存意图，`SparkleDraft` 被收敛为 `WritePlan`
4. `PKM Policy Guard` 基于 `WritePlan` 形成 `ReviewResult`
5. 只有 `ReviewResult.decision` 为 `allow`，或 `ask_confirm` 后获得确认，runtime 才能执行写入

### 9.2 Rekindle 主链路

标准顺序：

1. 既有 Sparkle 与当前讨论被整理成 `RekindleRequest`
2. `Sparkle Rekindle` 判断成熟度并形成 `RekindleProposal`
3. `RekindleProposal` 被进一步收敛为 `WritePlan`
4. `PKM Policy Guard` 对 `WritePlan` 做审查并返回 `ReviewResult`
5. 审查通过后，runtime 执行正式条目写入与必要回写

### 9.3 允许的降级关系

- `SparkleDraft -> proposal-only`
  - 已形成草案，但不写入

- `RekindleRequest -> 保留为 Sparkle`
  - 发现尚未成熟，继续保留为 Sparkle，而不是推进到正式条目提案

- `RekindleProposal -> proposal-only`
  - 提案成立，但当前不进入写入

- `WritePlan -> downgrade`
  - 写入计划存在价值，但条件不足或副作用不宜立即执行

### 9.4 不允许的跳跃关系

- 不允许 `Sparkle Capture` 直接执行写入
- 不允许 `Sparkle Rekindle` 直接绕过 `ReviewResult`
- 不允许 runtime 自行把对话片段推断成 `SparkleDraft`
- 不允许 Policy Guard 反过来创作正式条目正文

## 10. 一版 TypeScript 风格总览草案

以下总览仅用于帮助后续 runtime 形成稳定对象名，不代表现在就要在 `src/` 中锁死实现。

```ts
export type SparkleDraft = {
  id: string;
  created_at: string;
  source_type: SparkleSourceType;
  sparkle_kind: SparkleKind;
  source: string;
  glow: string;
  status: SparkleDraftStatus;
  trace?: string[];
  pull?: string[];
  source_excerpt?: string;
  context?: string;
  why_it_matters?: string;
  next_hint?: string;
  target_journal_date?: string;
  capture_mode?: CaptureMode;
  confidence?: CaptureConfidence;
  write_intent?: WriteIntent;
  tags_hint?: string[];
};

export type RekindleRequest = {
  sparkle_id: string;
  sparkle_snapshot: SparkleSnapshot;
  trigger: RekindleTrigger;
  user_goal: RekindleGoal;
  desired_depth: RekindleDepth;
  related_context?: string[];
  focus_question?: string;
  maturity_hint?: MaturityHint;
  target_journal_date?: string;
  constraints?: string[];
  conversation_excerpt?: string;
  proposed_title_direction?: string;
};

export type RekindleProposal = {
  source_sparkle_id: string;
  rekindle_mode: RekindleMode;
  maturity: ProposalMaturity;
  entry_title: string;
  entry_body: string;
  entry_reason: string;
  write_target: WriteTargetHint;
  summary_line?: string;
  open_questions?: string[];
  evidence?: string[];
  backref_needed?: boolean;
  backref_hint?: string;
  downgrade_reason?: string;
  style_hint?: EntryStyleHint;
  confidence?: ProposalConfidence;
};

export type WritePlan = {
  plan_id: string;
  operation_type: WriteOperationType;
  target_page: TargetPageRef;
  target_section: TargetSectionRef;
  content_preview: ContentPreview;
  side_effects: SideEffect[];
  origin: WritePlanOrigin;
  backwrite_actions?: BackwriteAction[];
  risk_level?: WriteRiskLevel;
  needs_confirmation?: boolean;
  scope_note?: string;
  preconditions?: string[];
  blocked_by?: string[];
  source_refs?: SourceRef[];
};

export type ReviewResult = {
  decision: ReviewDecision;
  reason: string;
  review_summary: string;
  user_prompt?: string;
  final_write_plan?: WritePlan;
  downgrade_to?: DowngradeTarget;
  downgrade_note?: string;
  reject_code?: RejectCode;
  confirm_scope?: string;
  review_checks?: ReviewCheck[];
};
```

## 11. 当前阶段的使用建议

- 这份契约应作为后续 skill `SKILL.md` 草案的共享参照
- 如果后续要落到 `src/domain/` 或 `src/shared/`，应先遵守这里的字段语义，再讨论命名微调
- 若实现中发现某些字段过细，应优先删去工程噪声字段，而不是删掉 `source` / `glow` 这类方法论核心
- 若后续需要扩展对象，也应优先新增可选字段，而不是破坏当前主链路中的核心语义骨架
