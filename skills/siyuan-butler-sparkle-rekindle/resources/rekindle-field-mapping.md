# Rekindle 字段映射

当前 rekindle runtime 仍处于 pending 状态；本文件保留为未来设计草案，而不是当前稳定执行契约。

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

其中 `backref_needed` / `backref_hint` 在当前阶段更像未来设计提示，不应被表述成已稳定可执行的 runtime 回写动作。

## 4. 与 runtime 的边界

- 当前不要默认承诺这些工具已构成稳定 rekindle 主链路
- 在 rekindle 重新设计完成前，更适合停在成熟度判断、延期建议或手工提案层
