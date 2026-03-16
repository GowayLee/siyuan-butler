# AGENTS.md

## OVERVIEW

- `docs/` is the product and behavior source of truth for SiYuan Butler V0.
- The current document defines scope, workflow sequencing, interaction style, object model, and write-review policy.
- Treat this subtree as design intent, not proof that the implementation already matches it.

## STRUCTURE

- `SiYuan-Butler-skill-spec-V0.md` - full V0 spec covering product positioning, three-layer architecture, four-skill split, object model, workflow paths, safety rules, and aspirational package layout.
- The directory currently has one dense spec file, so structure is section-based rather than file-based.
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
- Skill boundaries and tone requirements: `docs/SiYuan-Butler-skill-spec-V0.md:103`
- Object model and semantic whitelist guidance: `docs/SiYuan-Butler-skill-spec-V0.md:228`
- Workflow paths and Policy Guard rules: `docs/SiYuan-Butler-skill-spec-V0.md:359`
- Aspirational future package layout: `docs/SiYuan-Butler-skill-spec-V0.md:462`

## CONVENTIONS

- Write from the product point of view first: why the Butler behaves this way, what boundaries matter, and when writes are allowed.
- Preserve the note-butler stance: calm, capable, low-friction, minimal questioning, never a raw command bot.
- Keep the sequence explicit when relevant: propose, review, then write.
- Label future-facing ideas clearly; the `skills/` and `shared/` layout is planned structure, not current repository fact.
- Use the object names exactly as defined in the spec when extending or clarifying documentation.

## ANTI-PATTERNS

- Do not rewrite this subtree into implementation docs for code that does not exist.
- Do not let implementation shortcuts erase the documented review and safety boundaries.
- Do not expand V0 beyond Sparkle capture, Sparkle rekindle, and Policy Guard without marking it as future work.
- Do not describe the Butler as a CRUD shell, menu system, or form wizard.
- Do not treat the aspirational package map as if those directories are already present.
