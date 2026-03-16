# Capture 字段映射

## 1. 最小必填字段

当前 `SparkleDraft` 至少需要：

- `id`
- `created_at`
- `source_type`
- `sparkle_kind`
- `source`
- `glow`
- `status`

## 2. 字段填写原则

### 2.1 `source_type`

按真实触发源贴近选择：

- `conversation`
- `reading`
- `web`
- `music`
- `image`
- `photo-editing`
- `experiment`
- `work`
- `life`
- `other`

### 2.2 `sparkle_kind`

- `affective`：以气味、意象、感受为主
- `cognitive`：以判断、理解、方法为主
- `mixed`：两者都明显存在

### 2.3 `status`

在还没有真正写入前，默认更适合保持为 `draft`。

不要因为用户说“先记一下”就提前把对象语义写成已完成状态。

### 2.4 `write_intent`

- `proposal_only`：先给草案，不默认保存
- `suggest_save`：你判断值得保存，但用户未明确要求
- `user_requested_save`：用户明确表达要保存

## 3. 可选增强字段

- `trace`：截图、时间点、引用、局部观察
- `pull`：后续还想往哪边碰
- `source_excerpt`：原始触发片段
- `context`：当时的语境
- `why_it_matters`：为什么值得留
- `next_hint`：下次可从哪继续碰
- `target_journal_date`：若要汇入 daily note，应落到哪一天
- `capture_mode`：`auto-extract` / `minimal-followup` / `user-directed`
- `confidence`：低 / 中 / 高
- `tags_hint`：轻量标签建议

## 4. 与 runtime 的边界

- 若 `journal_date` 未单独提供，则 `prepare-capture-write-plan` 依赖 `draft.target_journal_date`
- capture 的目标 section 应是 `sparkles`
- `SparkleDraft` 形成后，先进入 `prepare-capture-write-plan -> review-write-plan`
- 不允许把自由文本直接当写入请求塞给执行端
