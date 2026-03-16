# AGENTS.md

## OVERVIEW

- This repo is evolving from a seed bundle into a TypeScript-first SiYuan Butler project with three distinct layers: product/spec docs, Butler runtime design, and future executable code.
- Treat the Butler as a conversational note steward, not a raw CRUD bot over SiYuan.
- Core V0 loop: capture a Sparkle, rekindle it into a formal journal entry, and route every write through review.
- Architectural split is strict: upper layers decide meaning and policy; lower layers perform atomic reads/writes.
- The Butler runtime direction is now `Skill suite + Butler MCP runtime`, with `vendor/` retained as low-level reference material rather than the long-term Butler implementation.

## STRUCTURE

```text
.
|- docs/
|  |- SiYuan-Butler-skill-spec-V0.md    Product source of truth for V0 scope, object model,
|  |                                    workflow sequencing, interaction tone, and Policy Guard.
|  |- Butler-Design/                    Project-facing upstream design notes for workflow design,
|  |                                    object contracts, and runtime planning.
|  `- Butler-PKM/                       PKM methodology notes only; code-agnostic theory and
|                                       Sparkle method materials.
|- skills/                              Planned Butler skill-suite packages for agent-side routing,
|                                       interaction stance, and workflow handoff.
|- src/                                 Planned TypeScript Butler runtime code, centered on the
|                                       SiYuan-Butler MCP server and domain/application layers.
|- tests/                               Planned unit/integration coverage for the Butler runtime.
|- vendor/
|  |- siyuan-mcp-server.ts              Single-file Node MCP server that mirrors SiYuan HTTP APIs
|  |                                    into MCP tools/resources over stdio.
|  `- SiYuan-API_zh_CN.md               Upstream/reference API manual used to verify endpoint
|                                       names, payloads, and caveats.
|- .gitignore                           Generic Node/TS ignore template; not a project style guide.
`- LICENSE                              AGPL-3.0 license text.
```

- `docs/` defines desired behavior, planned architecture, and the bridge from product semantics to runtime design.
- `docs/Butler-Design/` holds project-facing upstream design notes.
- `docs/Butler-PKM/` is reserved for PKM theory and methodology notes only.
- `skills/` is the future agent-facing skill-suite surface.
- `src/` is the future TypeScript runtime surface.
- `vendor/` remains reference and compatibility glue, not the Butler product surface.
- There is still no package manifest, tsconfig, CI workflow, or automated test suite yet.

## SUBAGENT HIERARCHY

- Start here for whole-repo navigation, then consult the closest child `AGENTS.md` before editing inside a subtree.
- Child guides currently exist at:
  - `docs/AGENTS.md`
  - `docs/Butler-Design/AGENTS.md`
  - `docs/Butler-PKM/AGENTS.md`
  - `skills/AGENTS.md`
  - `src/AGENTS.md`
  - `tests/AGENTS.md`
  - `vendor/AGENTS.md`
- Use the root guide for cross-cutting decisions: spec-vs-implementation conflicts, write-safety expectations, naming, and repo-wide limits.
- Use child guides for local file roles, editing boundaries, and subtree-specific gotchas.

## WHERE TO LOOK

- Product behavior, scope, tone, and workflow rules: `docs/SiYuan-Butler-skill-spec-V0.md`
- Sparkle skill upstream design: `docs/Butler-Design/Sparkle-Skill-Upstream-Design.md`
- Project-structure and Butler runtime direction: `docs/Butler-Design/Project-Structure-and-Runtime-Plan.md`
- Current executable/reference surface: `vendor/siyuan-mcp-server.ts`
- Upstream endpoint semantics and API caveats: `vendor/SiYuan-API_zh_CN.md`
- If a change touches both behavior and implementation, reconcile `docs/SiYuan-Butler-skill-spec-V0.md` against the Butler architecture docs explicitly; do not silently favor raw endpoint shape over product semantics.

## CODE MAP

- `docs/SiYuan-Butler-skill-spec-V0.md` defines the four conceptual skills: `PKM Orchestrator`, `Sparkle Capture`, `Sparkle Rekindle`, `PKM Policy Guard`.
- `docs/SiYuan-Butler-skill-spec-V0.md` also defines the shared object model: `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`.
- `docs/Butler-Design/Sparkle-Skill-Upstream-Design.md` clarifies the Sparkle-side skill boundaries, workflow state flow, and object-contract handoff before MCP capability design.
- `docs/Butler-Design/Project-Structure-and-Runtime-Plan.md` records the current decision to build a TypeScript Butler MCP runtime first and let a skill suite sit above it.
- `skills/` is reserved for four Butler-facing skill packages that map onto the conceptual skills in the spec.
- `src/` is reserved for the Butler runtime implementation, with `butler-mcp/`, `domain/`, `adapter/`, and `shared/` as the primary planned subtrees.
- `vendor/siyuan-mcp-server.ts` is organized by conceptual sections inside one file:
  - env/bootstrap and `api()` transport helper
  - MCP tool schema registration
  - large tool-dispatch switch mapping tool names to `/api/...` calls
  - MCP resources for `siyuan://recent` and `siyuan://notebooks`
  - stdio server startup
- `vendor/siyuan-mcp-server.ts` currently exposes the raw low-level action surface across notebooks, docs, blocks, attrs, SQL, files, export, notifications, templates, conversion, and assets.

## CONVENTIONS

- Preserve the product boundary: top-level Butler behavior should stay semantic and policy-aware, not endpoint-shaped.
- Follow the spec's working rule: propose first, write after review.
- Any new write path should make review/preview behavior obvious; do not add silent mutations.
- Prefer narrow semantic operations over dumping the full SiYuan API surface into user-facing flows.
- Design Butler MCP capabilities from the skill/workflow side downward; do not let raw SiYuan endpoints define the Butler tool model.
- Keep notebook targeting explicit; current `create_doc` behavior requires a `notebook` argument and cannot infer one.
- Treat `SIYUAN_WORKSPACE` as removed. Runtime config is `SIYUAN_URL` or `SIYUAN_HOST` plus `SIYUAN_PORT`, with optional `SIYUAN_TOKEN`.
- Chinese source text is authoritative here; preserve meaning when translating, summarizing, or renaming concepts.

## ANTI-PATTERNS (THIS PROJECT)

- Do not recast Butler flows as parameter forms, feature menus, or raw API passthroughs.
- Do not bypass `PKM Policy Guard` when adding or describing write behavior.
- Do not assume the future `skills/` and `shared/` layout already exists in this repo.
- Do not let the broad MCP tool list redefine the intended product surface; the spec explicitly calls for a smaller semantic whitelist.
- Do not treat `vendor/` as the Butler runtime implementation plan; it is reference material and temporary glue.
- Do not rely on implicit notebook selection or workspace-path assumptions that the current adapter does not support.
- Do not add generic scaffolding, framework boilerplate, or fake command docs that are not present in the repo.

## UNIQUE STYLES

- The repo mixes Chinese product writing with English code identifiers; keep terminology stable across both.
- The intended voice is calm, competent, lightly judgmental, and non-mechanical.
- Prefer verbs like capture, rekindle, review, and guard over generic create/update/delete language when discussing Butler behavior.
- Bias toward fewer capabilities with clearer boundaries; V0 explicitly values "few features, strong structure".

## COMMANDS

- No canonical repo command set exists yet: no `package.json`, task runner, test script, or CI entrypoint.
- For runtime investigation, inspect `vendor/siyuan-mcp-server.ts` directly before suggesting execution commands.
- For validation, rely on file-level review and targeted manual checks unless the task itself adds tooling.
- If future commands are introduced, document only the commands that actually exist in-repo.

## NOTES

- First-pass navigation order: spec in `docs/SiYuan-Butler-skill-spec-V0.md`, then runtime code in `vendor/siyuan-mcp-server.ts`, then endpoint reference in `vendor/SiYuan-API_zh_CN.md`.
- `docs/SiYuan-Butler-skill-spec-V0.md` is aspirational in places; call out mismatches instead of rewriting the spec to match current implementation drift.
- `docs/Butler-Design/Sparkle-Skill-Upstream-Design.md` is the current upstream-design bridge for Sparkle workflows before MCP capability design.
- `docs/Butler-Design/Project-Structure-and-Runtime-Plan.md` is the current architecture bridge between the spec and the future runtime.
- `vendor/` is mixed: one executable integration file plus one upstream-style reference doc. Keep those roles distinct.
- Future growth should add local `AGENTS.md` files early when new top-level subtrees become real.
