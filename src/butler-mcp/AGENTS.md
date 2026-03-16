# AGENTS.md

## OVERVIEW

- `src/butler-mcp/` is the runtime main axis of the Butler MCP server.
- This subtree owns protocol-facing capability registration, handler wiring, runtime bootstrap, and server startup.
- Keep this layer thin in product logic: handlers should delegate to `src/application/`, not absorb workflow rules.

## STRUCTURE

- `runtime/` - runtime context creation and env-based bootstrap.
- `registry/` - capability whitelist registration and read/write phase assembly.
- `capabilities/<capability-id>/` - per-capability `schema.ts`, `handler.ts`, and `presenter.ts`.
- `server.ts` - Butler MCP server creation and registration entry.
- `main.ts` - stdio startup entrypoint.
- `capability-tools.ts` - compatibility export surface only; do not grow it into a second registry.

## CONVENTIONS

- Register only the Butler semantic capability whitelist.
- Keep schemas aligned with capability-facing application inputs and outputs, not raw SiYuan payload shapes.
- Let handlers validate, delegate, and present; keep workflow branching in `src/application/`.
- Build runtime context once and pass ports/services downward rather than recreating adapter state inside each handler.

## ANTI-PATTERNS

- Do not mirror `vendor/siyuan-mcp-server.ts` tool breadth here.
- Do not let handlers call low-level SiYuan HTTP code directly when an application service boundary exists.
- Do not bypass review-aware write paths when registering write capabilities.
