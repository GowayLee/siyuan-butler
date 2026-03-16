# domain

这里是 Butler runtime 的稳定领域层，围绕对象契约、构建规则与审查规则组织。

当前目录已经开始按职责拆分：

- `value-objects/` - 跨对象复用的基础类型与引用结构
- `support/` - 领域内部共用的小型纯工具
- `objects/` - `SparkleDraft`、`RekindleRequest`、`RekindleProposal`、`WritePlan`、`ReviewResult`
- `builders/` - 从领域对象收敛出 `WritePlan` 的构建逻辑
- `policies/` - `Policy Guard` 一类的审查与放行规则
