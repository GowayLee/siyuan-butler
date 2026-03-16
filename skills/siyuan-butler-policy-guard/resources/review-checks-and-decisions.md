# Review 检查与结论

## 1. 当前稳定检查项

当前 runtime 会稳定生成四类检查：

- `target-clear`
- `preview-clear`
- `semantic-fit`
- `side-effects-acceptable`

## 2. 当前实际结论逻辑

### 2.1 `allow`

典型条件：

- `WritePlan` 已收拢
- 目标清晰
- 预览完整
- 没有额外副作用需要确认

当前最典型场景是低风险的 `append-sparkle`。

### 2.2 `ask_confirm`

当前 runtime 通常在这些情况要求确认：

- `needs_confirmation === true`
- `operation_type !== append-sparkle`
- `side_effects` 中存在非 `none` 项

### 2.3 `downgrade`

当前 runtime 在 `WritePlan` 还没真正收拢好时会降级。常见原因：

- `plan_id` 缺失
- `journal_date` 不明确
- `content_preview.body` 为空
- `side_effects` 说明缺失
- `operation_type` 与 `target_section` 不匹配
- `blocked_by` 仍有未解决问题

### 2.4 `reject`

schema 中保留了 `reject`，但当前实现主路径仍以 `allow / ask_confirm / downgrade` 为主。更硬的拒绝通常应该在更上游先发生，而不是等到执行边界才处理。

## 3. 输出对象的边界

- `allow` / `ask_confirm` 应带 `final_write_plan`
- `ask_confirm` 最好带清晰的 `confirm_scope`
- `downgrade` 应说明保留成什么非写入结果
- 不要伪造一个其实还不能执行的 `final_write_plan`
