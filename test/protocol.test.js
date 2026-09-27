import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createHandoffId, renderHandoff, renderResponse, slugify } from "../src/artifact.js";
import { dependencyTree, formatTree } from "../src/catalog.js";
import { digest, parseDocument, serializeDocument, validateDocument } from "../src/protocol.js";

describe("handoff artifact", () => {
  const now = new Date("2026-01-02T03:04:05.678Z");
  const rendered = renderHandoff({
    subject: "API migration", now, handoffId: "hx_test", producer: "agent-a",
    audience: ["agent-b", "agent-c"], goal: "Move callers to v2.",
    decisions: ["Use v2 because v1 is deprecated."], dependsOn: ["api-design"],
  });
  const content = serializeDocument(rendered.metadata, rendered.body);

  test("is valid, portable, and receiver-readable", () => {
    const result = validateDocument(content);
    assert.equal(result.valid, true);
    assert.equal(result.metadata.handoff_id, "hx_test");
    assert.deepEqual(result.metadata.audience, ["agent-b", "agent-c"]);
    assert.match(result.body, /Receiver instructions/);
    assert.match(result.body, /Use v2 because v1 is deprecated/);
  });

  test("creates collision-resistant IDs and safe slugs", () => {
    assert.equal(slugify("  Hello, Handoff! "), "hello-handoff");
    assert.equal(createHandoffId("Hello", now, "deadbeef"), "hx_20260102T030405678Z_hello_deadbeef");
  });

  test("digest binds exact bytes", () => {
    assert.match(digest(content), /^sha256:[a-f0-9]{64}$/);
    assert.notEqual(digest(content), digest(`${content}\n`));
  });
});

describe("response artifact", () => {
  const handoff = { handoff_id: "hx_test", revision: 2 };

  test("accepted response binds a responder and exact base", () => {
    const rendered = renderResponse({ handoff, baseSha256: `sha256:${"a".repeat(64)}`, responder: "agent-b", disposition: "accepted", now: new Date("2026-01-02T04:00:00Z") });
    const result = validateDocument(serializeDocument(rendered.metadata, rendered.body));
    assert.equal(result.valid, true);
    assert.equal(result.metadata.base_revision, 2);
  });

  test("needs-info requires a concrete question", () => {
    const rendered = renderResponse({ handoff, baseSha256: `sha256:${"a".repeat(64)}`, responder: "agent-c", disposition: "needs-info", questions: [], now: new Date("2026-01-02T04:00:00Z") });
    const result = validateDocument(serializeDocument(rendered.metadata, rendered.body));
    assert.equal(result.valid, false);
    assert.match(result.errors.join(" "), /concrete question/);
  });
});

test("unknown frontmatter fields survive parse and serialize", () => {
  const original = { handoffx: "0.1", kind: "handoff", extension_field: { owner: "x" } };
  const parsed = parseDocument(serializeDocument(original, "# Body"));
  assert.deepEqual(parsed.metadata.extension_field, { owner: "x" });
});

test("dependency tree reports missing dependencies and cycles", () => {
  const catalog = [
    { id: "a", title: "A", file: "/tmp/a.md", dependsOn: ["b", "missing"] },
    { id: "b", title: "B", file: "/tmp/b.md", dependsOn: ["a"] },
  ];
  const output = formatTree(dependencyTree(catalog, "a"));
  assert.match(output, /a — A/);
  assert.match(output, /a \[cycle\]/);
  assert.match(output, /missing \[missing\]/);
});
