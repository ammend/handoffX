import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { parseDocument, validateDocument } from "../src/protocol.js";

const exec = promisify(execFile);
const cli = new URL("../src/cli.js", import.meta.url).pathname;

test("CLI creates, validates, responds, revises, and shows a handoff", async () => {
  const project = await mkdtemp(join(tmpdir(), "handoffx-"));
  const created = await exec(process.execPath, [cli, "create", "--project", project, "--title", "Incident", "--goal", "Find the cause", "--producer", "agent-a", "--audience", "agent-b"]);
  const handoffFile = created.stdout.trim();
  const handoff = await readFile(handoffFile, "utf8");
  assert.equal(validateDocument(handoff).valid, true);

  const response = await exec(process.execPath, [cli, "respond", handoffFile, "--as", "agent-b", "--disposition", "needs-info", "--question", "Which logs are authoritative?"]);
  const responseFile = response.stdout.trim();
  const responseDocument = validateDocument(await readFile(responseFile, "utf8"));
  assert.equal(responseDocument.valid, true);
  assert.equal(responseDocument.metadata.responder, "agent-b");

  const bodyFile = join(project, "body.md");
  const parsed = parseDocument(handoff);
  await writeFile(bodyFile, `${parsed.body}\n\nAdditional evidence was supplied.\n`, "utf8");
  const revised = await exec(process.execPath, [cli, "revise", handoffFile, "--body", bodyFile]);
  const revisedDocument = validateDocument(await readFile(revised.stdout.trim(), "utf8"));
  assert.equal(revisedDocument.metadata.revision, 2);
  assert.equal(revisedDocument.metadata.previous_sha256, validateDocument(handoff).sha256);

  const shown = await exec(process.execPath, [cli, "show", revised.stdout.trim()]);
  assert.match(shown.stdout, /Additional evidence was supplied/);
});
