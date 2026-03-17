# AGENTS.md

## OVERVIEW

- `src/` is now the active TypeScript Butler runtime workspace, no longer just a placeholder skeleton.
- The runtime center of gravity is `src/butler-mcp/`; treat Butler as a PKM-oriented MCP runtime rather than a flat four-layer package surface.
- Code here should still be designed from PKM workflow needs downward, with review-before-write held as a stable execution boundary.

## STRUCTURE

- `index.ts` - root export narrowed to `butler-mcp/`; do not treat `src/` as a flat barrel for `application/`, `domain/`, and `adapter/`.
- `butler-mcp/` - runtime main axis.
  - `runtime/` - runtime context creation and env-based bootstrap.
  - `registry.ts` - capability whitelist registration and runtime assembly.
  - `capabilities/<capability-id>/tool.ts` - each capability owns its MCP schema, handler, and presenter glue in one file.
  - `server.ts` / `main.ts` - MCP server creation and stdio startup.
- `application/` - capability-facing application layer.
  - `use-cases/` - capability-facing orchestration such as target resolution, capture-plan prep, review, and controlled write.
  - `shared/` - pure application-side helpers such as target resolution.
- `domain/` - stable Butler object model and policy rules.
  - `value-objects/` - shared domain references and primitive semantic types.
  - `support/` - small pure helpers used inside the domain.
  - `objects/` - `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`.
  - `builders/` - `WritePlan` construction logic.
  - `policies/` - `Policy Guard` and related review decisions.
- `adapter/` - controlled integration boundary for SiYuan-facing read/write work.
  - `contracts.ts` - read/write contracts such as `ButlerReadModelPort` and `ButlerWritePort`.
  - `read-models.ts` - stable read-model and receipt types.
  - `siyuan/` - thin facade plus split readers, writers, codecs, and support modules.
- `shared/` - reserved for cross-layer shared code, but do not assume it is the center of the runtime design.

## CONVENTIONS

- Build outward from `butler-mcp/` capability boundaries, then let `application/`, `domain/`, and `adapter/` support that runtime surface.
- Keep the runtime semantic and policy-aware; do not let low-level endpoint names dictate public capability boundaries.
- Preserve explicit review-before-write flow: prepare `WritePlan`, pass through `Policy Guard`, then allow controlled execution.
- Use the stable object names from the V0 spec and keep write targets explicit through read-models and application-side target resolution.
- Prefer importing from the nearest subtree entry or concrete module; the root `src/index.ts` is intentionally narrow.

## ANTI-PATTERNS

- Do not copy the raw `vendor/` MCP surface into this runtime unchanged.
- Do not keep describing `src/` as four equal top-level centers when the runtime is now organized around `butler-mcp/`.
- Do not mix agent-facing conversation rules into low-level adapter code.
- Do not bypass `Policy Guard` semantics or let handlers write directly without review-aware paths.
- Do not reintroduce deleted root wrapper modules such as old flat `domain/*.ts` shims; use the real subtree layout.
