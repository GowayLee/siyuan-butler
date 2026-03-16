# Sparkle Skill 上游设计

## 1. 文档目的与范围

本文档用于把 Sparkle 主链路的上游设计写清楚，作为后续 `skill suite + TypeScript Butler MCP runtime` 方案的前置约束。

这里讨论的是：

- `PKM Orchestrator`、`Sparkle Capture`、`Sparkle Rekindle`、`PKM Policy Guard` 在 Sparkle 主链路中的角色边界
- 从闲聊整理到轻捕获、复燃提案、写入确认、降级或拒绝的状态流转
- `SparkleDraft`、`RekindleRequest`、`RekindleProposal`、`WritePlan`、`ReviewResult` 的对象契约与转换关系

这里不讨论的是：

- MCP 工具清单
- TypeScript 目录内的具体实现方式
- 原始 SiYuan API 或 `vendor/` 里的 endpoint 形状

这份文档的定位是上游设计，而不是实现说明。它的作用是先把 Sparkle 的语义边界稳定下来，再反推后续 MCP capability。

## 2. 已确认的设计前提

Sparkle 主链路的上游设计建立在以下前提之上：

- Butler 的最终形态是 `Skill suite + TypeScript Butler MCP runtime`
- `vendor/` 只提供底层语义参考，不反向定义产品边界
- 设计顺序必须是 `先 skill / workflow / object contract，再反推 MCP capability`
- MCP runtime 只负责确定性能力与受控执行，不承担主要语义判断
- 语义判断、提案生成、成熟度判断主要由 skill 完成
- 所有写入都遵循 `propose -> review -> write`

因此，后续 MCP 设计不能越过这份文档，直接把底层 API 暴露成上层工作流。

## 3. Sparkle 主链路的角色边界

### 3.1 `PKM Orchestrator`

它是用户感知到的统一入口，负责维持 Butler 的对话姿态，并判断当前内容应该停留在整理层，还是进入 Capture / Rekindle / Review 主链路。

它在 Sparkle 主链路中的职责是：

- 判断当前对话是否具有笔记价值
- 判断内容更适合做轻捕获，还是更适合进入复燃
- 控制交互节奏，尽量减少打断式追问
- 决定当前是继续整理、生成提案，还是进入写入确认
- 把上下文交接给对应 skill，而不是自己吞掉全部角色

它接管流程的典型时机：

- 用户自然表达了一个值得留下的念头、判断、感受或问题
- 用户明确说“先记一下”或表达了保存意图
- 用户指出某条既有 Sparkle 想继续展开
- 当前对话已经把某条 Sparkle 讨论到足够成熟

它向下交接时要明确两件事：

- 当前是 `capture` 还是 `rekindle`
- 当前目标是继续整理，还是已经进入提案/审查阶段

它不负责：

- 直接生成最终 `SparkleDraft` 或 `RekindleProposal`
- 判断写入是否放行
- 执行任何底层写入动作

### 3.2 `Sparkle Capture`

它负责把一段值得保留的内容压缩成一个可复燃、可回忆的 `SparkleDraft`。

它的职责是：

- 从对话中抽取最小可回忆单元
- 优先保住触发点、方向感与重返入口
- 在信息不足时做最小追问，而不是补齐表单
- 产出结构化 `SparkleDraft`
- 在必要时给出轻量写入建议，但不自行放行写入

它接管流程的典型时机：

- 当前内容有保留价值，但尚未成熟到形成正式日志条目
- 用户只想“先接住火花”，而不是正式展开
- 当前内容更像感受、判断、问题或线索，而不是完整条目

它交接出去时的核心产物是 `SparkleDraft`。

它不负责：

- 判断某条 Sparkle 是否已经成熟到值得复燃
- 决定是否允许写入今日日志
- 决定最终写入位置以外的复杂策略
- 执行写入与状态回写

### 3.3 `Sparkle Rekindle`

它负责把既有 Sparkle 推进为正式条目提案，而不是单纯把短句拉长。

它的职责是：

- 围绕目标 Sparkle 形成 `RekindleRequest`
- 判断该 Sparkle 是否已成熟到值得进入正式记录
- 在必要时用少量追问补足关键缺口
- 生成 `RekindleProposal`
- 在不适合正式写入时给出延期、保留或降级建议

它接管流程的典型时机：

- 用户主动点名一条 Sparkle 想展开
- 当前对话明显在围绕某条 Sparkle 形成更稳定的判断
- 用户目标已经从“先记一下”转成“把它写成今天的正式记录”

它交接出去时的核心产物是 `RekindleProposal`，而不是最终写入结果。

它不负责：

- 直接放行写入
- 把不成熟内容硬写成正式条目
- 决定所有副作用是否可接受
- 执行日志写入或 Sparkle 状态回写

### 3.4 `PKM Policy Guard`

它是 Sparkle 主链路中的审查与放行层。它只关心“这次写入是否应该发生，以及应以什么条件发生”，不负责内容创作。

它的职责是：

- 接收待执行的 `WritePlan`
- 检查写入目标是否明确、影响是否可预览、语义是否匹配
- 对正式条目、状态回写和其他有副作用的动作维持确认边界
- 产出 `ReviewResult`
- 在条件不足时将流程降级为只返回提案或建议

它接管流程的典型时机：

- Capture 或 Rekindle 已经形成了可审查的写入意图
- 当前流程准备从“内容提案”进入“受控执行”

它交接出去时的核心产物是 `ReviewResult`；当结论允许执行时，`ReviewResult` 中应带上最终可执行的 `WritePlan`。

它不负责：

- 替 Capture 或 Rekindle 补做内容判断
- 创作 Sparkle 或正式条目正文
- 隐式执行任何写入

## 4. Sparkle 主链路的状态流转

上游设计需要把 Sparkle 主链路理解成一组有限状态，而不是一个松散的“想到哪里写到哪里”的流程。

### 4.1 默认状态：闲聊整理

这是 Butler 的默认姿态。

在这个状态下：

- Orchestrator 主要做理解、归纳、轻微聚焦
- 流程还没有进入写入准备
- 用户可以只是讨论，不必默认被记录

从这里可能发生三种转移：

- 如果出现值得保留、但仍偏轻量的内容，进入“轻捕获候选”
- 如果用户点名既有 Sparkle，或内容已围绕某条 Sparkle 成熟，进入“复燃候选”
- 如果内容不具持续价值，留在闲聊整理，不触发任何写入链路

### 4.2 轻捕获候选

这是从自然对话切入 Capture 的过渡状态。

在这个状态下，Orchestrator 的判断重点是：

- 这里是否存在一个值得保留的最小可回忆单元
- 当前更适合“接住火花”，而不是“写成正式记录”

如果答案为是，则把上下文交给 `Sparkle Capture`。

### 4.3 轻捕获成稿

这是 `Sparkle Capture` 的主要工作状态。

在这个状态下：

- Capture 产出 `SparkleDraft`
- 如缺少关键锚点，只允许最小追问
- 目标不是补齐字段，而是形成可重返入口

从这里可能发生三种转移：

- 若 `SparkleDraft` 已足够稳定，进入“写入审查”
- 若用户只想先看看草案，停留在提案层，不写入
- 若内容仍然太散、太空或不值得保留，进入“降级建议”

### 4.4 复燃候选

这是从对话进入 Rekindle 的过渡状态。

进入条件通常是：

- 用户主动要求展开某条 Sparkle
- 当前讨论已明显围绕某个既有 Sparkle 形成更完整判断
- 当前目标已经不是“留下线索”，而是“形成正式记录”

此时由 `Sparkle Rekindle` 接管，并组织成 `RekindleRequest`。

### 4.5 复燃提案

这是 `Sparkle Rekindle` 的主要工作状态。

在这个状态下：

- Rekindle 读取目标 Sparkle 与相关上下文
- 判断内容成熟度
- 在必要时做少量追问
- 产出 `RekindleProposal`

从这里可能发生三种转移：

- 若已成熟到值得写入正式条目，进入“写入审查”
- 若仍应保留为 Sparkle，进入“降级建议”
- 若用户明确不想记录，或目标对象不存在，进入“拒绝记录”

### 4.6 写入审查

这是 `PKM Policy Guard` 的入口状态，也是 `propose -> review -> write` 中的 review 阶段。

在这个状态下：

- 待执行动作必须被整理成 `WritePlan`
- Policy Guard 审查目标是否明确、影响是否可预览、副作用是否可接受
- Capture 与 Rekindle 在这里停止生成新语义，改由 Guard 做放行判断

审查结果统一表现为 `ReviewResult`，并只能导向四种结论：

- `allow`：可直接进入受控写入
- `ask_confirm`：必须先进入写入确认
- `downgrade`：不写入，只返回提案或建议
- `reject`：拒绝本次记录

### 4.7 写入确认

这是正式执行前的用户可见确认状态。

在这个状态下：

- 用户看到的是本次写入预览、目标位置和影响说明
- 系统不再扩大写入范围，只等待是否继续
- 任何确认都只应针对已经审查过的 `WritePlan`

正式条目写入、状态回写或其他明显有副作用的动作，应默认经过这一状态。

### 4.8 受控写入与完成状态

当 `ReviewResult` 为 `allow`，或 `ask_confirm` 后获得确认，流程才进入真正的写入执行。

这一阶段不再做语义判断，只做受控执行。

写入完成后通常进入两类完成状态：

- `captured`：Sparkle 已写入，主结果是轻量保存成功
- `rekindled`：正式条目已写入，且相关 Sparkle 状态已完成必要回写

### 4.9 降级建议与拒绝记录

这两个状态都意味着当前不进入写入，但性质不同。

`downgrade` 用于：

- 内容有价值，但当前还不值得落盘
- 可以保留为草案、建议或延后动作
- 重点是“现在不写”，不是“这东西没价值”

`reject` 用于：

- 用户明确表示不记录
- 目标对象不存在
- 语义与目标位置明显不符
- 当前内容明显只是噪声，或风险不可接受

## 5. 对象模型契约

这里的对象契约是工作流对象，不是底层存储 schema，也不是 TypeScript 实现细节。

### 5.1 `SparkleDraft`

`SparkleDraft` 是 Capture 阶段的主产物，表示一个“已经被接住，但还保持轻量”的 Sparkle 草案。

它至少应承担以下语义：

- 保留火花从哪里亮起来
- 保留最值得未来重返的那一小段方向感
- 允许信息不完整，但不允许失去重返入口

在 Sparkle 主链路里，最关键的字段是：

- `source`：火花从哪里亮起来，必须保住触发物
- `glow`：这里真正发亮的判断、感受、联想或方向
- `trace`：辅助线索，例如引句、时间点、局部观察，可选
- `pull`：后续还想往哪边碰的牵引方向，可选
- `context`：当时的语境，用于帮助未来重返
- `source_type`：触发来源的类型，例如对话、阅读、音乐、图片、网页
- `source_excerpt`：原始片段、引用或触发物线索
- `why_it_matters`：为什么值得留，可选
- `next_hint`：以后可沿什么方向再碰，可选
- `target_journal_date`：若要写入日志，应落在哪一天
- `status`：在 capture 生命周期中的状态

语义约束是：`SparkleDraft` 追求可复燃，不追求完整成文。

### 5.2 `RekindleRequest`

`RekindleRequest` 是进入复燃阶段的输入对象，它把“某条 Sparkle 想继续展开”组织成一个稳定请求。

它的作用是：

- 明确当前复燃对象是谁
- 把原始 Sparkle 与相关上下文重新收拢到一起
- 把用户这次希望展开到什么程度表达清楚

在 Sparkle 主链路里，最关键的字段是：

- `sparkle_id`：目标 Sparkle 的唯一标识
- `sparkle_snapshot`：原始 Sparkle 的轻量快照，至少保住 `source`、`glow` 与必要线索
- `related_context`：相关上下文，如同日记录、对话延伸、补充材料
- `user_goal`：用户这次是想提炼判断、写成日志、还是仅试探成熟度
- `desired_depth`：这次希望写到多深

语义约束是：`RekindleRequest` 不能把原始 Sparkle 抹平成一段普通摘要，它必须通过 `sparkle_snapshot` 保留这条 Sparkle 最初的火花来源。

### 5.3 `RekindleProposal`

`RekindleProposal` 是复燃阶段的主产物，表示“这条 Sparkle 现在可以怎样被写成正式条目”。

它的作用是：

- 把成熟度判断显式化
- 给出一个可审查的正式条目提案
- 告诉后续审查层是否需要回写原 Sparkle 状态

在 Sparkle 主链路里，最关键的字段是：

- `source_sparkle_id`：它来自哪条 Sparkle
- `rekindle_mode`：本次复燃是 `brief`、`full` 还是 `postpone`
- `entry_title`：正式条目的标题或标题方向
- `entry_body`：正式条目正文提案
- `entry_reason`：为什么现在值得写，而不是继续放着
- `write_target`：预期写入位置
- `backref_needed`：是否需要在原 Sparkle 上回写状态或关联信息

语义约束是：`RekindleProposal` 的核心不是“扩写”，而是“给出一个值得写入正式时间线的提案”。

### 5.4 `WritePlan`

`WritePlan` 是进入审查层时的待执行写入计划。它把语义提案收敛为一个可以被审查、预览和执行的受控动作。

在 Sparkle 主链路里，最关键的字段是：

- `operation_type`：本次动作类型，例如追加 Sparkle、追加正式条目、状态回写
- `target_page`：目标页面
- `target_section`：目标章节或逻辑位置
- `content_preview`：写入预览
- `side_effects`：可能伴随的副作用
- `backwrite_actions`：需要同步完成的回写动作

语义约束是：`WritePlan` 必须去掉未决歧义，并且能够被清晰预览；如果还不能被预览，就不应进入执行阶段。

### 5.5 `ReviewResult`

`ReviewResult` 是 Policy Guard 的审核结论对象，用来决定这次提案是放行、确认、降级还是拒绝。

在 Sparkle 主链路里，最关键的字段是：

- `decision`：`allow`、`ask_confirm`、`downgrade`、`reject`
- `reason`：为什么得到这个结论
- `user_prompt`：如果需要用户动作，应该怎样表达
- `final_write_plan`：最终被批准的 `WritePlan`；如果不放行，可以为空

语义约束是：

- `allow` 与 `ask_confirm` 应对应一份清晰的 `final_write_plan`
- `downgrade` 应明确告诉上游返回什么非写入结果
- `reject` 应明确说明不能继续的原因

## 6. 对象之间的转换关系

Sparkle 主链路里最重要的不是单个对象，而是对象之间的转换顺序。

标准转换链如下：

1. 对话片段经过 `Sparkle Capture`，形成 `SparkleDraft`
2. 某条既有 Sparkle 连同补充上下文，被组织成 `RekindleRequest`
3. `RekindleRequest` 经过成熟度判断，形成 `RekindleProposal`
4. `SparkleDraft` 或 `RekindleProposal` 被收敛为待审查的 `WritePlan`
5. `WritePlan` 经过 `PKM Policy Guard` 审查，形成 `ReviewResult`
6. 只有 `ReviewResult` 允许执行时，后续 runtime 才能执行写入

这个顺序意味着：

- Capture 与 Rekindle 负责产生语义对象
- Policy Guard 负责把语义对象关进受控写入边界
- MCP runtime 只能消费已经被收束好的对象，不能反过来替上游做成熟度判断

## 7. 设计原则

Sparkle 主链路的上游设计应持续遵循以下原则：

- 少功能、强结构：先把 Sparkle capture / rekindle 主链路做成闭环，不抢跑未来能力
- 低摩擦：优先从现有对话里抽取信息，尽量减少追问
- 不表单化：追问只用于补关键缺口，不用于索要字段
- 先提案，后写入：用户先看到草案、提案或预览，再决定是否继续
- 不绕过 Policy Guard：任何写入都不能由 Capture 或 Rekindle 直接放行
- 语义在上、执行在下：成熟度判断、提案生成、语气控制在 skill；受控执行在 runtime
- 不让 `vendor/` 定义产品边界：底层接口能力只能作为实现参考

## 8. 这份设计对后续 MCP 的约束

这份文档虽然不列 MCP 工具表，但它已经给后续 MCP 设计设定了边界。

后续 MCP runtime 只能围绕以下问题设计能力：

- 如何读取 Sparkle、日志页和必要上下文
- 如何把已经明确的 `WritePlan` 预览并受控执行
- 如何在执行后返回写入结果与必要回写信息

后续 MCP runtime 不应承担以下职责：

- 判断一段内容算不算 Sparkle
- 判断某条 Sparkle 是否成熟到值得复燃
- 决定正式条目应该怎么写
- 代替 Policy Guard 做最终放行

换句话说，后续 MCP capability 设计只能服务于这份上游设计里已经被证明需要的确定性动作，而不能反向扩大 Butler 的产品边界。

## 9. 下一步最自然的衔接

在这份上游设计之后，最自然的下一步有两条，且顺序上建议先做第一条：

1. 把五个核心对象进一步细化成 schema / TypeScript 类型草案
2. 再把四个 skill 的边界继续展开成各自的 `SKILL.md` 草案

原因是：对象契约先稳定，后续 skill 文案、runtime 入参和 MCP capability 反推都会更稳，不容易在不同层里各说各话。
