# handoffX 0.1 quick protocol reference

The repository `SPEC.md` is normative. This reference contains the fields required while applying the skill.

## Handoff metadata

```yaml
---
handoffx: "0.1"
kind: "handoff"
handoff_id: "hx_<opaque-id>"
revision: 1
subject: "Human-readable topic"
created_at: "<RFC-3339>"
updated_at: "<RFC-3339>"
status: "offered"
producer: "<optional portable identifier>"
audience: ["<optional receiver>"]
depends_on: []
previous_sha256: "sha256:<64 lowercase hex; revisions after r1>"
---
```

Required body semantics:

- objective or problem;
- current state;
- known facts and evidence;
- actions tried and outcomes;
- decisions and rationale;
- constraints and risks;
- next actions;
- verification or exit criteria;
- open questions and assumptions.

Valid handoff status values are `draft`, `offered`, and `closed`.

## Response metadata

```yaml
---
handoffx: "0.1"
kind: "handoff-response"
handoff_id: "hx_<same-id>"
base_revision: 1
base_sha256: "sha256:<digest of exact offered file bytes>"
responder: "<receiver identifier>"
disposition: "needs-info"
created_at: "<RFC-3339>"
---
```

Valid dispositions are `accepted`, `needs-info`, and `rejected`. A `needs-info` response contains at least one concrete blocking question.

## Revision invariants

- Keep `handoff_id` and `created_at` unchanged.
- Increment `revision` by exactly one.
- Set `updated_at` to the revision time.
- Set `previous_sha256` to the complete previous file's SHA-256.
- Produce a complete body that does not require the prior conversation.
- Never transfer an acceptance from one receiver or revision to another.

## Compatibility

Frontmatter values occupy one line; strings and arrays use JSON syntax. Preserve unknown fields. The Markdown body remains understandable when all metadata and tooling are ignored.
