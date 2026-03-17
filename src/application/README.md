# application

这里是 Butler runtime 的 workflow/use-case 编排层。

这一层专门负责把 skill 交下来的语义对象，收敛成 runtime 内部可审查、可执行、可回写的受控动作。

当前阶段它承担的职责很克制：

- 用 target resolver 把目标页与章节收敛清楚
- 把 `SparkleDraft` / `RekindleProposal` 收敛成 `WritePlan`
- 把 `WritePlan` 送进 `Policy Guard` 形成 `ReviewResult`
- 只在 review 已放行后，才允许进入执行端口

当前目录现在按 MCP runtime 更容易追踪的方式收拢：

- `use-cases/` - 直接面向 capability handler 的 use-case 入口
- `shared/` - 多个 use-case 会共用的纯编排步骤，例如目标解析

它刻意不承担：

- 对话语气与 Orchestrator 路由
- Sparkle / Rekindle 的正文创作
- 直接实现 SiYuan HTTP 细节
