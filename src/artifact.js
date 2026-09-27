import { randomUUID } from "node:crypto";

const list = (items, empty) => items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`;

export function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\p{Script=Han}]+/gu, "-").replace(/^-|-$/g, "") || "handoff";
}

export function datedTitle(subject, now = new Date()) {
  return `${now.toISOString().replace(/\.\d{3}Z$/, "Z")} · ${subject}`;
}

export function createHandoffId(subject, now = new Date(), suffix = randomUUID().slice(0, 8)) {
  return `hx_${now.toISOString().replace(/[-:.]/g, "")}_${slugify(subject)}_${suffix}`;
}

export function artifactFilename(id, revision = 1) {
  return `${id}-r${revision}.md`;
}

export function renderHandoff(input) {
  const now = input.now ?? new Date();
  const handoffId = input.handoffId ?? createHandoffId(input.subject, now);
  const metadata = {
    handoffx: "0.1", kind: "handoff", handoff_id: handoffId,
    revision: input.revision ?? 1, subject: input.subject,
    created_at: input.createdAt ?? now.toISOString(), updated_at: input.updatedAt ?? now.toISOString(),
    status: input.status ?? "offered",
    ...(input.producer ? { producer: input.producer } : {}),
    ...(input.audience?.length ? { audience: [...new Set(input.audience)] } : {}),
    depends_on: [...new Set(input.dependsOn ?? [])],
    ...(input.previousSha256 ? { previous_sha256: input.previousSha256 } : {}),
  };
  const body = `# ${datedTitle(input.subject, now)}

## Receiver instructions

Read this artifact as a zero-context receiver. Verify material claims against their evidence. If information blocks the next useful action, return concrete questions. If it is sufficient, explicitly accept handoff \`${handoffId}\` revision ${metadata.revision}.

## Objective or problem

${input.goal || "Not specified."}

## Current state

${input.summary || "No current-state summary recorded."}

## Known facts and evidence

${list(input.sources ?? [], "No evidence pointers recorded.")}

## Actions tried and outcomes

${list(input.actions ?? [], "No attempted actions recorded.")}

## Decisions and rationale

${list(input.decisions ?? [], "No decisions recorded.")}

## Constraints and risks

${list([...(input.constraints ?? []), ...(input.risks ?? [])], "No constraints or risks recorded.")}

## Next actions

${list(input.next ?? [], "No next action recorded.")}

## Verification or exit criteria

${list(input.verification ?? [], "No verification or exit criteria recorded.")}

## Open questions and assumptions

${list(input.questions ?? [], "No open questions recorded.")}

## Related handoffs

${list(input.dependsOn ?? [], "No related handoffs.")}
`;
  return { metadata, body };
}

export function renderResponse({ handoff, baseSha256, responder, disposition, questions = [], note = "", now = new Date() }) {
  const metadata = {
    handoffx: "0.1", kind: "handoff-response", handoff_id: handoff.handoff_id,
    base_revision: handoff.revision, base_sha256: baseSha256, responder, disposition,
    created_at: now.toISOString(),
  };
  const body = `# Response: ${disposition}

## Questions

${list(questions, "No questions.")}

## Note

${note || (disposition === "accepted" ? "The responder can continue without relying on the producer being available." : "No additional note.")}
`;
  return { metadata, body };
}
