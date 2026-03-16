# butler-mcp

这里是 `SiYuan-Butler MCP Server` 的运行时入口目录。

当前阶段只落下最小骨架：

- `server.ts` 负责创建 Butler MCP server 实例，并保留后续注册 capability 的位置
- `main.ts` 负责最小启动入口，当前采用 stdio transport

这里刻意还没有：

- 具体 MCP tool 注册表
- 面向思源原始 API 的镜像式能力暴露
- adapter 接线与实际写入实现

换句话说，这里现在钉住的是 runtime 边界与启动方式，而不是 Butler 的最终能力面。
