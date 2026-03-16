# Butler Skill Suite

This directory holds the planned installable skill packages for SiYuan Butler.

The suite mirrors the four workflow roles defined in the V0 spec:

- `siyuan-butler-orchestrator/`
- `siyuan-butler-sparkle-capture/`
- `siyuan-butler-sparkle-rekindle/`
- `siyuan-butler-policy-guard/`

These packages are the agent-facing interaction layer. The main executable logic belongs in the TypeScript Butler runtime under `src/`.

当前已对接的 runtime capability 白名单如下：

- `resolve-daily-journal-target`
- `read-sparkle-record`
- `read-journal-context`
- `prepare-capture-write-plan`
- `prepare-rekindle-write-plan`
- `review-write-plan`
- `execute-reviewed-write-plan`

这些 capability 是 skill 与 runtime 的受控交接口径，不等于 skill 自己承担这些职责。
