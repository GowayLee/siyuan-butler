# AGENTS.md

## OVERVIEW

- `src/` is reserved for the future TypeScript Butler runtime.
- The runtime center of gravity is the `SiYuan-Butler MCP Server`, not the raw SiYuan API surface.
- Code here should be designed from PKM workflow needs downward.

## STRUCTURE

- `butler-mcp/` - MCP server runtime and protocol-facing entrypoints.
- `application/` - workflow/use-case orchestration between skills, domain rules, and adapters.
- `domain/` - stable Butler objects and domain rules.
- `adapter/` - low-level implementation adapters, including future SiYuan integration.
- `shared/` - cross-cutting schemas, constants, and utilities.

## CONVENTIONS

- Keep the runtime semantic and policy-aware; do not let low-level endpoint names dictate public capability boundaries.
- Preserve explicit review-before-write flow.
- Use the stable object names from the V0 spec.

## ANTI-PATTERNS

- Do not copy the raw `vendor/` MCP surface into this runtime unchanged.
- Do not mix agent-facing conversation rules into low-level adapter code.
- Do not bypass Policy Guard semantics in runtime write paths.
