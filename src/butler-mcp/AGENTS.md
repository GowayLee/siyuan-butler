# AGENTS.md

## OVERVIEW

- `src/butler-mcp/` is the runtime main axis of the Butler MCP server.
- This subtree owns protocol-facing capability registration, handler wiring, runtime bootstrap, and server startup.
- Keep this layer thin in product logic: handlers should delegate to `src/application/`, not absorb workflow rules.

## STRUCTURE

- `runtime/` - runtime context creation and env-based bootstrap.
- `registry.ts` - capability whitelist registration and runtime assembly.
- `capabilities/<capability-id>/tool.ts` - per-capability MCP schema, handler, and presenter glue.
- `server.ts` - Butler MCP server creation and registration entry.
- `main.ts` - stdio startup entrypoint.

## CONVENTIONS

- Register only the Butler semantic capability whitelist.
- Keep schemas aligned with capability-facing application inputs and outputs, not raw SiYuan payload shapes.
- Let capability tools validate, delegate, and present; keep workflow branching in `src/application/`.
- Build runtime context once and pass adapter contracts plus application use-cases downward rather than recreating adapter state inside each handler.

## ANTI-PATTERNS

- Do not mirror `vendor/siyuan-mcp-server.ts` tool breadth here.
- Do not let handlers call low-level SiYuan HTTP code directly when an application service boundary exists.
- Do not bypass review-aware write paths when registering write capabilities.
