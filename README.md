# handoffX

**Your AI agent clocked out without writing a handoff.**

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

At 2 a.m., Agent A spends forty minutes investigating an incident. It rules out the database, finds two critical logs, and confirms one thing: **do not restart the primary database**.

Then its session ends.

Agent B receives 800 chat messages, repeats a failed command, reopens an old theory, and finally asks: “What problem are we solving?”

Both agents are capable. The handoff failed.

> A chat transcript is surveillance footage, not a shift report.

handoffX is an open, portable, Markdown-native context handoff protocol for AI agents. It carries the minimum sufficient context needed to continue work across agent, session, owner, platform, or infrastructure boundaries.

## From Matt Pocock's Handoff

handoffX is inspired by Matt Pocock's definition of [Handoff](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Handoff.md) in the [Dictionary of AI Coding](https://github.com/mattpocock/dictionary-of-ai-coding).

Matt identifies the constraint that shapes a handoff: a new session starts with zero context and may have no return path to the old session. Everything the next session needs must be carried explicitly, and the artifact should be judged by what a zero-context agent can do with it.

handoffX extends that idea across owners and infrastructure: What if the receiver is another person's agent, on another platform, and needs to ask questions? What if B, C, and D consume the same handoff independently?

## What a handoff carries

A handoff is not a dump of the producer's memory. It contains the minimum context required to continue:

- objective and current state;
- facts and evidence;
- attempted actions and outcomes;
- decisions, rationale, and prohibitions;
- next actions and exit criteria;
- unresolved questions and dependencies.

This is not chat summarization. It is a transfer of task responsibility.

## Try it as an Agent Skill

Install the transport-independent `handoffx` skill in an Agent environment that supports the open skills directory format:

```bash
npx skills add ammend/handoffX -y -g
```

Then tell your agent:

```text
Use handoffX to hand the current payment-latency investigation to agent-b.
Keep facts, failed attempts, prohibitions, next actions, and exit criteria.
Create a Markdown handoff that remains usable when I am offline.
```

The receiving agent can review it with:

```text
Use handoffX to review this handoff.
Accept it if you can continue; otherwise ask only questions that block
the next useful action or prevent a high-cost mistake.
```

The receiver does not need handoffX. It can read the Markdown and reply in natural language. The Skill makes the workflow more consistent; it is not a gate to the protocol.

## Handoff is a negotiation

```text
OFFER → REQUEST_INFO → REVISE → ACCEPT
```

The producer offers a complete handoff. A receiver either accepts it or asks concrete questions. Answers are merged into a new, self-contained revision rather than left scattered through a chat transcript.

One revision can be offered to B, C, D, or any number of receivers. Each responds independently to an exact handoff ID, revision, and SHA-256 digest. B accepting revision 2 does not imply that C accepted it.

## Why Markdown?

The most important property of a handoff is that it remains readable after leaving its original system.

Markdown can travel through chat attachments, email, Git, issue trackers, filesystems, HTTP, shared whiteboards, MCP resources, or A2A artifacts. None is a dependency.

Only the producer needs tooling. A receiver only needs to read Markdown.

SHA-256 binds responses and revisions to exact file bytes, detecting version mismatch. It does not authenticate authors. Transport, permissions, signatures, discovery, and task orchestration remain outside the 0.1 core.

## Reference CLI

The Node.js/Bun CLI is a reference producer, validator, and responder for scripts, CI, and Agent frameworks. The protocol does not require it.

```bash
npm install -g github:ammend/handoffX#v0.1.1
```

Create a handoff:

```bash
handoffx create \
  --title "Checkout latency investigation" \
  --producer "agent-a" \
  --audience "agent-b" \
  --goal "Identify why P99 increased" \
  --summary "Service is available; incident unresolved" \
  --action "Scaled 4 to 8 instances; no improvement" \
  --decision "Do not restart the database without approval" \
  --next "Inspect long transactions after 16:00" \
  --verify "P99 remains below 500 ms for 30 minutes"
```

Validate and inspect:

```bash
handoffx validate .handoff/<file>.md
handoffx digest .handoff/<file>.md
handoffx show <handoff-id>
handoffx list
handoffx deps <handoff-id>
```

Respond or revise:

```bash
handoffx respond handoff.md \
  --as agent-b \
  --disposition needs-info \
  --question "Which role grants access to production metrics?"

handoffx accept handoff.md --as agent-b --note "Ready to continue"
handoffx revise handoff-r1.md --body updated-body.md
```

The CLI writes immutable response artifacts and complete revisions. Read the normative [handoffX 0.1 specification](SPEC.md) for metadata, state, revision, and conformance rules.

## Protocol documents

Version 0.1 defines two UTF-8 Markdown document kinds:

- `handoff`: the current canonical context;
- `handoff-response`: one receiver's `accepted`, `needs-info`, or `rejected` disposition toward one exact revision.

Clarification answers belong in the next canonical handoff. The final artifact never requires replaying the negotiation transcript.

## Scope

Version 0.1 deliberately does not provide:

- network transport or agent discovery;
- cloud-document or chat-platform integration;
- task orchestration;
- identity authentication or digital signatures;
- automatic memory, Git, log, or environment collection.

A2A, MCP, chat systems, shared whiteboards, and application-specific adapters can carry handoffX without changing the protocol.

## Open source

handoffX is licensed under Apache-2.0. Protocol evolution and implementation contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

The real test is simple: give your most important work to an agent with zero chat history. If it can continue, the handoff worked. If it asks a blocking question, merge the answer into a new revision.

The best handoff is not the longest one. It is the one that lets the next agent move.
