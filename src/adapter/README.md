# adapter

这里放 Butler runtime 的底层适配边界，而不是直接平铺 SiYuan 原始 API。

当前阶段只先落最小几类内容：

- read-model 类型，用来表达 daily note / Sparkle / section 的稳定读取结果
- target resolver 纯函数，用来把日志页与章节定位收敛成 `TargetPageRef` / `TargetSectionRef`
- 受控执行端口，用来承接已经通过 review 的 `WritePlan`
- `siyuan/` 下的最小 HTTP adapter，用来把这些端口接到思源 API

这里刻意还没有：

- 任意 block 级写入能力
- 原始 endpoint 对 endpoint 的镜像包装
- 绕过 `ReviewResult` 的直接执行路径

当前 `siyuan/` 子目录只实现 Butler V0 主链路最需要的几件事：

- 读取指定日志页与目标 section 是否存在
- 读取 Butler 自己写出的 Sparkle 记录
- 读取最小 journal context
- 执行已经通过 review 的 append / backwrite

它仍然不是通用 SiYuan SDK，也不是 raw MCP 面的搬运。
