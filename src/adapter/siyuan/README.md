# siyuan adapter

这里是 Butler V0 的最小思源 HTTP adapter。

当前只接了主链路真正需要的 endpoint：

- `/api/filetree/getIDsByHPath`
- `/api/block/getChildBlocks`
- `/api/block/getBlockKramdown`
- `/api/attr/getBlockAttrs`
- `/api/filetree/getHPathByID`
- `/api/block/appendBlock`
- `/api/attr/setBlockAttrs`

环境变量约定：

- `SIYUAN_URL` 或 `SIYUAN_HOST` + `SIYUAN_PORT`
- `SIYUAN_TOKEN` 可选
- `SIYUAN_NOTEBOOK` 必填
- `SIYUAN_DAILY_NOTE_HPATH_TEMPLATE` 默认为 `/{{year}}/{{month}}/{{date}}`
- `SIYUAN_SPARKLES_SECTION_LABEL` 默认为 `Sparkles`
- `SIYUAN_JOURNAL_BODY_SECTION_LABEL` 默认为 `Journal Body`

当前支持的日志路径日期变量：

- `{{year}}` -> `2026`
- `{{month}}` -> `03`
- `{{day}}` -> `16`
- `{{date}}` -> `2026-03-16`

当前实现的结构假设也保持显式：

- daily note 通过人类可读路径定位
- `Sparkles` 与 `Journal Body` 通过标题文本定位
- 章节追加默认把标题块当作 append parent
- Sparkle 读取优先面向 Butler 自己写出的 capture 格式与自定义 attrs

当前代码也已经开始按职责拆分：

- `client.ts` / `config.ts` / `types.ts` 提供底层 HTTP 接线
- `readers/` 负责 daily journal / sparkle record / journal context 的 read-model 组装
- `writers/` 负责 append 与 backwrite 的受控执行
- `codecs/` 负责 markdown 与 attrs 的解析/渲染
- `adapter.ts` 保持为薄 facade，避免再次长成单个大类

这保证了当前 adapter 仍然是 Butler workflow 的受控执行端，而不是通用 SiYuan SDK。
