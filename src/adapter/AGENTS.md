# AGENTS.md

## OVERVIEW

- `src/adapter/` is the controlled integration boundary between Butler semantics and SiYuan-facing execution.
- This subtree serves the Butler workflow; it is not a generic SiYuan SDK and not a raw endpoint mirror.
- Keep read models, target resolution, and write execution explicit so review-aware behavior stays inspectable.

## STRUCTURE

- `contracts.ts` - read/write contracts consumed by `src/application/`.
- `read-models.ts` - stable read-model and receipt types.
- `siyuan/` - thin facade plus `readers/`, `writers/`, `codecs/`, and `support/` modules for concrete integration.

## CONVENTIONS

- Keep `contracts.ts` capability-oriented and review-aware, not endpoint-shaped.
- Use `read-models.ts` to stabilize what application/use-cases can rely on after reads.
- Keep `siyuan/adapter.ts` thin and push parsing/execution details down into focused modules.

## ANTI-PATTERNS

- Do not expose arbitrary block operations just because SiYuan supports them.
- Do not bypass `ReviewResult` or `WritePlan` boundaries in execution paths.
- Do not let `siyuan/` collapse back into one growing god file.
