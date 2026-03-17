# siyuan-butler

尝试用 agentic 方法实践我的 PKM。

这是一个面向思源笔记（SiYuan）的 AI Workflow 项目：

- 上层用 skill 组织 PKM 工作流
- 下层用 TypeScript MCP runtime 承接语义对应的受控读写

## 为什么做这个

我曾经常常被双链笔记、daily note 等 PKM 理念与功能吸引，但很快发现：真正消耗记录动力的，不是懒得记，而是“怎么组织语言”和“怎么按方法论落到系统里”这件事本身带来的摩擦。

这个项目想借助 skill 与 MCP 搭一层桥梁，让 AI 帮助我更低摩擦地实践 PKM。

这不是“AI 帮我写笔记”，而是“AI 帮助我把自己的想法，在 PKM 指导下，持续而稳定地沉淀到思源笔记里”。

## 现在在做什么

- 把 Butler 做成“笔记管家”
- 实现了第一条链路：Sparkle capture | 在 daily-note 中随时记录你的灵感
- 所有写入都尽量走 preview / review / confirm 的安全边界

## 仓库大致结构

- `docs/`：产品规格、设计草案、PKM 方法论
- `skills/`：面向 agent 的 skill 套件
- `src/`：TypeScript Butler runtime
- `tests/`：运行时测试
- `vendor/`：SiYuan API / MCP 参考实现与资料

## 本地开发

```bash
npm install
npm run build
npm test
```

启动 MCP runtime：

```bash
npm run start:mcp
```

常用环境变量：

- `SIYUAN_URL` 或 `SIYUAN_HOST` + `SIYUAN_PORT`
- `SIYUAN_TOKEN`（可选）
- `SIYUAN_NOTEBOOK`（当前必填）

如果你想先了解项目意图，推荐按这个顺序看：

1. `docs/SiYuan-Butler-skill-spec-V0.md`
2. `docs/Butler-Design/Project-Structure-and-Runtime-Plan.md`
3. `src/butler-mcp/README.md`
