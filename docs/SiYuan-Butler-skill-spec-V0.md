# 思源笔记 AI 管家 V0 Skill 规格文档

## 1. 文档目的

本文档用于整理思源笔记 AI 管家 V0 的整体 skill 规格。

V0 的目标不是一次性做成完整的 AI 笔记系统，而是在保持未来可扩展总体架构的前提下，先实现两条最核心的高层语义工作流：

1. Sparkle 创建
2. Sparkle 复燃

同时，V0 还需要具备一层独立的标准规则与安全确认机制，确保整套系统的写入行为可控、可预览、可确认。

本文档主要描述产品定位、交互方式、skill 分工、对象模型、工作流路径以及架构边界，不涉及具体实现细节。

---

## 2. V0 的产品目标

### 2.1 总体定位

该系统的目标是打造一个与思源笔记配合工作的“笔记管家”。

用户与它对话时，通常带有明确的笔记管理目的，但交互方式不应表现为强烈的命令式调用。用户不是在操作一个 CRUD 机器人，而是在与一个理解笔记组织、理解用户方法论、能主动帮助整理内容的管家聊天。

因此，V0 的核心不是“执行命令”，而是：

- 从自然对话中识别值得记录的内容
- 以尽可能低摩擦的方式生成 Sparkle
- 在内容成熟时，将 Sparkle 复燃为日志中的正式条目
- 在所有写入前提供必要的规则检查与确认

### 2.2 V0 的设计原则

V0 应遵循以下原则：

- 少功能、强结构
- 上层处理语义，下层处理动作
- 多 skill 分工，但用户只感知到一个统一的“管家”入口
- 先提案，后写入
- 尽量减少强指令式交互
- 尽量避免表单式追问
- 在保持低摩擦的同时确保写入安全

### 2.3 V0 不做的内容

为了保证系统能尽快落地，V0 明确不包含以下能力：

- 自动双链创建
- 常青笔记自动生成
- 项目页或专题页智能分流
- 多条 Sparkle 聚合分析
- 全库自由编辑
- 高复杂度知识图谱整理

这些内容应保留到后续版本中扩展。

---

## 3. 整体架构

V0 的总体架构分为三层：

### 3.1 知识存储层

由思源笔记承担。

这一层负责：

- 存储日志页
- 存储 Sparkle 条目
- 存储复燃后的正式日志条目
- 提供结构化笔记组织能力

### 3.2 动作执行层

由思源 API / MCP 适配层承担。

这一层负责：

- 读取日志页、Sparkle、相关块与上下文
- 执行写入、追加、更新等原子动作
- 将底层能力暴露给上层工作流调用

这一层只关心“能做什么”，不关心“为什么做”。

### 3.3 工作流编排层

由多个 skill 组成。

这一层负责：

- 理解用户意图
- 对自然语言对话做语义整理
- 将内容转化为 Sparkle 或复燃条目提案
- 做安全检查、预览与确认
- 调用动作执行层完成写入

这一层是系统的核心。

---

## 4. Skill 组成

V0 采用多 skill 架构，但用户始终通过统一的“笔记管家”入口与系统交互。

### 4.1 Skill A：PKM Orchestrator

这是主 skill，也是用户实际感知到的“管家”。

它的职责包括：

- 识别用户当前意图是否涉及笔记管理
- 判断当前内容更适合进入 Sparkle 创建还是 Sparkle 复燃
- 在不打断自然对话的前提下，将内容路由到对应 skill
- 维持整体对话的交互体验与语气风格
- 决定当前是继续整理、生成提案还是进入写入确认

它不负责直接写入思源，也不负责具体内容生成细节。

它的核心定位不是命令解释器，而是对话式笔记管家。

### 4.2 Skill B：Sparkle Capture

这是专门处理 Sparkle 创建的 skill。

它的目标是从对话中提炼一个“足够轻、但未来可以复燃”的 Sparkle 对象。

它应当遵循以下原则：

- 优先自动抽取已有信息
- 仅在必要时进行最小追问
- 不追求一次性补全所有字段
- 重视可回忆性与可复燃性，而非格式完整度

它的产物应是一个结构化的 SparkleDraft，而不是最终排版文本。

### 4.3 Skill C：Sparkle Rekindle

这是专门处理 Sparkle 复燃的 skill。

它的目标是将一个已有 Sparkle 发展为值得写入日志正文的正式条目。

它的职责包括：

- 读取目标 Sparkle 及上下文
- 判断该 Sparkle 是否已经成熟到值得复燃
- 必要时通过少量追问补足关键缺口
- 生成正式条目提案
- 在不适合正式写入时给出延期、保留或降级建议

它的重点不在“写长”，而在“判断这条内容是否值得成为正式记录”。

它的产物应是 `RekindleProposal`，而不是最终写入结果。

### 4.4 Skill D：PKM Policy Guard

这是独立的标准规则与安全确认 skill。

它负责：

- 检查内容是否满足写入条件
- 判断目标位置是否明确
- 生成写入预览
- 判断是否需要用户确认
- 在条件不足时，将流程降级为只返回提案或建议

任何写入操作都不能绕过该 skill。

它不负责内容创作，只负责规则审查与放行。

---

## 5. 主 Skill 的交互体验设计

V0 的主 skill 必须体现“笔记管家”而不是“指令机器人”的体验。

### 5.1 总体交互目标

用户在与主 skill 交流时，不应被迫频繁显式选择“创建 Sparkle”或“复燃 Sparkle”。

更自然的模式应当是：

- 用户自由表达内容
- 主 skill 主动理解内容的笔记价值
- 主 skill 在内部决定是否进入某条工作流
- 通过轻量、带判断的回应推进流程

### 5.2 主 skill 的交互原则

主 skill 应遵循以下交互原则：

- 默认认为用户是在整理知识，而不是调用功能
- 优先理解与归纳，而不是抛出选项菜单
- 提问应表现为帮助聚焦，而不是索取参数
- 不急于落盘，先判断记录粒度
- 尽量减少打断式追问
- 对写入保持克制，先给提案，再请求确认

### 5.3 推荐的会话姿态

主 skill 在 V0 中应具备四种内部会话姿态：

1. 闲聊整理模式：只帮助理顺内容，不触发写入
2. 轻捕获模式：检测到值得保留的 Sparkle，并引导形成草案
3. 复燃提案模式：检测到内容已成熟，生成正式条目提案
4. 写入确认模式：在写入前明确展示本次操作与影响

这四种姿态应当自然切换，而不显式暴露给用户。

### 5.4 语言风格要求

主 skill 的语言风格应：

- 平静
- 懂行
- 有轻微判断力
- 不表单化
- 不机械化
- 不过度热情或过度拟人

应避免：

- “请选择功能”式表达
- “请提供字段”式表达
- 过度强调系统检测、流程启动、模块调用等内部术语

---

## 6. 对象模型

为了保证 skill 之间能稳定协作，V0 应建立清晰的结构化对象模型。

这里的对象模型是工作流对象，不是底层存储 schema，也不是 MCP 工具入参设计。

更细的字段草案可参考 `docs/Butler-Design/Butler-Object-Contracts-Draft.md`；本节保留 V0 规格层必须稳定的核心语义。

### 6.1 SparkleDraft

用于表示 Capture 阶段生成的 Sparkle 草案。

它不是完整笔记，也不是文本摘要，而是一个“最小可回忆单元”与“重返入口”。

一个成立的 `SparkleDraft`，至少要保住：

- 一个触发物
- 一个方向感

建议字段：

- id
- created_at
- source_type
- sparkle_kind
- source
- glow
- trace
- pull
- source_excerpt
- context
- why_it_matters
- next_hint
- status
- target_journal_date
- capture_mode
- write_intent

其中：

- `source` 与 `glow` 是核心槽位；前者回答“它从哪里亮起来”，后者回答“这里亮的是什么”
- `trace` 与 `pull` 是可选增强槽位，用于保留辅助线索与后续牵引方向
- `sparkle_kind` 用于区分感受型、认知型或混合型 sparkle
- `context` 是帮助重返的轻量语境，不是背景说明大全
- `why_it_matters`、`next_hint` 可选，不应退化成必填解释题
- `status` 初始通常为 `draft` 或 `captured`

`SparkleDraft` 的重点是可复燃，而不是格式完整。只要未来的自己能借它回到那个感受、判断、联想或思路，它就成立。

### 6.2 RekindleRequest

用于表示进入复燃阶段时的输入对象。

它的作用不是把原 Sparkle 抹平成摘要，而是把“为什么现在要继续碰这条 Sparkle”组织成稳定请求。

建议字段：

- sparkle_id
- sparkle_snapshot
- trigger
- related_context
- user_goal
- desired_depth
- focus_question
- target_journal_date

其中：

- `sparkle_snapshot` 至少要保住原 Sparkle 的 `source`、`glow` 与必要线索
- `trigger` 用于说明这次为什么进入复燃，例如用户点名、对话自然成熟、或 Butler 建议展开
- `user_goal` 表示这次复燃想得到什么，不等于最终一定写入
- `desired_depth` 用于控制展开深度，不用于逼迫内容变长

### 6.3 RekindleProposal

用于表示复燃 skill 生成的正式条目提案。

它的核心不是“扩写”，而是“给出一个值得写入正式时间线的提案”。

建议字段：

- source_sparkle_id
- rekindle_mode
- maturity
- entry_title
- entry_body
- entry_reason
- write_target
- summary_line
- open_questions
- backref_needed

其中：

- `rekindle_mode` 可取 `brief` / `full` / `postpone`
- `maturity` 用于表达当前成熟度判断
- `entry_reason` 用于说明为什么现在值得写，而不是继续放着
- `summary_line`、`open_questions` 可用于保留轻量概括与未阻断提案的问题
- `backref_needed` 用于决定后续是否需要回写 Sparkle 状态或关联信息，但不等于已被允许执行

### 6.4 WritePlan

用于表示待执行的写入计划。

它是语义提案进入审查层时的受控动作对象，重点是让这次写入可以被预览、被解释、被确认。

建议字段：

- plan_id
- operation_type
- origin
- target_page
- target_section
- content_preview
- side_effects
- backwrite_actions
- needs_confirmation
- blocked_by

其中：

- `operation_type` 用于区分追加 Sparkle、追加正式条目、状态回写等动作
- `origin` 用于标记此计划来自 Capture 还是 Rekindle
- `side_effects` 不能省略；即使没有副作用，也应明确写出
- `backwrite_actions` 用于描述附带回写动作
- `needs_confirmation` 与 `blocked_by` 用于帮助 Policy Guard 判断能否继续

### 6.5 ReviewResult

用于表示 Policy Guard 的审核结论。

它决定这次流程是继续执行、先确认、降级成非写入结果，还是直接拒绝。

建议字段：

- decision
- reason
- review_summary
- user_prompt
- final_write_plan
- downgrade_to
- reject_code

其中 decision 建议包括：

- allow
- ask_confirm
- downgrade
- reject

并应满足：

- `allow` 与 `ask_confirm` 应对应一份清晰的 `final_write_plan`
- `downgrade` 应说明这次保留下来的非写入结果是什么
- `reject` 应明确告诉上游为什么不能继续

---

## 7. 底层能力边界

虽然底层 MCP / API 可以完整覆盖思源官方 API，但 V0 不应让 skill 直接面向所有底层能力。

V0 的上层 skill 只应依赖一组较小且稳定的语义工具白名单。

### 7.1 读取类能力

- 读取某天日志页
- 读取指定 Sparkle
- 搜索最近的 Sparkle
- 读取目标章节内容
- 读取上下文块

### 7.2 轻写入类能力

- 在今日日志的 Sparkles 节追加 Sparkle
- 在日志正文节追加复燃条目
- 更新 Sparkle 状态
- 记录复燃后的回写信息

### 7.3 结构辅助能力

- 定位今日日志页
- 定位 Sparkles 节
- 定位正文节
- 检查目标块或章节是否存在

### 7.4 审计辅助能力

- 生成写入预览
- 返回写入结果摘要
- 返回受影响对象清单

这种设计可以让底层实现与上层工作流解耦，便于后续替换 MCP 实现或扩展支持更多笔记系统。

---

## 8. 工作流设计

### 8.1 Sparkle 创建工作流

目标：将自然对话中的一个值得保留的念头，转换为轻量且可复燃的 Sparkle，并写入今日日志的 Sparkles 节。

工作流路径如下：

1. 用户自然表达一个想法、观察、判断或待展开的问题
2. Orchestrator 判断这段内容值得进入 Sparkle Capture
3. Sparkle Capture 自动抽取可用信息
4. 如存在关键缺口，进行最小追问
5. 生成 `SparkleDraft`
6. 如存在保存意图，将 `SparkleDraft` 收敛为 `WritePlan`
7. Policy Guard 基于 `WritePlan` 形成 `ReviewResult`
8. 若 `ReviewResult` 为 `allow`，或 `ask_confirm` 后获得确认，则执行写入
9. 返回保存结果与简短说明

该流程的目标是降低记录摩擦，而不是追求一次性写得完整。

### 8.2 Sparkle 复燃工作流

目标：将已有 Sparkle 发展为日志中的正式条目。

工作流路径如下：

1. 用户主动表示想展开某个 Sparkle，或当前对话显示某条 Sparkle 已经成熟
2. Orchestrator 判断进入 Sparkle Rekindle
3. Rekindle skill 读取目标 Sparkle 与上下文，并组织成 `RekindleRequest`
4. 判断该 Sparkle 是否已成熟到值得写成正式条目
5. 如有必要，进行少量追问
6. 生成 `RekindleProposal`
7. 将 `RekindleProposal` 收敛为 `WritePlan`
8. Policy Guard 对 `WritePlan` 生成 `ReviewResult`
9. 在获得允许后，写入日志正文，并执行必要的状态回写
10. 返回写入结果与对应关系说明

该流程的重点是“判断内容成熟度”，而不是机械地把 Sparkle 拉长成段落。

---

## 9. Policy Guard 的规则建议

V0 中建议为 Policy Guard 设定以下基础规则：

### 9.1 必须预览的情况

- 所有复燃后的正式条目写入
- 所有覆盖式更新
- 所有会带来状态回写的操作

### 9.2 可默认放行的情况

- 用户明确表达“先帮我记一下”
- 仅在 Sparkles 节做 append 追加
- 不涉及已有内容覆盖

### 9.3 必须降级为只建议的情况

- 目标位置不明确
- 内容仍明显处于发散讨论阶段
- 生成结果空泛或不具备真实记录价值
- 无法判断其是否属于 Sparkle 或正式条目

### 9.4 应拒绝写入的情况

- 操作对象不存在
- 写入目标与当前语义明显不符
- 用户表达了暂不记录的意图
- 当前内容明显只是噪声或无持久价值

---

## 10. Skill 之间的关系

V0 的 skill 之间应通过结构化对象通信，而不是通过松散的自由文本直接互相调用。

关系如下：

- Orchestrator 决定路由，但不负责直接写入
- Capture 负责生成 `SparkleDraft`
- Rekindle 负责生成 `RekindleRequest` 与 `RekindleProposal`
- `SparkleDraft` 与 `RekindleProposal` 在进入审查前会被收敛为 `WritePlan`
- Policy Guard 对 `WritePlan` 进行审核，并返回 `ReviewResult`
- MCP / API adapter 仅执行被批准的动作

这样可以保证未来新增 skill 时，不会破坏现有主链路。

---

## 11. 共享资源层

V0 虽然只实现两个核心业务 skill，但应提前建立共享资源层，为后续扩展打基础。

建议包含以下资源文档：

- Sparkle 定义文档
- Sparkle 示例集
- Rekindle 前后对照示例
- 日志结构规范文档
- Policy 规则文档

这些资源应被多个 skill 共同引用，用于统一方法论、术语和输出风格。

---

## 12. 建议的 Skill 包组织方式

建议采用如下组织方式：

```text
skills/
  siyuan-butler-orchestrator/
    SKILL.md
    examples/
    resources/

  siyuan-butler-sparkle-capture/
    SKILL.md
    examples/
    resources/

  siyuan-butler-sparkle-rekindle/
    SKILL.md
    examples/
    resources/

  siyuan-butler-policy-guard/
    SKILL.md
    examples/
    resources/

shared/
  sparkle-definition.md
  capture-examples.md
  rekindle-examples.md
  journal-schema.md
  policy-rules.md
```

V0 的重点不在目录形式本身，而在于每个 skill 都有清晰、稳定的认知边界。

---

## 13. V0 的核心价值

该 V0 架构的价值主要体现在以下几点：

第一，它已经形成闭环。

用户可以通过自然对话完成：

- 一个 Sparkle 的捕获
- 一个 Sparkle 的复燃
- 一次受规则保护的安全写入

第二，它具备可扩展性。

未来若新增双链联想、项目路由、回顾整理、主题聚合等能力，可以继续沿用当前的 skill 分工与结构化对象体系。

第三，它适合作为思源笔记 AI 管家的基础版本。

它避免了一开始就做成笨重复杂系统，而是优先保证交互体验、语义编排和写入安全这三件最关键的事情。

---

## 14. 总结

思源笔记 AI 管家 V0 应被理解为一个“少功能、强结构”的初级版本。

它不追求一次性覆盖所有高层语义能力，而是先围绕 Sparkle 创建与复燃建立完整闭环：

- 由主 skill 提供自然、非强指令式的管家交互体验
- 由 Capture 和 Rekindle skill 处理核心语义任务
- 由 Policy Guard skill 负责标准规则与安全确认
- 由思源 API / MCP 适配层执行底层动作
- 由思源笔记承担最终知识存储

在该架构下，系统既可以快速开始使用，又能为未来版本留下清晰的扩展路径。
