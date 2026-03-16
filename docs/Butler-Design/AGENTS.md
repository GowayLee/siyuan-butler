# AGENTS.md

## OVERVIEW

- `docs/Butler-Design/` holds project-facing upstream design and architecture notes.
- Files here refine the main V0 spec, but do not replace it as the product source of truth.
- This subtree is for workflow design, object contracts, and runtime planning; PKM theory remains in `docs/Butler-PKM/`.

## STRUCTURE

- `Sparkle-Skill-Upstream-Design.md` - Sparkle 主链路的上游设计，聚焦 skill 边界、状态流转与对象交接。
- `Butler-Object-Contracts-Draft.md` - 五个核心对象的中文契约细化草案。
- `Project-Structure-and-Runtime-Plan.md` - `skill suite + MCP runtime` 的工程分层与目录规划。

## WHERE TO LOOK

- Product-level source of truth: `docs/SiYuan-Butler-skill-spec-V0.md`
- PKM methodology source: `docs/Butler-PKM/Sparkle-model.md`
- Sparkle workflow and handoff design: `docs/Butler-Design/Sparkle-Skill-Upstream-Design.md`
- Object contract draft: `docs/Butler-Design/Butler-Object-Contracts-Draft.md`
- Runtime layering plan: `docs/Butler-Design/Project-Structure-and-Runtime-Plan.md`

## CONVENTIONS

- Keep these documents upstream-facing: clarify semantics and boundaries before implementation.
- Preserve the sequence `skill / workflow / object contract -> MCP capability`, not the reverse.
- Keep stable object names: `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`.

## ANTI-PATTERNS

- Do not move PKM theory notes into this subtree.
- Do not let runtime convenience redefine the product boundary.
- Do not write raw SiYuan API notes here; `vendor/` already covers that reference role.
