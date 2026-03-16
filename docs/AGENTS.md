# AGENTS.md

## OVERVIEW

- `docs/` is the product and behavior source of truth for SiYuan Butler V0, plus future-facing architecture notes that bridge the spec to implementation.
- The main spec defines scope, workflow sequencing, interaction style, object model, and write-review policy.
- `docs/Butler-PKM/` holds PKM methodology notes only; project design and runtime planning stay in `docs/` root.
- Treat this subtree as design intent, not proof that the implementation already matches it.

## STRUCTURE

- `SiYuan-Butler-skill-spec-V0.md` - full V0 spec covering product positioning, three-layer architecture, four-skill split, object model, workflow paths, safety rules, and aspirational package layout.
- `Sparkle-Skill-Upstream-Design.md` - Sparkle 主链路的上游设计文档，聚焦 skill 边界、状态流转、对象契约，以及它们对后续 MCP 设计的约束。
- `Project-Structure-and-Runtime-Plan.md` - 项目结构与运行时分层规划，说明 `skill suite + MCP runtime` 的整体方向。
- `Butler-PKM/` - PKM 方法论笔记子目录，用于保存与代码无关的理论材料。
- Important section groups inside the spec:
  - product goals and non-goals
  - architecture and skill boundaries
  - interaction stance and language style
  - object model and workflow design
  - Policy Guard review rules
  - future `skills/` and `shared/` packaging sketch

## COMPONENTS

- `PKM Orchestrator` - user-facing routing layer; decides when a conversation should stay conversational, become capture, or become rekindle.
- `Sparkle Capture` - extracts a lightweight, revivable idea into a `SparkleDraft`.
- `Sparkle Rekindle` - turns an existing Sparkle into a mature journal-entry proposal.
- `PKM Policy Guard` - reviews write plans, decides allow/confirm/downgrade/reject, and enforces preview before risky writes.
- Shared object model - `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`; keep these names stable.

## WHERE TO LOOK

- V0 scope and design principles: `docs/SiYuan-Butler-skill-spec-V0.md:18`
- Sparkle upstream skill/workflow/object design: `docs/Sparkle-Skill-Upstream-Design.md`
- Skill boundaries and tone requirements: `docs/SiYuan-Butler-skill-spec-V0.md:103`
- Object model and semantic whitelist guidance: `docs/SiYuan-Butler-skill-spec-V0.md:228`
- Workflow paths and Policy Guard rules: `docs/SiYuan-Butler-skill-spec-V0.md:359`
- Aspirational future package layout: `docs/SiYuan-Butler-skill-spec-V0.md:462`
- Butler runtime and repo-structure plan: `docs/Project-Structure-and-Runtime-Plan.md`

## CONVENTIONS

- Write from the product point of view first: why the Butler behaves this way, what boundaries matter, and when writes are allowed.
- Preserve the note-butler stance: calm, capable, low-friction, minimal questioning, never a raw command bot.
- Keep the sequence explicit when relevant: propose, review, then write.
- Label future-facing ideas clearly; the `skills/` and `shared/` layout is planned structure, not current repository fact.
- Use the object names exactly as defined in the spec when extending or clarifying documentation.
- When documenting architecture, make it clear whether a directory or runtime component already exists in-repo or is the intended target shape.

## ANTI-PATTERNS

- Do not rewrite this subtree into implementation docs for code that does not exist.
- Do not let implementation shortcuts erase the documented review and safety boundaries.
- Do not expand V0 beyond Sparkle capture, Sparkle rekindle, and Policy Guard without marking it as future work.
- Do not describe the Butler as a CRUD shell, menu system, or form wizard.
- Do not treat the aspirational package map as if those directories are already present.
- Do not let implementation notes in `docs/Butler-PKM/` overwrite the product boundaries set by `docs/SiYuan-Butler-skill-spec-V0.md`.
