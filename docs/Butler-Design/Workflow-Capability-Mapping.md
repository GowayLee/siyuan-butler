# Butler Workflow -> Capability 映射草案

## 1. 文档目的

本文档用于补上 `skill language -> domain object -> runtime capability -> adapter action` 之间缺失的中间层说明。

它回答四件事：

- Sparkle 主链路在 runtime 里到底需要哪些 capability
- 每个 capability 消费什么对象、产出什么对象
- 哪些职责属于 skill，哪些属于 application/use-case，哪些属于 adapter
- 哪些调用属于越权，V0 明确不允许

这份文档不是 SiYuan API 清单，也不是 MCP tool 菜单。它只描述 Butler V0 主链路真正需要的受控能力面。

## 2. 设计前提

- 顺序仍然是 `skill / workflow / object contract -> capability -> adapter`
- skill 负责语义判断、提案创作、成熟度判断与用户语气
- runtime 的 application/use-case 层负责把上游对象收敛成受控能力调用
- adapter 只做确定性读写与目标定位，不补做语义判断
- 所有写入仍必须经过 `WritePlan -> ReviewResult -> controlled write`

## 3. 分层边界

### 3.1 Skill 层负责什么

- `PKM Orchestrator` 决定当前留在整理、进入 capture、进入 rekindle，还是进入写入确认
- `Sparkle Capture` 产出 `SparkleDraft`
- `Sparkle Rekindle` 产出 `RekindleRequest` 与 `RekindleProposal`
- `PKM Policy Guard` 审查的是 `WritePlan`，不是底层 API 参数

Skill 层不应直接调用“任意写块”“任意更新属性”“任意搜索全库”这类原始动作。

### 3.2 Application / Use-case 层负责什么

- 接收已经成立的 `SparkleDraft` 或 `RekindleProposal`
- 结合 read-model 与 target resolver，把对象收敛为 `WritePlan`
- 调用 domain rule 构造 `ReviewResult`
- 在收到明确放行后，把 `ReviewResult.final_write_plan` 交给受控执行端口

Application 层不负责：

- 判断一段对话算不算 Sparkle
- 决定正式条目应该怎么写
- 直接实现 SiYuan HTTP 调用

### 3.3 Adapter 层负责什么

- 读取 daily note、Sparkle、章节等 read-model
- 定位 `sparkles` / `journal-body` 等目标 section
- 执行已经通过 review 的原子写入与必要回写
- 返回受影响对象与执行摘要

Adapter 层不负责：

- 把自由文本猜成 `SparkleDraft`
- 把 `RekindleProposal` 擅自改写成别的正文
- 绕过 `ReviewResult` 直接执行写入

## 4. V0 主链路 capability 白名单

### 4.1 `resolve-daily-journal-target`

- 用途：把目标日志日期收敛成 `TargetPageRef + TargetSectionRef`
- 典型输入：`journal_date`、`section_kind`
- 典型输出：可用于 `WritePlan` 的目标页/章节引用，以及未满足前置条件清单
- 使用方：capture/rekindle use-case
- 不做的事：不生成正文，不判断内容价值

### 4.2 `read-sparkle-record`

- 用途：按 `sparkle_id` 读取复燃所需的 Sparkle 快照与最小上下文
- 典型输入：`sparkle_id`
- 典型输出：`SparkleSnapshot`、Sparkle 状态、关联日志日期、可回写引用
- 使用方：rekindle use-case
- 不做的事：不直接决定这条 Sparkle 是否成熟

### 4.3 `read-journal-context`

- 用途：读取同日日志页或目标 section 的最小上下文，帮助 application 收敛目标
- 典型输入：`journal_date`、`section_kind`
- 典型输出：daily note read-model、section existence、轻量上下文摘要
- 使用方：capture/rekindle use-case
- 不做的事：不暴露任意全库浏览或原始 SQL 能力给 skill

### 4.4 `prepare-capture-write-plan`

- 用途：把 `SparkleDraft` 收敛为待审查 `WritePlan`
- 典型输入：`SparkleDraft` + resolved target
- 典型输出：`WritePlan`
- 使用方：capture use-case / future MCP capability
- 不做的事：不直接写入，不绕过 review

### 4.5 `prepare-rekindle-write-plan`

- 用途：把 `RekindleProposal` 收敛为待审查 `WritePlan`
- 典型输入：`RekindleProposal` + resolved target
- 典型输出：`WritePlan`
- 使用方：rekindle use-case / future MCP capability
- 不做的事：不隐式执行 Sparkle 状态回写

### 4.6 `review-write-plan`

- 用途：把 `WritePlan` 放进稳定的 Policy Guard 审查边界
- 典型输入：`WritePlan`
- 典型输出：`ReviewResult`
- 使用方：capture/rekindle use-case
- 不做的事：不创作 Sparkle 或正式条目内容

### 4.7 `execute-reviewed-write-plan`

- 用途：只执行已经被 `ReviewResult` 放行的 `final_write_plan`
- 典型输入：`ReviewResult` + confirmation flag
- 典型输出：写入摘要、受影响对象、回写结果
- 使用方：写入确认后的受控执行阶段
- 不做的事：不接受自由文本、不接受未经 review 的 `WritePlan`

## 5. workflow 到 capability 的映射

### 5.1 Capture 主链路

1. `Sparkle Capture` 产出 `SparkleDraft`
2. application 调用 `resolve-daily-journal-target`
3. application 调用 `prepare-capture-write-plan`
4. application 调用 `review-write-plan`
5. 若 `ReviewResult = allow`，或 `ask_confirm` 后用户确认，再调用 `execute-reviewed-write-plan`

### 5.2 Rekindle 主链路

1. `Sparkle Rekindle` 读取或接收 `RekindleRequest`
2. application 需要时调用 `read-sparkle-record` 与 `read-journal-context`
3. `Sparkle Rekindle` 产出 `RekindleProposal`
4. application 调用 `resolve-daily-journal-target`
5. application 调用 `prepare-rekindle-write-plan`
6. application 调用 `review-write-plan`
7. 若审查放行，再调用 `execute-reviewed-write-plan`

## 6. 明确禁止的越权调用

以下调用即使底层 SiYuan API 能做，V0 也不应给 skill 直接使用：

- 直接暴露任意 block append / update / delete
- 直接暴露任意文档创建、覆盖式更新、属性修改
- 直接暴露原始 SQL、模板执行、全量文件写入
- 让 skill 绕过 `WritePlan` 直接请求“把这段文本写进去”
- 让 adapter 在没有 `ReviewResult` 的情况下自行落盘
- 让 MCP runtime 根据 endpoint 便利性反向定义产品动作面

## 7. 对 MCP capability 命名的约束

- capability 名称应体现 workflow 目的，而不是底层 endpoint 名
- capability 入参应优先使用 `SparkleDraft`、`RekindleProposal`、`WritePlan`、`ReviewResult`
- capability 返回值应优先使用 read-model、`WritePlan`、`ReviewResult`、execution receipt
- MCP server 现阶段可以只保留 capability 注册位，但不应先暴露 raw tool 菜单

## 8. 当前阶段最小落地建议

V0 当前最值得先落下的 runtime 能力组合是：

- `resolve-daily-journal-target`
- `prepare-capture-write-plan`
- `prepare-rekindle-write-plan`
- `review-write-plan`
- `execute-reviewed-write-plan`

这样可以先把 `skill -> application -> domain -> adapter` 的主链路收拢稳定，再逐步补更细的读取能力，而不是一开始把 MCP 做成一排动作用按钮。
