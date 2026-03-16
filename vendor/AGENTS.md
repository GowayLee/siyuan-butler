# AGENTS.md

## OVERVIEW

- `vendor/` holds the current SiYuan integration surface: one executable MCP bridge and one upstream/reference API manual.
- Treat this subtree as protocol and compatibility glue, not the source of Butler product policy.
- Most work here is about mapping MCP tools/resources cleanly onto SiYuan HTTP endpoints.

## STRUCTURE

- `siyuan-mcp-server.ts` - single-file Node MCP server over stdio; all executable logic lives here.
- `SiYuan-API_zh_CN.md` - reference manual for SiYuan's HTTP API; use it to verify endpoint contracts and caveats.
- The TypeScript file is conceptually split into bootstrap, API helper, tool declarations, tool execution branches, resources, and startup rather than real submodules.

## COMPONENTS

- Bootstrap/env section - resolves `SIYUAN_URL` or `SIYUAN_HOST` plus `SIYUAN_PORT`, with optional `SIYUAN_TOKEN`; keep it limited to connection and auth concerns.
- `api(path, body)` helper - thin POST wrapper around SiYuan endpoints; preserve transparent endpoint mapping instead of adding opaque abstractions.
- `ListToolsRequestSchema` handler - declares the MCP surface for notebooks, docs, blocks, attrs, SQL, files, export, notifications, system, templates, conversion, and assets.
- `CallToolRequestSchema` handler - large switch that executes the actual endpoint calls; each case should stay small and closely aligned with one upstream capability.
- Resource handlers - expose `siyuan://recent` and `siyuan://notebooks` for read-oriented discovery only.
- `SiYuan-API_zh_CN.md` - upstream behavior reference, including endpoint-specific gotchas such as write constraints and path rules.

## WHERE TO LOOK

- Connection setup and runtime assumptions: `vendor/siyuan-mcp-server.ts:12`
- MCP tool inventory and input contracts: `vendor/siyuan-mcp-server.ts:71`
- `create_doc` notebook requirement: `vendor/siyuan-mcp-server.ts:885`
- Removed workspace-path support: `vendor/siyuan-mcp-server.ts:1416`
- MCP resources and startup path: `vendor/siyuan-mcp-server.ts:1535`
- Upstream endpoint details and caveats: `vendor/SiYuan-API_zh_CN.md`

## CONVENTIONS

- Keep this subtree close to upstream SiYuan API naming and payload shape unless there is a clear compatibility reason not to.
- Preserve the single-file organization unless a task explicitly justifies splitting it.
- Fail fast on missing required routing information; `create_doc` should stay explicit about `notebook`.
- Do not reintroduce `SIYUAN_WORKSPACE` assumptions; the file documents that support as removed.
- If tests are added later, mock `fetch` and env vars; do not make routine verification depend on a live SiYuan instance.

## ANTI-PATTERNS

- Do not put repo-specific Butler workflow rules into `vendor/SiYuan-API_zh_CN.md`.
- Do not obscure which `/api/...` route a tool hits behind overly clever helper layers.
- Do not make MCP resources mutate state.
- Do not assume this subtree is neatly modularized; read by conceptual section inside `siyuan-mcp-server.ts`.
- Do not write tests or checks that require real network access by default.
