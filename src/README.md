# Butler Runtime Source

这里是 SiYuan Butler TypeScript runtime 的源码目录。

当前阶段还是初始化骨架，不代表完整 runtime、MCP 工具面或 SiYuan adapter 已经存在。现在先落下的是能承载上游设计的最小工程结构，而不是反过来让脚手架定义产品边界。

当前目录分工：

- `butler-mcp/` - 未来的 Butler MCP Server 入口与协议接面
- `application/` - workflow/use-case 编排层，负责把 skill 对象收敛成 runtime 可审查动作
- `domain/` - 第一版领域对象骨架与后续规则承载处
- `adapter/` - 未来的思源适配层与其他底层集成
- `shared/` - 跨层共享 schema、常量与小型纯工具

当前已开始落地的重点是 `src/domain/`，并开始补上 `src/application/` 与 `src/adapter/` 之间的中间层：

- `SparkleDraft`
- `RekindleRequest`
- `RekindleProposal`
- `WritePlan`
- `ReviewResult`

这些类型直接映射 `docs/SiYuan-Butler-skill-spec-V0.md` 与 `docs/Butler-Design/Butler-Object-Contracts-Draft.md` 中已确认的上游对象契约，用来先把工作流对象边界稳定下来。

当前 runtime 仍然刻意保持很小：

- `application/` 只收拢 Capture / Rekindle / review-before-write 主链路
- `adapter/` 只定义最小 read-model、target resolver 与受控执行端口
- `adapter/siyuan/` 只实现最小 HTTP 读写接线，不平铺 raw SiYuan API
- `butler-mcp/` 只保留 MCP server 壳子与未来 capability 注册位
