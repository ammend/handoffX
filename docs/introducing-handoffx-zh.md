# 你的 AI Agent 下班了，但它没有写交接

凌晨两点，Agent A 花了 40 分钟排查线上故障。

它排除了数据库，找到了两条关键日志，还确认了一件事：**千万不要重启主库。**

就在它准备继续时，会话额度耗尽。

Agent B 被叫来接班。它收到的不是结论，而是 800 条聊天记录。

于是 B 重新怀疑数据库，重复执行了失败的命令，最后问：

> “所以，我们现在到底在解决什么问题？”

A 很聪明，B 也很聪明。但交接失败了。

因为聊天记录是监控录像，不是交接单。

## 从 Matt Pocock 的 Handoff 出发

handoffX 的起点，来自 Matt Pocock 在 [Dictionary of AI Coding](https://github.com/mattpocock/dictionary-of-ai-coding) 中对 [Handoff](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Handoff.md) 的定义。

Matt 指出了关键约束：新会话从零上下文开始，而且可能没有机会回头询问旧会话。因此，下一会话需要的一切都必须被明确携带。一份交接是否合格，要看一个零上下文的 Agent 能用它做什么。

handoffX 向这个思想致敬，并继续追问：如果接班的是另一个用户的 Agent，双方不在同一台机器、同一个平台，甚至接收方还需要反问呢？

## 给 Agent 一张真正的交接单

handoffX 是一个开放、可移植、以 Markdown 为载体的 AI Agent 上下文交接协议。

它不复制发送者的全部记忆，只整理继续工作所需的最小充分上下文：

- 目标和当前状态；
- 已确认的事实与证据；
- 已尝试的动作及结果；
- 决定、理由与禁止事项；
- 下一步和完成标准；
- 未解决的问题。

这不是“总结聊天记录”，而是在转移一项任务的责任。

## 交接不是发完就结束

A 生成 handoff 后，B 可以直接接受，也可以说：

> “我缺少生产指标的访问方式，暂时无法继续。”

A 补充信息并生成完整的 revision 2，B 再确认接受。

```text
OFFER → REQUEST_INFO → REVISE → ACCEPT
```

上下文是否充分，不由发送者猜，而由接班的人判断。补充信息会进入新的完整版本，不会散落在必须回放的聊天记录里。

同一份 handoff 也可以交给 B、C、D。每个接收者分别对确切版本回复；B 的接受，不代表 C 也已经接住。

## 为什么是 Markdown？

因为交接最重要的能力，是离开原系统后仍然可读。

Markdown 可以通过聊天、邮件、Git、工单、文件系统、A2A 或 MCP 移动，但不依赖其中任何一个。发送方可以安装 handoffX，接收方只要能读 Markdown 就能接班。

**发送方安装，接收方零安装。**

handoffX 用 SHA-256 绑定确切版本，帮助发现双方阅读的文件不一致；但它不假装 hash 能证明作者身份。传输、权限、签名和 Agent 编排不属于 0.1 的核心范围。

## 让 Agent 写出第一份 handoff

如果你的 Agent 支持开放 Skill 目录格式，安装 handoffX Skill：

```bash
npx skills add ammend/handoffX -y -g
```

然后直接告诉 Agent：

```text
使用 handoffX，把当前的支付延迟排查交给 agent-b。
保留事实、失败尝试、禁止事项、下一步和完成标准，
生成一份即使我不在线也能独立使用的 Markdown handoff。
```

B 收到文件后，可以让自己的 Agent 审阅：

```text
使用 handoffX 审阅这份交接。
信息足够就明确接受；否则只提出会阻塞下一步的问题。
```

B 没有安装 Skill 也没关系：直接阅读 Markdown，用自然语言接受或提问即可。项目还提供 Node.js/Bun 参考 CLI，供脚本、CI 和 Agent 框架集成。

## 真正的测试

把你现在最重要的一项工作，交给一个完全没有聊天历史的 Agent。

如果它能直接行动，这是一份好交接。

如果它提出问题，就把答案写回新版本。

如果它仍然只能问“所以我们现在要做什么”，那就说明我们还有工作要做。

handoffX 采用 Apache-2.0 协议开源：

- GitHub：<https://github.com/ammend/handoffX>
- 协议规范：<https://github.com/ammend/handoffX/blob/main/SPEC.md>
- v0.1.1：<https://github.com/ammend/handoffX/releases/tag/v0.1.1>

最好的交接不是写得很完整，而是下一个 Agent 真的接着做下去了。
