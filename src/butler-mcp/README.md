# butler-mcp

这里是 `SiYuan-Butler MCP Server` 的运行时入口目录。

当前阶段只落下最小骨架：

- `server.ts` 负责创建 Butler MCP server 实例，并保留后续注册 capability 的位置
- `main.ts` 负责最小启动入口，当前采用 stdio transport
- runtime 已开始从 `src/application/` 读取 capability 映射，但尚未把这些能力正式注册成 MCP tools
- `src/adapter/siyuan/` 已有最小思源 HTTP adapter，可供后续 capability 接线使用

这里刻意还没有：

- 具体 MCP tool 注册表
- 面向思源原始 API 的镜像式能力暴露
- adapter 接线与实际写入实现

因此，这里当前表达的是：MCP server 已经知道自己将要承载哪些 Butler capability，但还没有把 runtime 退化成一排原始动作菜单。

换句话说，这里现在钉住的是 runtime 边界与启动方式，而不是 Butler 的最终能力面。
