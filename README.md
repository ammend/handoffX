# handoffX

**An open, portable context handoff protocol for AI agents.**

handoffX carries the minimum sufficient context needed to continue work across agent, session, owner, platform, or infrastructure boundaries.

```text
Producer offers Markdown
  → receiver reads it with zero required tooling
  → receiver accepts or asks concrete questions
  → producer issues a complete new revision
  → each receiver independently accepts an exact revision
```

The protocol is transport-independent. Markdown files can move through filesystems, chat attachments, email, issue trackers, HTTP, shared whiteboards, MCP resources, or A2A artifacts. None is a dependency.

## Why handoffX?

AI agents are often stateless and isolated from one another. Copying a chat transcript transfers noise but does not establish what is known, what was tried, why decisions were made, or whether the receiver has enough context to continue.

handoffX adds:

- a canonical, human-readable Markdown artifact;
- receiver-driven clarification instead of producer guesswork;
- independent responses from B, C, D, or any number of receivers;
- revisions bound to exact prior bytes with SHA-256;
- zero-install receiving: only the producer needs tooling;
- a portable fallback across otherwise incompatible agent systems.

## Protocol

Read the normative [handoffX 0.1 specification](SPEC.md).

Two document kinds are defined:

- `handoff`: the current complete context;
- `handoff-response`: one receiver's `accepted`, `needs-info`, or `rejected` disposition toward one exact revision.

The interaction semantics are:

```text
OFFER → REQUEST_INFO → REVISE → ACCEPT
```

A first offer can be accepted immediately. Clarification answers are merged into a new canonical revision; the chat transcript is never required to understand the final artifact.

## Install the reference CLI

The protocol does not require this CLI. It is a reference producer, validator, and responder.

```bash
npm install -g github:ammend/handoffX
# or clone this repository and run with Node.js 20+ / Bun 1.1+
node src/cli.js --help
```

## Install the Agent Skill

The repository includes a transport-independent `handoffx` skill for Agent environments that support the open skills directory format:

```bash
npx skills add ammend/handoffX -y -g
```

The skill can create and review handoffs with or without the CLI. It keeps installation optional for receivers and does not send artifacts unless the user separately authorizes delivery.

## Create an offer

```bash
handoffx create \
  --title "Checkout latency investigation" \
  --producer "agent-a" \
  --audience "agent-b" \
  --audience "agent-c" \
  --goal "Identify why P99 increased" \
  --summary "Service is available; incident unresolved" \
  --source "Dashboard: https://observability.example/incidents/42" \
  --action "Scaled 4 to 8 instances; no improvement" \
  --decision "Do not restart the database without approval" \
  --next "Inspect long transactions after 16:00" \
  --verify "Mitigation lowers P99 below 500 ms"
```

The CLI writes `.handoff/<handoff-id>-r1.md` and prints its path.

## Validate or inspect

```bash
handoffx validate .handoff/<file>.md
handoffx digest .handoff/<file>.md
handoffx show <handoff-id>
handoffx list
handoffx deps <handoff-id>
```

## Respond independently

Receiver B can accept:

```bash
handoffx accept handoff.md --as agent-b --note "Ready to continue"
```

Receiver C can request information:

```bash
handoffx respond handoff.md \
  --as agent-c \
  --disposition needs-info \
  --question "Which role grants access to production metrics?"
```

Each command creates an immutable response artifact tied to the handoff ID, revision, and SHA-256 digest. A receiver without handoffX can simply read the Markdown and reply in natural language.

## Create a revision

Merge clarification answers into a complete Markdown body, then issue the next revision:

```bash
handoffx revise handoff-r1.md --body updated-body.md
```

The new artifact keeps the handoff ID, increments the revision, and records the prior file digest in `previous_sha256`.

## Scope

Version 0.1 deliberately does not provide:

- network transport or agent discovery;
- cloud-document or chat-platform integration;
- task orchestration;
- identity authentication or digital signatures;
- automatic memory, Git, log, or environment collection.

A2A, MCP, chat systems, or application-specific adapters can carry handoffX documents without changing the protocol.

## Open source

handoffX is licensed under Apache-2.0. Protocol evolution and implementation contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).
