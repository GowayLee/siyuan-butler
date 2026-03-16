# Rekindle 字段映射

## 1. `RekindleProposal` 核心字段

- `source_sparkle_id`
- `rekindle_mode`
- `maturity`
- `entry_title`
- `entry_body`
- `entry_reason`
- `write_target`

## 2. 核心字段怎么填

### 2.1 `source_sparkle_id`

必须明确指向哪条既有 Sparkle。当前 runtime 没有“搜索最近 Sparkle”的 capability，因此不要假装可以在目标不明时直接复燃。

### 2.2 `rekindle_mode`

- `brief`
- `full`
- `postpone`

这是写入力度判断，不是长度偏好。

### 2.3 `maturity`

- `borderline`
- `ready`
- `strong`

用于表达当前成熟度，而不是写作自信心。

### 2.4 `write_target`

- `page_kind` 应保持 `daily-note`
- `section_kind` 应保持 `journal-body`
- `journal_date` 能明确时尽量明确

### 2.5 `entry_reason`

说明为什么现在值得写，而不是重复正文本身。

## 3. 常见增强字段

- `summary_line`
- `open_questions`
- `evidence`
- `backref_needed`
- `backref_hint`
- `downgrade_reason`
- `style_hint`
- `confidence`

## 4. 与 runtime 的边界

- 读取既有 Sparkle 时优先用 `read-sparkle-record`
- 需要同日日志上下文时，再用 `read-journal-context`
- `prepare-rekindle-write-plan` 需要 `journal_date`，或 `proposal.write_target.journal_date` 已明确
- 正式条目与回写动作通常会在 review 阶段触发 `ask_confirm`
