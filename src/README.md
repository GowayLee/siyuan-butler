# Butler Runtime Source

这里是 SiYuan Butler TypeScript runtime 的源码目录。

当前阶段还是初始化骨架，不代表完整 runtime、MCP 工具面或 SiYuan adapter 已经存在。现在先落下的是能承载上游设计的最小工程结构，而不是反过来让脚手架定义产品边界。

当前目录分工：

- `butler-mcp/` - runtime 主轴；负责 capability registry、tool schema、handler、transport 与启动入口
- `application/` - workflow/use-case 编排层，负责把 skill 对象收敛成 runtime 可审查动作
- `domain/` - 第一版领域对象骨架与后续规则承载处
- `adapter/` - 思源适配层与其他底层集成，围绕 read/write 端口服务于 MCP runtime
- `shared/` - 跨层共享 schema、常量与小型纯工具

当前已开始落地的重点是 `src/domain/`，并开始补上 `src/application/` 与 `src/adapter/` 之间的中间层：

- `SparkleDraft`
- `RekindleRequest`
- `RekindleProposal`
- `WritePlan`
- `ReviewResult`

这些类型直接映射 `docs/SiYuan-Butler-skill-spec-V0.md` 与 `docs/Butler-Design/Butler-Object-Contracts-Draft.md` 中已确认的上游对象契约，用来先把工作流对象边界稳定下来。

当前 runtime 仍然刻意保持很小，但目录开始围绕 `butler-mcp/` 重排：

- `butler-mcp/capabilities/` 按 capability 拆分 schema、handler、presenter
- `butler-mcp/registry/` 负责把 capability 白名单注册到 MCP server
- `adapter/ports/`、`adapter/models/`、`adapter/resolvers/` 把端口、read-model 与目标解析明确分开
- `adapter/siyuan/readers/` 与 `adapter/siyuan/writers/` 分开底层读取和执行
- `adapter/siyuan/codecs/` 收口 markdown / attrs 解析逻辑，避免 adapter class 继续膨胀

同时，`src/index.ts` 现在只保留 `butler-mcp/` 的导出面；若要使用内部层，应该从各自子目录显式导入，而不是继续把整个 runtime 视作平铺包。
