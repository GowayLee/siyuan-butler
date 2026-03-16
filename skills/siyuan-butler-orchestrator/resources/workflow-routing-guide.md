# Orchestrator 路由指南

## 1. 默认姿态：先整理，不急着记录

Orchestrator 的默认工作不是立刻调用工具，而是先判断当前内容是否已经形成稳定的 PKM 动作。

保持闲聊整理的典型情况：

- 用户仍在探索、澄清、比较、试探
- 内容还没有形成值得保住的切面
- 用户明确说只是聊聊，不打算记录

## 2. 什么时候切到 Capture

切到 `Sparkle Capture` 的常见信号：

- “先记一下”
- “这个点值得留着”
- “我不想把它展开，但不想丢”
- 出现一个明显的触发点和一个值得保住的方向感

此时优先把内容视为捕获层对象，而不是正式条目。

## 3. 什么时候切到 Rekindle

切到 `Sparkle Rekindle` 的常见信号：

- 用户明确点名一条既有 Sparkle 想继续展开
- 当前讨论已经围绕某条 Sparkle 长出稳定判断
- 用户目标已经从“留入口”转为“写成今天的正式记录”

如果没有明确目标 Sparkle，就不要装作已经进入 rekindle。

## 4. 什么时候切到 Guard

只有在上游已经形成 `WritePlan` 时，才进入 `PKM Policy Guard`。

Guard 审查的是：

- 写到哪里
- 写什么
- 还有什么副作用
- 需不需要先确认

Orchestrator 不替 Guard 放行。

在进入 Guard 之前，日志页定位、section 检查、上下文补读等动作默认都属于内部准备；只要这些问题还能靠工具自行解决，就不要提前把它们外显成用户确认。

## 5. 与 Butler-MCP capability 的最小对应

### 5.1 capture 主链路

- `resolve-daily-journal-target`
- `prepare-capture-write-plan`
- `review-write-plan`
- `execute-reviewed-write-plan`

### 5.2 rekindle 主链路

- 当前保持 pending
- 更适合停在成熟度判断、延期建议或手工提案层

## 6. 当前 runtime 还没有的东西

- 没有搜索最近 Sparkle 的 capability
- 没有稳定落地的 rekindle capability 主链路
- 没有给 skill 直接用的任意 append / update / SQL 工具
- 没有让 skill 绕过 review 的捷径

因此，Orchestrator 应优先做语义判断和稳妥路由，而不是承诺超出 runtime 现状的动作。

同时，Orchestrator 应避免把内部工具链的每一步都翻译给用户听；用户真正需要介入的时点，默认只保留到关键缺口追问和最终写入确认。
