# Butler Skill Suite

This directory holds the planned installable skill packages for SiYuan Butler.

The suite mirrors the four workflow roles defined in the V0 spec:

- `siyuan-butler-orchestrator/`
- `siyuan-butler-sparkle-capture/`
- `siyuan-butler-sparkle-rekindle/`
- `siyuan-butler-policy-guard/`

These packages are the agent-facing interaction layer. The main executable logic belongs in the TypeScript Butler runtime under `src/`.

在 opencode 的实际工作场景里，skill 自带资源文件默认按已安装目录解析，而不是按仓库工作区根目录解析。

- 例如：`.opencode/skills/siyuan-butler-sparkle-capture/resources/sparkle-foundations.md`
- 不要把 `resources/...` 误解成当前项目根目录下的 `resources/`
- 对 skill 来说，这些资源文件是执行前应先读取的工作记忆，不是可选背景材料

当前已对接的 runtime capability 白名单如下：

- `resolve-daily-journal-target`
- `read-journal-context`
- `prepare-capture-write-plan`
- `review-write-plan`
- `execute-reviewed-write-plan`

当前稳定 runtime 主链路先聚焦 capture；rekindle 仍保留为 pending 设计。

这些 capability 是 skill 与 runtime 的受控交接口径，不等于 skill 自己承担这些职责。
