# AGENTS.md

## OVERVIEW

- `src/application/` is the capability-facing orchestration layer for Butler workflows.
- This subtree turns skill/runtime intent into controlled actions that can be reviewed, confirmed, and executed.
- Keep it focused on use-case flow, not MCP protocol details and not raw SiYuan transport concerns.

## STRUCTURE

- `use-cases/` - entrypoints called by MCP capability handlers; each file owns a focused capability-facing flow.
- `shared/` - pure application helpers such as target resolution and other cross-use-case logic.
- `capability-map.ts` - capability whitelist metadata exposed upward to the runtime.

## CONVENTIONS

- Accept and return stable Butler objects/read-models, not transport-specific payload fragments.
- Route all write intents through `WritePlan` and `ReviewResult` boundaries.
- Use `adapter/contracts.ts` for external effects and keep use-case functions deterministic where possible.
- Keep helper modules thin and let each use-case file own the orchestration that handlers actually call.

## ANTI-PATTERNS

- Do not put MCP schema parsing or presenter formatting here.
- Do not move `Policy Guard` decisions into handlers or adapters.
- Do not let workflows grow into raw endpoint choreography; that belongs in adapter implementations.
