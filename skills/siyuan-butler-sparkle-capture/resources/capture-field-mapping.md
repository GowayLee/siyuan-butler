# Capture 字段映射

## 1. 最小必填字段

当前 `SparkleDraft` 至少需要：

- `source`
- `glow`

## 2. 字段填写原则

### 2.1 `source`

- 保住触发物
- 可以是曲目、链接、网页标题、对话主题、实验场景、图片描述
- 不需要额外包一层类型字段来解释它来自哪里

### 2.2 `glow`

- 保住这条 Sparkle 真正发亮的判断、感受、意象或方向
- 允许是词组、短句、问题或类比
- 不要求解释完整

## 3. 可选增强字段

- `trace`：截图、时间点、引用、局部观察
- `pull`：后续还想往哪边碰

## 4. 与 runtime 的边界

- `journal_date` 是写入目标输入，不属于 `SparkleDraft` 本体
- capture 的目标 section 应是 `sparkles`
- `SparkleDraft` 形成后，先进入 `prepare-capture-write-plan -> review-write-plan`
- 当前 runtime 不再默认写入 Sparkle block attrs
- 不允许把自由文本直接当写入请求塞给执行端
