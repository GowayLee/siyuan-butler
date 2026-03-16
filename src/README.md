# Butler Runtime Source

这里是 SiYuan Butler TypeScript runtime 的源码目录。

当前阶段还是初始化骨架，不代表完整 runtime、MCP 工具面或 SiYuan adapter 已经存在。现在先落下的是能承载上游设计的最小工程结构，而不是反过来让脚手架定义产品边界。

当前目录分工：

- `butler-mcp/` - 未来的 Butler MCP Server 入口与协议接面
- `domain/` - 第一版领域对象骨架与后续规则承载处
- `adapter/` - 未来的思源适配层与其他底层集成
- `shared/` - 跨层共享 schema、常量与小型纯工具

当前已开始落地的重点是 `src/domain/`：

- `SparkleDraft`
- `RekindleRequest`
- `RekindleProposal`
- `WritePlan`
- `ReviewResult`

这些类型直接映射 `docs/SiYuan-Butler-skill-spec-V0.md` 与 `docs/Butler-Design/Butler-Object-Contracts-Draft.md` 中已确认的上游对象契约，用来先把工作流对象边界稳定下来。
