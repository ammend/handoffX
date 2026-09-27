---
name: handoffx
description: Create, review, revise, validate, or accept portable Markdown context handoffs across AI agents, sessions, owners, platforms, or infrastructure. Use when work must continue without shared context. Do not use for ordinary summaries that have no receiving agent or continuation need.
---

# handoffX

Use the handoffX 0.1 protocol to transfer the minimum sufficient context for a zero-context receiver to continue work.

## Choose the role

- **Producer:** create or revise the canonical handoff.
- **Receiver:** inspect an offered handoff and either accept it, request concrete missing information, or reject it with a reason.
- **Relay:** transport an artifact unchanged. Do not reinterpret or silently revise it.

## Producer workflow

1. Select only information that affects continuation. Do not export the full conversation or private memory.
2. Separate facts and evidence from inferences and decisions.
3. Record attempted actions with outcomes so receivers do not repeat failed work.
4. Give concrete next actions, constraints, risks, and exit criteria.
5. Prefer portable references: stable URI + revision + relative path. Mark machine-local references explicitly.
6. If `handoffx` is installed, use `handoffx create`; otherwise author a conforming Markdown artifact using [the protocol reference](references/protocol.md).
7. Before sending externally, review for credentials, private data, irrelevant context, and audience mismatch.

When revising after questions, merge answers into a new complete canonical body. Do not make the receiver reconstruct context from the clarification transcript. Preserve the handoff ID, increment the revision by one, and bind the prior bytes with `previous_sha256`.

## Receiver workflow

1. Read as if the producer is unavailable.
2. Verify high-impact claims against the cited primary sources when accessible.
3. Ask only questions that block the next useful action or prevent a high-cost mistake. Do not demand exhaustive context.
4. If sufficient, explicitly accept the exact handoff ID and revision. If tooling is available, bind the response to the file SHA-256.
5. If the receiver lacks handoffX, reply in natural language; installation is never required.

For multiple receivers, evaluate independently. One receiver's acceptance does not imply acceptance by others. Return a separate response for each receiver and revision.

## Tooling

Prefer these commands when the CLI is present:

```bash
handoffx create --title "..." --goal "..." --next "..."
handoffx validate handoff.md
handoffx respond handoff.md --as RECEIVER --disposition needs-info --question "..."
handoffx accept handoff.md --as RECEIVER
handoffx revise handoff.md --body updated-body.md
```

Do not install tools, send messages, upload files, or modify external state unless the user requested that action. Artifact creation alone does not authorize delivery.

Read [references/protocol.md](references/protocol.md) when manually authoring metadata, producing a structured response, handling revisions, or checking conformance. Ordinary semantic review does not require loading the full reference.
