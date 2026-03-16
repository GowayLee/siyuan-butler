# butler-mcp

这里是 `SiYuan-Butler MCP Server` 的运行时入口目录。

当前阶段已把 V0 白名单 capability 注册到 MCP runtime：

- `resolve-daily-journal-target`
- `read-sparkle-record`
- `read-journal-context`
- `prepare-capture-write-plan`
- `prepare-rekindle-write-plan`
- `review-write-plan`
- `execute-reviewed-write-plan`

运行时边界也随之更明确：

- `server.ts` 负责创建 Butler MCP server，并只注册白名单里的 workflow capability
- `main.ts` 负责最小启动入口，当前采用 stdio transport
- `capability-tools.ts` 负责把 MCP tool 接到 `src/application/` 与 `src/adapter/siyuan/`
- `src/adapter/siyuan/` 提供 env-based 的最小思源 adapter 创建路径

## capability I/O 示例

下面的示例只展示 Butler 对象层的典型入参与出参，不展开底层 SiYuan endpoint 细节。

### 1. `resolve-daily-journal-target`

输入示例：

```json
{
  "journal_date": "2026-03-16",
  "section_kind": "sparkles"
}
```

输出示例：

```json
{
  "resolution": {
    "journal": {
      "journal_date": "2026-03-16",
      "page_id": "20260316103000-abc123",
      "page_exists": true,
      "sparkles_section": {
        "section_kind": "sparkles",
        "section_id": "20260316103100-def456",
        "section_label": "Sparkles",
        "exists": true,
        "append_supported": true
      }
    },
    "target_page": {
      "page_kind": "daily-note",
      "journal_date": "2026-03-16",
      "page_id": "20260316103000-abc123"
    },
    "target_section": {
      "section_kind": "sparkles",
      "section_id": "20260316103100-def456",
      "section_label": "Sparkles",
      "insertion_mode": "append"
    },
    "blocked_by": []
  }
}
```

### 2. `prepare-capture-write-plan`

输入示例：

```json
{
  "journal_date": "2026-03-16",
  "draft": {
    "id": "sparkle-001",
    "created_at": "2026-03-16T10:20:00Z",
    "source_type": "conversation",
    "sparkle_kind": "cognitive",
    "source": "聊到 prompt 设计时意识到边界比功能数更重要",
    "glow": "先钉住 review-before-write，再扩能力面",
    "status": "draft",
    "write_intent": "user_requested_save"
  }
}
```

输出示例：

```json
{
  "write_plan": {
    "plan_id": "8e5d0f4c-3a9b-4f45-8b20-8ed7f4f9f4ab",
    "operation_type": "append-sparkle",
    "origin": "capture",
    "target_page": {
      "page_kind": "daily-note",
      "journal_date": "2026-03-16"
    },
    "target_section": {
      "section_kind": "sparkles",
      "section_label": "Sparkles",
      "insertion_mode": "append"
    },
    "content_preview": {
      "body": "- 先钉住 review-before-write，再扩能力面\n  - source: 聊到 prompt 设计时意识到边界比功能数更重要",
      "preview_format": "markdown"
    },
    "side_effects": [
      {
        "kind": "none",
        "note": "Append the captured Sparkle into the Sparkles section only."
      }
    ],
    "needs_confirmation": false
  }
}
```

### 3. `prepare-rekindle-write-plan`

输入示例：

```json
{
  "journal_date": "2026-03-16",
  "proposal": {
    "source_sparkle_id": "20260316104000-sparkle",
    "rekindle_mode": "full",
    "maturity": "ready",
    "entry_title": "先把写入边界钉住，再谈能力扩张",
    "entry_body": "今天真正清楚的一点是：Butler 不能先把接口铺满，再回头补审查边界。",
    "entry_reason": "这已经不是一个零散提醒，而是当前架构判断。",
    "write_target": {
      "page_kind": "daily-note",
      "journal_date": "2026-03-16",
      "section_kind": "journal-body",
      "section_label": "Journal Body"
    },
    "backref_needed": true
  }
}
```

输出示例：

```json
{
  "write_plan": {
    "plan_id": "7a4f9d9d-55d2-4db8-a6f2-2a2c28b9d7b0",
    "operation_type": "append-journal-entry",
    "origin": "rekindle",
    "target_section": {
      "section_kind": "journal-body",
      "section_label": "Journal Body",
      "insertion_mode": "append"
    },
    "content_preview": {
      "title": "先把写入边界钉住，再谈能力扩张",
      "body": "今天真正清楚的一点是：Butler 不能先把接口铺满，再回头补审查边界。",
      "preview_format": "markdown"
    },
    "side_effects": [
      {
        "kind": "status-backwrite",
        "note": "Mark the source Sparkle as rekindled after the journal entry is written."
      }
    ],
    "backwrite_actions": [
      {
        "action_type": "mark-rekindled",
        "target_id": "20260316104000-sparkle",
        "preview": "Mark the source Sparkle as rekindled."
      }
    ],
    "needs_confirmation": true
  }
}
```

### 4. `review-write-plan`

输入示例：

```json
{
  "write_plan": {
    "plan_id": "7a4f9d9d-55d2-4db8-a6f2-2a2c28b9d7b0",
    "operation_type": "append-journal-entry",
    "origin": "rekindle",
    "target_page": {
      "page_kind": "daily-note",
      "journal_date": "2026-03-16"
    },
    "target_section": {
      "section_kind": "journal-body",
      "section_label": "Journal Body",
      "insertion_mode": "append"
    },
    "content_preview": {
      "title": "先把写入边界钉住，再谈能力扩张",
      "body": "今天真正清楚的一点是：Butler 不能先把接口铺满，再回头补审查边界。",
      "preview_format": "markdown"
    },
    "side_effects": [
      {
        "kind": "status-backwrite",
        "note": "Mark the source Sparkle as rekindled after the journal entry is written."
      }
    ]
  }
}
```

输出示例：

```json
{
  "review_result": {
    "decision": "ask_confirm",
    "reason": "这次写入涉及正式条目或附带影响，需要在当前范围上先确认。",
    "review_summary": "计划已经收拢好了，但最好先确认一次写入范围。",
    "user_prompt": "我已经把这次写入范围收拢好了。若按这个计划继续，就只会执行这里列出的内容。",
    "confirm_scope": "append-journal-entry -> 2026-03-16 / Journal Body",
    "final_write_plan": {
      "plan_id": "7a4f9d9d-55d2-4db8-a6f2-2a2c28b9d7b0"
    }
  }
}
```

### 5. `execute-reviewed-write-plan`

输入示例：

```json
{
  "review_result": {
    "decision": "ask_confirm",
    "reason": "这次写入涉及正式条目或附带影响，需要在当前范围上先确认。",
    "review_summary": "计划已经收拢好了，但最好先确认一次写入范围。",
    "final_write_plan": {
      "plan_id": "7a4f9d9d-55d2-4db8-a6f2-2a2c28b9d7b0",
      "operation_type": "append-journal-entry",
      "origin": "rekindle",
      "target_page": {
        "page_kind": "daily-note",
        "journal_date": "2026-03-16"
      },
      "target_section": {
        "section_kind": "journal-body",
        "section_label": "Journal Body",
        "insertion_mode": "append"
      },
      "content_preview": {
        "title": "先把写入边界钉住，再谈能力扩张",
        "body": "今天真正清楚的一点是：Butler 不能先把接口铺满，再回头补审查边界。",
        "preview_format": "markdown"
      },
      "side_effects": [
        {
          "kind": "status-backwrite",
          "note": "Mark the source Sparkle as rekindled after the journal entry is written."
        }
      ]
    }
  },
  "confirmation_granted": true
}
```

输出示例：

```json
{
  "receipt": {
    "plan_id": "7a4f9d9d-55d2-4db8-a6f2-2a2c28b9d7b0",
    "summary": "已写入正式条目，并完成 1 项 Sparkle 回写。",
    "affected_objects": [
      {
        "object_type": "daily-note",
        "object_id": "20260316103000-abc123",
        "note": "2026-03-16"
      },
      {
        "object_type": "journal-entry",
        "object_id": "20260316112000-entry"
      },
      {
        "object_type": "sparkle",
        "object_id": "20260316104000-sparkle",
        "note": "backwrite"
      }
    ]
  }
}
```

## 推荐调用顺序

- Capture 主链：`prepare-capture-write-plan` -> `review-write-plan` -> `execute-reviewed-write-plan`
- Rekindle 主链：`read-sparkle-record` -> `read-journal-context` -> `prepare-rekindle-write-plan` -> `review-write-plan` -> `execute-reviewed-write-plan`
- 若只是先确认目标位置或章节是否成立，可单独调用 `resolve-daily-journal-target`

这里刻意还没有：

- 面向思源原始 API 的镜像式能力暴露
- skill 侧的语义判断、成熟度判断与正文创作
- 完整依赖注入框架或更重的 runtime 组装层

因此，这里当前表达的是：MCP runtime 已开始承接 `skill -> application -> adapter` 的主链路，但仍只暴露经过设计文档约束的受控能力面。

换句话说，这里现在钉住的是 capability 边界、review-before-write 执行路径，以及 Skill 与 runtime 的交接口径，而不是原始 API 菜单。
