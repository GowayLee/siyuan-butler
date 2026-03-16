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
- `SIYUAN_DAILY_NOTE_HPATH_PREFIX` 默认为 `/daily`
- `SIYUAN_SPARKLES_SECTION_LABEL` 默认为 `Sparkles`
- `SIYUAN_JOURNAL_BODY_SECTION_LABEL` 默认为 `Journal Body`

当前实现的结构假设也保持显式：

- daily note 通过人类可读路径定位
- `Sparkles` 与 `Journal Body` 通过标题文本定位
- 章节追加默认把标题块当作 append parent
- Sparkle 读取优先面向 Butler 自己写出的 capture 格式与自定义 attrs

这保证了当前 adapter 仍然是 Butler workflow 的受控执行端，而不是通用 SiYuan SDK。
