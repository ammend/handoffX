# handoffX Protocol 0.1

Status: **0.1 stable**

handoffX is a transport-independent protocol for carrying the minimum sufficient context needed to continue work across AI agent, session, owner, platform, or infrastructure boundaries.

The protocol has two portable Markdown document types:

- a **handoff artifact**, containing the current canonical context;
- a **response artifact**, recording one receiver's independent disposition toward one exact handoff revision.

Only the producer needs handoffX tooling. A receiver can read the Markdown and respond in natural language. Structured responses are a progressive enhancement.

## 1. Design principles

1. **Zero-install receiver.** The Markdown body MUST remain understandable without handoffX.
2. **Receiver-validated sufficiency.** A producer offers context; each receiver independently decides whether it is sufficient.
3. **Canonical artifact.** Answers to clarification questions are merged into a new complete handoff revision. Chat transcripts are not the canonical handoff.
4. **Portable references.** Stable URIs, revisions, and relative paths SHOULD be preferred over machine-local absolute paths.
5. **Selective disclosure.** A handoff carries the minimum context required to continue, not the producer's full memory.
6. **Transport independence.** Filesystem, email, chat, shared whiteboards, HTTP, MCP resources, and A2A artifacts can carry the documents; none are protocol dependencies.
7. **One offer, many receivers.** Acceptance is a relation between a receiver and an exact revision, never a global property inferred from another receiver.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are to be interpreted as described by RFC 2119 and RFC 8174.

## 2. Wire format

Every protocol document is UTF-8 Markdown with a YAML-compatible frontmatter block. Version 0.1 restricts every frontmatter value to one line. Strings and arrays SHOULD use JSON syntax so minimal implementations need no full YAML parser.

```markdown
---
handoffx: "0.1"
kind: "handoff"
...
---

# Human-readable content
```

Unknown frontmatter fields MUST be ignored. Unknown Markdown sections MUST be preserved when producing a revision.

## 3. Handoff artifact

### 3.1 Required metadata

| Field | Type | Meaning |
| --- | --- | --- |
| `handoffx` | string | Protocol version; `"0.1"` |
| `kind` | string | MUST be `"handoff"` |
| `handoff_id` | string | Stable across all revisions |
| `revision` | integer | Starts at `1`, increases by exactly one |
| `subject` | string | Human topic without machine identifiers |
| `created_at` | RFC 3339 string | Creation time of revision 1 |
| `updated_at` | RFC 3339 string | Creation time of this revision |
| `status` | string | `draft`, `offered`, or `closed` |
| `depends_on` | string array | Handoff IDs useful as prerequisite context |

### 3.2 Optional metadata

| Field | Type | Meaning |
| --- | --- | --- |
| `producer` | string | Portable producer identifier |
| `audience` | string array | Intended receivers; informational, not authorization |
| `previous_sha256` | string | SHA-256 of the complete previous revision bytes |

`audience` MUST NOT be treated as an access-control list. Different confidentiality groups require different artifacts.

### 3.3 Required body semantics

The body MUST communicate, in human-readable form:

1. objective or problem;
2. current state;
3. known facts and evidence pointers;
4. actions already attempted and their outcomes;
5. decisions and rationale;
6. constraints and risks;
7. next actions;
8. verification or exit criteria;
9. unresolved questions or assumptions.

Headings MAY vary and empty sections MAY be explicit. The receiver MUST be able to distinguish observed facts, inferences, and decisions where confusing them could affect the outcome.

## 4. Response artifact

A response is immutable and belongs to exactly one responder and one handoff revision.

### 4.1 Required metadata

| Field | Type | Meaning |
| --- | --- | --- |
| `handoffx` | string | Protocol version; `"0.1"` |
| `kind` | string | MUST be `"handoff-response"` |
| `handoff_id` | string | ID of the reviewed handoff |
| `base_revision` | integer | Reviewed revision |
| `base_sha256` | string | SHA-256 of the exact reviewed file bytes |
| `responder` | string | Receiver identifier |
| `disposition` | string | `accepted`, `needs-info`, or `rejected` |
| `created_at` | RFC 3339 string | Response creation time |

The Markdown body contains questions, reasons, assumptions, or acceptance notes. A `needs-info` response MUST contain at least one concrete question. An `accepted` response means the responder believes it can continue without relying on the producer being available.

## 5. Interaction semantics

The protocol defines four logical actions, independent of transport:

```text
OFFER       producer sends a handoff revision
REQUEST_INFO receiver returns disposition=needs-info
REVISE      producer creates the next complete revision
ACCEPT      receiver returns disposition=accepted
```

`REJECT` is represented by `disposition=rejected`.

A first revision MAY be accepted immediately. Questions SHOULD be limited to information that blocks the next useful action or prevents a high-cost mistake.

## 6. Revision rules

1. A revision MUST retain `handoff_id` and `created_at`.
2. `revision` MUST increase by exactly one.
3. `previous_sha256` MUST identify the exact prior file bytes.
4. The new body MUST be complete on its own; it MUST NOT require reading the clarification transcript.
5. A prior response remains a historical fact about its base revision.
6. A response to revision N MUST NOT be silently applied to revision N+1.
7. If a new revision materially affects a receiver, it MUST be offered to that receiver again.

## 7. Multiple receivers

One handoff revision MAY be offered to any number of receivers. Each returns an independent response.

```text
B accepted r2
C needs-info on r2
D accepted r1
```

All three statements can be true simultaneously. Implementations MUST NOT derive global acceptance from one receiver.

The producer MAY aggregate and deduplicate receiver questions into a new common revision. If receivers require materially different or differently classified context, the producer SHOULD create separate handoffs that depend on a shared base handoff.

## 8. Integrity and identity

Version 0.1 uses SHA-256 to bind responses and revisions to exact file bytes. This detects mismatch; it does not authenticate the author. Digital signatures, decentralized identity, and trust policy are outside version 0.1.

Identifiers are opaque strings. Platform-specific IDs MAY be used by an adapter, but a reader MUST NOT need access to that platform merely to understand the body.

## 9. Relationship to other protocols

handoffX specifies a payload and context-negotiation semantics. It does not specify discovery, network transport, authentication, tool execution, or task orchestration.

- A2A can transport handoffX artifacts and responses between opaque agent applications.
- MCP can expose handoffX documents as resources or tools.
- Chat systems, email, issue trackers, shared whiteboards, and filesystems can carry the same Markdown.

## 10. Conformance

A **0.1 reader**:

- parses the required frontmatter fields;
- ignores unknown fields;
- exposes the Markdown body without requiring proprietary services.

A **0.1 producer**:

- emits a valid handoff artifact;
- preserves stable identity and revision rules;
- produces a self-contained body.

A **0.1 responder**:

- binds its response to `handoff_id`, `base_revision`, and `base_sha256`;
- uses one valid disposition;
- provides concrete questions when requesting information.

The JSON Schemas in [`schema/`](schema/) describe the frontmatter metadata objects. The Markdown body requirements remain semantic and require human or Agent review.
