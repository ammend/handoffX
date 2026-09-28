# handoffX

**你的 AI Agent 下班了，但它没有写交接。**

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

凌晨两点，Agent A 花了 40 分钟排查线上故障。它排除了数据库，找到两条关键日志，还确认了一件事：**千万不要重启主库。**

然后，它的会话结束了。

Agent B 收到 800 条聊天记录，重复了失败的命令，重新怀疑早已排除的方向，最后问：“所以，我们现在到底在解决什么问题？”

A 很聪明，B 也很聪明。但交接失败了。

> 聊天记录是监控录像，不是交接单。

handoffX 是一个开放、可移植、以 Markdown 为载体的 AI Agent 上下文交接协议。它用于跨 Agent、会话、所有者、平台或基础设施传递继续工作所需的最小充分上下文。

## 从 Matt Pocock 的 Handoff 出发

handoffX 的起点，来自 Matt Pocock 在 [Dictionary of AI Coding](https://github.com/mattpocock/dictionary-of-ai-coding) 中对 [Handoff](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Handoff.md) 的定义。

Matt 指出了塑造交接的关键约束：新会话从零上下文开始，而且可能没有机会回头询问旧会话。下一会话需要的一切都必须被明确携带；一份交接是否合格，要看一个零上下文的 Agent 能用它做什么。

handoffX 在这个思想上继续向外推进：如果接收方是另一个人的 Agent、运行在另一个平台，而且需要反问呢？如果 B、C、D 独立消费同一份交接呢？

## 一份 handoff 应该携带什么

handoff 不是发送者全部记忆的倾倒，而是继续工作所需的最小上下文：

- 目标和当前状态；
- 已确认的事实与证据；
- 已尝试的动作及结果；
- 决定、理由与禁止事项；
- 下一步和完成标准；
- 未解决的问题与依赖。

这不是总结聊天记录，而是在转移一项任务的责任。

## 优先用 Agent Skill 体验

在支持开放 Skill 目录格式的 Agent 环境中安装 handoffX：

```bash
npx skills add ammend/handoffX -y -g
```

然后直接告诉 Agent：

```text
使用 handoffX，把当前的支付延迟排查交给 agent-b。
保留事实、失败尝试、禁止事项、下一步和完成标准，
生成一份即使我不在线也能独立使用的 Markdown handoff。
```

接收方可以让自己的 Agent 审阅：

```text
使用 handoffX 审阅这份交接。
信息足够就明确接受；否则只提出会阻塞下一步
或防止高代价错误的问题。
```

接收方不必安装 handoffX。它可以直接阅读 Markdown 并用自然语言回复。Skill 让流程更稳定，但不是使用协议的门槛。

## 交接是一个协商过程

```text
OFFER → REQUEST_INFO → REVISE → ACCEPT
```

发送方提供完整 handoff。接收方可以接受，也可以提出具体问题。答案会合并进一个新的、自包含的修订版，而不是散落在聊天记录中。

同一版本可以交给 B、C、D 或更多接收方。每个人都针对明确的 handoff ID、revision 和 SHA-256 摘要独立回复。B 接受 revision 2，不代表 C 也接受了。

## 为什么是 Markdown？

因为交接最重要的能力，是离开原系统后仍然可读。

Markdown 可以通过聊天附件、邮件、Git、工单、文件系统、HTTP、共享白板、MCP 资源或 A2A artifact 传输，但不依赖其中任何一个。

只有发送方需要工具，接收方只需要能读 Markdown。

SHA-256 将回复和修订绑定到确切的文件字节，用于发现版本不一致；它不能证明作者身份。传输、权限、签名、发现和任务编排不属于 0.1 核心协议。

## 参考 CLI

Node.js/Bun CLI 是供脚本、CI 和 Agent 框架使用的参考生产者、验证器与响应器。协议本身不要求安装 CLI。

```bash
npm install -g github:ammend/handoffX#v0.1.1
```

创建 handoff：

```bash
handoffx create \
  --title "支付延迟排查" \
  --producer "agent-a" \
  --audience "agent-b" \
  --goal "定位 P99 延迟升高的原因" \
  --summary "服务可用，但故障尚未解决" \
  --action "实例从 4 扩到 8，没有改善" \
  --decision "未经批准不要重启主库" \
  --next "检查 16:00 后出现的长事务" \
  --verify "P99 连续 30 分钟低于 500ms"
```

验证与查看：

```bash
handoffx validate .handoff/<file>.md
handoffx digest .handoff/<file>.md
handoffx show <handoff-id>
handoffx list
handoffx deps <handoff-id>
```

回复或修订：

```bash
handoffx respond handoff.md \
  --as agent-b \
  --disposition needs-info \
  --question "哪个角色可以读取生产指标？"

handoffx accept handoff.md --as agent-b --note "可以继续"
handoffx revise handoff-r1.md --body updated-body.md
```

CLI 会生成不可变的回复 artifact 和完整的新修订版。元数据、状态、修订和一致性规则见规范 [handoffX 0.1](SPEC.md)。

## 协议文档

0.1 定义两种 UTF-8 Markdown 文档：

- `handoff`：当前 canonical context；
- `handoff-response`：某个接收方对确切版本的 `accepted`、`needs-info` 或 `rejected` 回复。

补问的答案必须进入下一版 canonical handoff。最终交付物不需要回放协商过程。

## 边界

0.1 刻意不提供：

- 网络传输或 Agent 发现；
- 云文档或聊天平台集成；
- 任务编排；
- 身份认证或数字签名；
- 自动采集记忆、Git、日志或环境信息。

A2A、MCP、聊天系统、共享白板和具体应用适配器都可以承载 handoffX，无需改变协议。

## 开源

handoffX 使用 Apache-2.0 许可证。欢迎参与协议演进与实现，参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

真正的测试很简单：把最重要的一项工作交给一个完全没有聊天历史的 Agent。如果它能继续，交接就成功了；如果它提出阻塞问题，就把答案合并进新版本。

最好的交接不是最长的，而是让下一个 Agent 真正继续前进。
