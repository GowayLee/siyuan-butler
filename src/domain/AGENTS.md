# AGENTS.md

## OVERVIEW

- `src/domain/` holds Butler's stable object contracts, value objects, builders, and policy rules.
- This subtree defines the semantic backbone for capture, rekindle, review, and controlled write behavior.
- Prefer stable object meaning over convenience exports or flat wrapper files.

## STRUCTURE

- `value-objects/` - shared semantic references and primitive domain types.
- `support/` - small pure helpers used inside the domain.
- `objects/` - core Butler objects such as `SparkleDraft`, `RekindleProposal`, `WritePlan`, and `ReviewResult`.
- `builders/` - object-to-plan construction logic.
- `policies/` - review and release rules such as `Policy Guard`.

## CONVENTIONS

- Keep domain code pure and side-effect free.
- Preserve the V0 object names and their semantic boundaries from the spec and design docs.
- Make write safety explicit in object fields such as `side_effects`, `blocked_by`, `needs_confirmation`, and review checks.
- Prefer adding small focused modules under the real subtree over reintroducing flat root wrapper shims.

## ANTI-PATTERNS

- Do not embed MCP server concerns or adapter transport details here.
- Do not weaken `WritePlan` normalization and reviewability just to simplify callers.
- Do not reintroduce deleted flat modules such as old root-level `common.ts` or `write-plan.ts` wrappers.
