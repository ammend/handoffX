# handoffX 0.1 design notes

The normative protocol is [`SPEC.md`](../SPEC.md). This document records product boundaries and rationale.

## Protocol first

The Markdown exchange format is the product boundary. The CLI is a reference implementation, not a prerequisite. A producer can use handoffX while every receiver remains unmodified.

## Interoperability boundary

handoffX is most useful where direct context sharing is unavailable:

- different AI agent vendors;
- local and cloud agents;
- different owners or organizations;
- isolated development and operations environments;
- different chat, workflow, or memory systems.

Inside one platform, a shared whiteboard may be the best place to negotiate. The accepted Markdown is still useful as a frozen, portable checkpoint. Across platforms, Markdown is the lowest common representation.

## Artifact versus transport

```text
A2A / MCP / HTTP / chat / email / filesystem = transport or resource access
handoffX                                     = payload and negotiation semantics
```

handoffX does not compete with A2A discovery, task lifecycle, streaming, or authentication. An A2A implementation can send a handoff artifact and receive handoff response artifacts as task artifacts or messages.

## Multi-receiver model

One offer can be consumed by many receivers. Each response is independent and immutable. Acceptance is never global:

```text
B accepted r2
C needs-info on r2
D accepted r1
```

The producer can aggregate questions into a common next revision. If audiences need different confidential or role-specific context, the producer creates separate dependent handoffs rather than pretending `audience` is access control.

## Why Markdown

- Humans and agents can read it directly.
- It survives loss of the originating service.
- It can be attached to nearly any transport.
- Frontmatter supports minimal machine semantics.
- The body can remain useful when a receiver ignores every extension.

## Version 0.1 success criteria

The protocol should be tested with real cross-agent handoffs and evaluated by:

- time to the receiver's first useful action;
- number of clarification rounds;
- repeated investigation after acceptance;
- missing evidence or rationale;
- inadvertent sensitive-data disclosure;
- successful consumption by receivers without handoffX.

Future features should be justified by observed failures, not anticipated platform breadth.
