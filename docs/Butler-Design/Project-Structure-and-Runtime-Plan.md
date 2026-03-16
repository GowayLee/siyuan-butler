# SiYuan Butler 项目结构与运行时规划（当前草案）

## 1. 文档目的

本文用于记录当前已经确认下来的工程方向：

- Butler 的最终形态不是单个大而全的 skill
- Butler 应由一组 skill 套件与一个独立的 MCP runtime 共同组成
- MCP runtime 使用 TypeScript 开发
- `vendor/` 目录中的现有 SiYuan MCP 文件仅作为接口语义参考，不作为后续 Butler runtime 的实现骨架

这份文档是架构草案，描述的是当前推荐的项目组织方式与分层边界，不代表这些目录中的实现已经完成。

另一个明确边界是：`docs/Butler-PKM/` 目录只用于存放 PKM 理论与方法论材料，不承担项目结构或运行时设计文档；这些项目设计文档应集中放在 `docs/Butler-Design/`。

## 2. 当前确认下来的总体定位

### 2.1 Butler 的最终形态

SiYuan Butler 应被实现为两部分：

1. 一组可安装到 agent 软件中的 skill 套件
2. 一个由 TypeScript 编写的 `SiYuan-Butler MCP Server`

二者的关系不是“skill 附带几个零散脚本”，而是：

- skill 套件负责上层 PKM 交互、工作流判断、语气与边界
- Butler MCP Server 负责将这些 PKM 语义需求转成可控的底层能力调用

因此，Butler 更像“以 skill 为交互前端、以 MCP 为执行后端”的系统，而不是传统意义上只靠 `SKILL.md + scripts/` 组织起来的小型技能包。

### 2.2 MCP Server 的定位

`SiYuan-Butler MCP Server` 的职责不是重新暴露 SiYuan API，而是作为上层 skill 与底层笔记操作之间的桥梁。

它应具备以下特征：

- 工具设计服务于 PKM workflow，而不是服务于底层 endpoint 形状
- 工具是高封装、语义化的
- 工具能力由上层 skill 设计反推，而不是由现有 SiYuan API 正推
- 只暴露 Butler V0 需要的较小语义白名单，不暴露全量原始操作面

### 2.3 `vendor/` 的角色

当前 `vendor/` 中的内容仅承担两类作用：

- 帮助理解 SiYuan API 能力边界
- 帮助确认某些底层接口的命名、参数与约束

后续项目中的真正 Butler runtime 应由我们自行实现，而不是在 `vendor/siyuan-mcp-server.ts` 上持续演化出产品层逻辑。

## 3. 推荐的三层结构

当前推荐将整个项目理解为三层：

### 3.1 Skill Suite（交互与方法论层）

这一层面向 agent 软件安装。

职责包括：

- 识别用户当前是否处于 PKM 场景
- 维持 Butler 的交互姿态与语气
- 在 `capture / rekindle / review` 等工作流之间做路由
- 生成提案、触发确认、决定是否进入写入阶段

这一层不直接面向原始 SiYuan 操作。

### 3.2 Butler MCP Runtime（语义执行层）

这一层是系统运行核心。

职责包括：

- 承接 skill 需要的高层语义能力
- 将 PKM 语义流程收敛为一组可控 MCP 工具
- 保持写入行为的审查、预览、确认边界
- 负责与底层 SiYuan 适配层协调

这一层是后续 TypeScript 项目的主体。

### 3.3 SiYuan Adapter（底层适配层）

这一层负责：

- 与 SiYuan 真实接口通信
- 处理底层资源定位、原子读写与返回值整理
- 屏蔽底层 API 差异，但不承担 Butler 的产品语义

这一层以后将由我们自行实现，`vendor/` 只作为参考。

## 4. 当前项目推荐目录结构

下面是当前仓库下推荐采用的结构：

```text
.
|- docs/
|  |- SiYuan-Butler-skill-spec-V0.md
|  |- Butler-Design/
|  |  |- Sparkle-Skill-Upstream-Design.md
|  |  |- Butler-Object-Contracts-Draft.md
|  |  `- Project-Structure-and-Runtime-Plan.md
|  `- Butler-PKM/
|     `- Sparkle-model.md
|- skills/
|  |- siyuan-butler-orchestrator/
|  |- siyuan-butler-sparkle-capture/
|  |- siyuan-butler-sparkle-rekindle/
|  `- siyuan-butler-policy-guard/
|- src/
|  |- butler-mcp/
|  |- application/
|  |- domain/
|  |- adapter/
|  `- shared/
|- tests/
|  |- unit/
|  |- integration/
|  `- fixtures/
|- vendor/
|  |- siyuan-mcp-server.ts
|  `- SiYuan-API_zh_CN.md
`- AGENTS.md
```

## 5. 各目录职责

### 5.0 `docs/`

这里承载产品规格、上游设计与项目架构文档。

- `SiYuan-Butler-skill-spec-V0.md` 是产品源头文档
- `Butler-Design/` 用于集中承载项目设计文档
- `Butler-Design/Sparkle-Skill-Upstream-Design.md` 用于细化 Sparkle 主链路的 skill 边界、状态流转与对象契约
- `Butler-Design/Butler-Object-Contracts-Draft.md` 用于细化五个核心对象的中文契约草案
- `Butler-Design/Project-Structure-and-Runtime-Plan.md` 用于说明 `skill suite + MCP runtime` 的工程分层方向

与之相对，`docs/Butler-PKM/` 只放 PKM 理论，不放项目结构设计。

### 5.1 `skills/`

这里放 Butler skill 套件，每个 skill 都保持传统 skill 安装单位的形态。

建议拆分为：

- `siyuan-butler-orchestrator/`
- `siyuan-butler-sparkle-capture/`
- `siyuan-butler-sparkle-rekindle/`
- `siyuan-butler-policy-guard/`

这些目录未来应分别承载：

- `SKILL.md`
- `references/`
- 必要时的极薄启动脚本或说明文件

但核心逻辑不应堆放在这些目录中，而应放到 TypeScript runtime 中。

### 5.2 `src/`

这里是 Butler runtime 的 TypeScript 源码主目录。

建议进一步分为：

- `src/butler-mcp/`
  - Butler MCP Server 本体
  - 负责 MCP 协议接入、工具暴露、会话边界与服务启动

- `src/application/`
  - workflow/use-case 编排层
  - 负责把 skill 交下来的语义对象收敛成 runtime 可执行的能力调用
  - 负责串接 `domain` 规则、target resolver、read-model、review gate 与受控执行边界
  - 不负责对话语气、成熟度创作判断，也不直接承载底层 SiYuan HTTP 细节

- `src/domain/`
  - 领域对象与规则
  - 例如 `SparkleDraft`、`RekindleRequest`、`RekindleProposal`、`WritePlan`、`ReviewResult`

- `src/adapter/`
  - 底层系统适配
  - 未来放 SiYuan 接口实现，而不是复用 `vendor/` 单文件直接拼接

- `src/shared/`
  - 共享 schema、常量、纯工具、跨层复用的小型辅助模块

这样划分的重点不是形式整齐，而是明确：

- 哪些属于 Butler 语义
- 哪些属于底层适配
- 哪些属于稳定对象契约

### 5.3 `tests/`

这里用于后续补充 Butler runtime 的测试。

建议至少分为：

- `unit/`：领域对象、规则判断、纯函数
- `integration/`：Butler MCP 与 SiYuan adapter 的受控集成测试
- `fixtures/`：测试输入样例、模拟返回值、示例数据

### 5.4 `vendor/`

这里继续保留参考角色，不作为 Butler 主实现目录。

这一点很重要，因为 Butler runtime 的设计应该由上层 PKM workflow 反推，而不是被底层 API 的既有组织方式牵着走。

## 6. Skill Suite 与 MCP Runtime 的关系

当前确认下来的边界如下：

- skill 套件负责语义判断、工作流切换、用户沟通方式
- application/use-case 层负责把语义对象收敛成稳定 workflow 动作
- MCP runtime 负责暴露高封装 capability，并把调用落到 application/use-case 层
- adapter 负责最底层的原子操作

换句话说：

- Skill 决定“现在应该做什么”
- application 决定“这个 workflow 在 runtime 里该如何被收拢、审查与放行”
- MCP 决定“把哪些受控 capability 暴露给 skill 调用”
- Adapter 决定“如何与 SiYuan 具体通信”

## 7. 当前结构设计的几条原则

### 7.1 先 Skill，后 MCP

MCP 工具设计不应先于上层 workflow 设计。

应先明确：

- Orchestrator 如何路由
- Capture 如何生成 `SparkleDraft`
- Rekindle 如何生成 `RekindleProposal`
- Policy Guard 如何放行、降级、拒绝

之后再从这些稳定需求反推 MCP 工具。

### 7.2 MCP 不做原始 API 平铺

Butler MCP 不应成为另一个 `siyuan-mcp-server.ts`。

它应该是：

- 面向 Sparkle 工作流
- 面向 review 边界
- 面向可预览、可确认的写入流程

### 7.3 写入安全边界必须稳定

无论具体工具如何设计，以下原则应保持不变：

- Capture 与 Rekindle 不应绕过 Policy Guard 直接写入
- 正式写入前必须有清晰预览与影响说明
- 写入动作应尽量集中到受控路径中执行

### 7.4 `vendor/` 只提供参考，不定义产品边界

如果上层 PKM 设计与底层 API 形状出现冲突，应优先维护 Butler 的产品语义，再在 adapter 层解决实现问题。

## 8. 当前阶段最合理的推进顺序

在这份结构下，后续更合理的开发顺序是：

1. 明确 skill 套件边界与工作流状态切换
   - 参考 `docs/Butler-Design/Sparkle-Skill-Upstream-Design.md`
2. 固化领域对象与对象契约
3. 实现 Butler MCP Server 的运行时骨架
4. 再设计并实现具体 MCP 工具
5. 最后补齐 SiYuan adapter 的底层接口实现

这样可以避免项目从一开始就退化成“围着底层 API 拼功能”。

## 9. 小结

当前项目结构的核心判断是：

- Butler 是 `Skill suite + MCP runtime` 的组合系统
- MCP runtime 才是未来工程实现的核心
- MCP runtime 使用 TypeScript 开发
- `vendor/` 仅作为 SiYuan API 参考与过渡材料
- 整个运行时应由上层 PKM workflow 反推设计，而不是由底层接口正推设计

这份结构为后续真正进入 Butler MCP 设计提供了稳定的项目骨架。
