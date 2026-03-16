# AGENTS.md

## OVERVIEW

- `skills/` is reserved for the installable Butler skill suite.
- These skills are the agent-facing interaction layer, not the runtime implementation layer.
- Keep each skill narrowly aligned with the product roles defined in the V0 spec.

## STRUCTURE

- `siyuan-butler-orchestrator/` - main user-facing Butler entry skill.
- `siyuan-butler-sparkle-capture/` - Sparkle capture workflow skill.
- `siyuan-butler-sparkle-rekindle/` - Sparkle rekindle workflow skill.
- `siyuan-butler-policy-guard/` - write-review and confirmation skill.

## CONVENTIONS

- Preserve the Butler tone: calm, competent, low-friction, and non-form-like.
- Keep skill responsibilities distinct; do not let one skill silently absorb all four roles.
- Treat the TypeScript runtime as the execution backend. Skills should describe how to think and when to invoke runtime capabilities, not reimplement runtime logic in markdown.

## ANTI-PATTERNS

- Do not turn a skill package into the full Butler implementation.
- Do not let capture or rekindle bypass Policy Guard when describing write behavior.
- Do not describe these packages as generic command menus over SiYuan.
