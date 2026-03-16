# AGENTS.md

## OVERVIEW

- This repo is a seed bundle for SiYuan Butler V0: one product-spec subtree and one SiYuan MCP adapter subtree.
- Current emphasis is architecture, workflow boundaries, and write-safety; the codebase is intentionally small.
- Treat the Butler as a conversational note steward, not a raw CRUD bot over SiYuan.
- Core V0 loop: capture a Sparkle, rekindle it into a formal journal entry, and route every write through review.
- Architectural split is strict: upper layers decide meaning and policy; lower layers perform atomic reads/writes.
- The repo does not yet contain the future skill package layout described in the spec; document that gap instead of assuming it exists.

## STRUCTURE

```text
.
|- docs/
|  `- SiYuan-Butler-skill-spec-V0.md    Product source of truth for V0 scope, object model,
|                                       workflow sequencing, interaction tone, and Policy Guard.
|- vendor/
|  |- siyuan-mcp-server.ts              Single-file Node MCP server that mirrors SiYuan HTTP APIs
|  |                                    into MCP tools/resources over stdio.
|  `- SiYuan-API_zh_CN.md               Upstream/reference API manual used to verify endpoint
|                                       names, payloads, and caveats.
|- .gitignore                           Generic Node/TS ignore template; not a project style guide.
`- LICENSE                              AGPL-3.0 license text.
```

- `docs/` defines desired behavior and boundaries.
- `vendor/` shows current runtime reality and external API reach.
- There is no package manifest, tsconfig, CI workflow, or automated test suite yet.

## SUBAGENT HIERARCHY

- Start here for whole-repo navigation, then consult the closest child `AGENTS.md` before editing inside a subtree.
- Child guides currently exist at:
  - `docs/AGENTS.md`
  - `vendor/AGENTS.md`
- Use the root guide for cross-cutting decisions: spec-vs-implementation conflicts, write-safety expectations, naming, and repo-wide limits.
- Use child guides for local file roles, editing boundaries, and subtree-specific gotchas.

## WHERE TO LOOK

- Product behavior, scope, tone, and workflow rules: `docs/SiYuan-Butler-skill-spec-V0.md`
- Actual executable surface: `vendor/siyuan-mcp-server.ts`
- Upstream endpoint semantics and API caveats: `vendor/SiYuan-API_zh_CN.md`
- If a change touches both behavior and implementation, reconcile `docs/SiYuan-Butler-skill-spec-V0.md` against `vendor/siyuan-mcp-server.ts` explicitly; do not silently favor one.

## CODE MAP

- `docs/SiYuan-Butler-skill-spec-V0.md` defines the four conceptual skills: `PKM Orchestrator`, `Sparkle Capture`, `Sparkle Rekindle`, `PKM Policy Guard`.
- `docs/SiYuan-Butler-skill-spec-V0.md` also defines the shared object model: `SparkleDraft`, `RekindleRequest`, `RekindleProposal`, `WritePlan`, `ReviewResult`.
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
- Keep notebook targeting explicit; current `create_doc` behavior requires a `notebook` argument and cannot infer one.
- Treat `SIYUAN_WORKSPACE` as removed. Runtime config is `SIYUAN_URL` or `SIYUAN_HOST` plus `SIYUAN_PORT`, with optional `SIYUAN_TOKEN`.
- Chinese source text is authoritative here; preserve meaning when translating, summarizing, or renaming concepts.

## ANTI-PATTERNS (THIS PROJECT)

- Do not recast Butler flows as parameter forms, feature menus, or raw API passthroughs.
- Do not bypass `PKM Policy Guard` when adding or describing write behavior.
- Do not assume the future `skills/` and `shared/` layout already exists in this repo.
- Do not let the broad MCP tool list redefine the intended product surface; the spec explicitly calls for a smaller semantic whitelist.
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
- `vendor/` is mixed: one executable integration file plus one upstream-style reference doc. Keep those roles distinct.
- Future growth should add local `AGENTS.md` files early when new top-level subtrees become real.
