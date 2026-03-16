# AGENTS.md

## OVERVIEW

- `docs/Butler-PKM/` holds PKM-methodology notes only.
- Files here clarify the underlying note-taking method and terminology, but they do not override the product contract defined in `docs/SiYuan-Butler-skill-spec-V0.md`.
- Project design and runtime architecture belong in `docs/`, not in this subtree.

## STRUCTURE

- `Sparkle-model.md` - methodology note describing why Sparkle exists, what it captures, and how it differs from full notes.

## WHERE TO LOOK

- Sparkle concept and capture philosophy: `docs/Butler-PKM/Sparkle-model.md`
- Sparkle skill/workflow upstream design: `docs/Sparkle-Skill-Upstream-Design.md`
- Repo structure, runtime layering, and packaging direction: `docs/Project-Structure-and-Runtime-Plan.md`
- Product-level workflow and object model: `docs/SiYuan-Butler-skill-spec-V0.md`

## CONVENTIONS

- Keep the Butler's semantic center of gravity in PKM workflows, not in SiYuan endpoint shape.
- Keep this subtree code-agnostic and methodology-oriented.
- Preserve stable terminology: `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`.

## ANTI-PATTERNS

- Do not turn this subtree into raw API notes; `vendor/` already serves that purpose.
- Do not place runtime architecture, package layout, or implementation planning documents in this subtree.
- Do not describe the Butler runtime as a generic CRUD backend.
- Do not let local implementation convenience erase the spec's review and write-safety boundaries.
