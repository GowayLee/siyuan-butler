# AGENTS.md

## OVERVIEW

- `src/application/` is the capability-facing orchestration layer for Butler workflows.
- This subtree turns skill/runtime intent into controlled actions that can be reviewed, confirmed, and executed.
- Keep it focused on use-case flow, not MCP protocol details and not raw SiYuan transport concerns.

## STRUCTURE

- `services/` - entrypoints called by MCP capability handlers.
- `workflows/capture/` - capture-side preparation of write plans.
- `workflows/rekindle/` - rekindle-side proposal and write-plan preparation.
- `workflows/review/` - review and controlled-write orchestration.
- `workflows/shared/` - shared workflow steps such as target resolution and common preparation.
- `capability-map.ts` - capability whitelist metadata exposed upward to the runtime.

## CONVENTIONS

- Accept and return stable Butler objects/read-models, not transport-specific payload fragments.
- Route all write intents through `WritePlan` and `ReviewResult` boundaries.
- Use `adapter/ports/` contracts for external effects and keep workflow functions deterministic where possible.
- Keep service modules as thin capability-facing facades over workflow modules.

## ANTI-PATTERNS

- Do not put MCP schema parsing or presenter formatting here.
- Do not move `Policy Guard` decisions into handlers or adapters.
- Do not let workflows grow into raw endpoint choreography; that belongs in adapter implementations.
