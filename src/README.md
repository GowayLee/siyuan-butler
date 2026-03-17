# Butler Runtime Source

这里是 SiYuan Butler TypeScript runtime 的源码目录。

当前阶段还是初始化骨架，不代表完整 runtime、MCP 工具面或 SiYuan adapter 已经存在。现在先落下的是能承载上游设计的最小工程结构，而不是反过来让脚手架定义产品边界。

当前目录分工：

- `butler-mcp/` - runtime 主轴；负责 capability 注册、tool glue、transport 与启动入口
- `application/` - use-case 编排层，负责把 skill 对象收敛成 runtime 可审查动作
- `domain/` - 第一版领域对象骨架与后续规则承载处
- `adapter/` - 思源适配层与其他底层集成，围绕 read/write 合同与 read-model 服务于 MCP runtime

当前已开始落地的重点是 `src/domain/`，并开始补上 `src/application/` 与 `src/adapter/` 之间的中间层：

- `SparkleDraft`
- `RekindleRequest`
- `RekindleProposal`
- `WritePlan`
- `ReviewResult`

这些类型直接映射 `docs/SiYuan-Butler-skill-spec-V0.md` 与 `docs/Butler-Design/Butler-Object-Contracts-Draft.md` 中已确认的上游对象契约，用来先把工作流对象边界稳定下来。

当前运行时收敛方向已经进一步明确：

- capture 是先落稳的主链路
- `SparkleDraft` 在 runtime 中保持极小，只保留 `source` / `glow` / `trace?` / `pull?`
- `journal_date` 属于写入目标输入，不属于 Sparkle 本体
- 当前默认不写入 Sparkle block attrs
- rekindle 仍保留为 pending 设计，不作为已稳定开放的 capability 链路

当前 runtime 仍然刻意保持很小，但目录开始围绕 `butler-mcp/` 收拢：

- `butler-mcp/capabilities/<capability-id>/tool.ts` 按 capability 收口 MCP schema、handler 与 presenter glue
- `butler-mcp/registry.ts` 负责把 capability 白名单注册到 MCP server
- `application/use-cases/` 直接承接 capability-facing orchestration，减少额外转发层
- `application/shared/target-resolution.ts` 收口纯目标解析逻辑，避免把纯语义步骤塞进 adapter
- `adapter/contracts.ts` 与 `adapter/read-models.ts` 保留集成边界所需的最小稳定合同
- `adapter/siyuan/readers/` 与 `adapter/siyuan/writers/` 分开底层读取和执行
- `adapter/siyuan/codecs/` 收口 markdown / attrs 解析逻辑，避免 adapter class 继续膨胀

同时，`src/index.ts` 现在只保留 `butler-mcp/` 的导出面；若要使用内部层，应该从各自子目录显式导入，而不是继续把整个 runtime 视作平铺包。
