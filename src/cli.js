#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { artifactFilename, renderHandoff, renderResponse, slugify } from "./artifact.js";
import { dependencyTree, findHandoff, formatTree, loadCatalog } from "./catalog.js";
import { writeFileAtomic } from "./io.js";
import { digest, parseDocument, serializeDocument, validateDocument } from "./protocol.js";

const HELP = `handoffx 0.1 - portable context handoff protocol reference CLI

Usage:
  handoffx create --title TEXT [options]
  handoffx validate FILE [--json]
  handoffx digest FILE
  handoffx respond FILE --as ID --disposition accepted|needs-info|rejected [options]
  handoffx accept FILE --as ID [--note TEXT] [--output PATH]
  handoffx revise FILE --body FILE [--output PATH]
  handoffx list [--project PATH] [--json]
  handoffx show ID|FILE [--project PATH]
  handoffx deps ID|FILE [--project PATH] [--json]

Create options:
  --title TEXT             Subject
  --goal TEXT              Objective or problem
  --summary TEXT           Current state
  --source TEXT            Fact or evidence pointer (repeatable)
  --action TEXT            Attempted action and outcome (repeatable)
  --decision TEXT          Decision and rationale (repeatable)
  --constraint TEXT        Constraint (repeatable)
  --risk TEXT              Risk (repeatable)
  --next TEXT              Next action (repeatable)
  --verify TEXT            Verification or exit criterion (repeatable)
  --question TEXT          Open question or assumption (repeatable)
  --depends-on ID          Related handoff ID (repeatable)
  --producer ID            Producer identifier
  --audience ID            Intended receiver (repeatable)
  --status VALUE           draft or offered (default: offered)
  --project PATH           Project root (default: current directory)
  --output PATH            Explicit output path

Response options:
  --as ID                  Responder identifier
  --disposition VALUE      accepted, needs-info, or rejected
  --question TEXT          Concrete blocking question (repeatable)
  --note TEXT              Response note
  --output PATH            Explicit response path
`;

function parse(argv) {
  const [command, ...tokens] = argv;
  const values = { decisions: [], constraints: [], sources: [], actions: [], next: [], verification: [], risks: [], questions: [], dependsOn: [], audience: [] };
  const repeatable = { "--decision": "decisions", "--constraint": "constraints", "--source": "sources", "--action": "actions", "--next": "next", "--verify": "verification", "--risk": "risks", "--question": "questions", "--depends-on": "dependsOn", "--audience": "audience" };
  const scalar = { "--title": "title", "--goal": "goal", "--summary": "summary", "--project": "project", "--output": "output", "--producer": "producer", "--status": "status", "--as": "responder", "--disposition": "disposition", "--note": "note", "--body": "bodyFile" };
  const positional = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "--json") values.json = true;
    else if (repeatable[token]) values[repeatable[token]].push(requiredValue(tokens, ++i, token));
    else if (scalar[token]) values[scalar[token]] = requiredValue(tokens, ++i, token);
    else if (token.startsWith("-")) throw new Error(`Unknown option: ${token}`);
    else positional.push(token);
  }
  return { command, values, positional };
}

function requiredValue(tokens, index, option) {
  if (!tokens[index] || tokens[index].startsWith("--")) throw new Error(`${option} requires a value`);
  return tokens[index];
}

async function main() {
  const { command, values, positional } = parse(process.argv.slice(2));
  if (!command || command === "--help" || command === "help") return console.log(HELP);
  if (command === "--version" || command === "version") return console.log("0.1.0");

  if (command === "create") return await create(values);
  if (command === "validate") return await validate(positional[0], values.json);
  if (command === "digest") return console.log(digest(await readRequired(positional[0], "digest requires FILE")));
  if (command === "respond" || command === "accept") return await respond(positional[0], { ...values, disposition: command === "accept" ? "accepted" : values.disposition });
  if (command === "revise") return await revise(positional[0], values);
  if (command === "list") return await listCatalog(values);
  if (command === "show") return await show(positional[0], values);
  if (command === "deps") return await deps(positional[0], values);
  throw new Error(`Unknown command: ${command}`);
}

async function create(values) {
  if (!values.title) throw new Error("create requires --title");
  if (values.status && !["draft", "offered"].includes(values.status)) throw new Error("create --status must be draft or offered");
  const project = resolve(values.project ?? process.cwd());
  const rendered = renderHandoff({ ...values, subject: values.title });
  const content = serializeDocument(rendered.metadata, rendered.body);
  const output = resolve(values.output ?? `${project}/.handoff/${artifactFilename(rendered.metadata.handoff_id, 1)}`);
  await writeFileAtomic(output, content);
  console.log(output);
}

async function validate(file, json) {
  const content = await readRequired(file, "validate requires FILE");
  const result = validateDocument(content, file);
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const warning of result.warnings) console.log(`warning: ${warning}`);
    for (const error of result.errors) console.error(`error: ${error}`);
    if (result.valid) console.log(`valid ${result.metadata.kind} ${result.sha256}`);
  }
  if (!result.valid) process.exitCode = 1;
}

async function respond(file, values) {
  if (!file) throw new Error("respond requires FILE");
  if (!values.responder) throw new Error("respond requires --as ID");
  if (!["accepted", "needs-info", "rejected"].includes(values.disposition)) throw new Error("respond requires --disposition accepted|needs-info|rejected");
  if (values.disposition === "needs-info" && !values.questions.length) throw new Error("needs-info response requires at least one --question");
  const source = await readFile(resolve(file), "utf8");
  const checked = validateDocument(source, file);
  if (!checked.valid || checked.metadata.kind !== "handoff") throw new Error(`Cannot respond to invalid handoff: ${checked.errors.join("; ")}`);
  const rendered = renderResponse({ handoff: checked.metadata, baseSha256: checked.sha256, responder: values.responder, disposition: values.disposition, questions: values.questions, note: values.note });
  const content = serializeDocument(rendered.metadata, rendered.body);
  const timestamp = rendered.metadata.created_at.replace(/[-:.]/g, "");
  const output = resolve(values.output ?? `${dirname(resolve(file))}/responses/${checked.metadata.handoff_id}/${timestamp}-${slugify(values.responder)}-${values.disposition}.md`);
  await writeFileAtomic(output, content);
  console.log(output);
}

async function revise(file, values) {
  if (!file) throw new Error("revise requires FILE");
  if (!values.bodyFile) throw new Error("revise requires --body FILE");
  const source = await readFile(resolve(file), "utf8");
  const checked = validateDocument(source, file);
  if (!checked.valid || checked.metadata.kind !== "handoff") throw new Error(`Cannot revise invalid handoff: ${checked.errors.join("; ")}`);
  const body = await readFile(resolve(values.bodyFile), "utf8");
  const metadata = { ...checked.metadata, revision: checked.metadata.revision + 1, updated_at: new Date().toISOString(), status: "offered", previous_sha256: checked.sha256 };
  const content = serializeDocument(metadata, body);
  const output = resolve(values.output ?? `${dirname(resolve(file))}/${artifactFilename(metadata.handoff_id, metadata.revision)}`);
  await writeFileAtomic(output, content);
  console.log(output);
}

async function listCatalog(values) {
  const catalog = await loadCatalog(resolve(values.project ?? process.cwd()));
  if (values.json) console.log(JSON.stringify(catalog, null, 2));
  else if (!catalog.length) console.log("No handoffs found.");
  else {
    console.log("ID\tREV\tSTATUS\tDEPENDENCIES\tSUBJECT");
    for (const item of catalog) console.log(`${item.id}\t${item.revision}\t${item.status}\t${item.dependsOn.length}\t${item.title}`);
  }
}

async function show(target, values) {
  if (!target) throw new Error("show requires ID or FILE");
  const file = await resolveTarget(target, values.project);
  process.stdout.write(await readFile(file, "utf8"));
}

async function deps(target, values) {
  if (!target) throw new Error("deps requires ID or FILE");
  const catalog = await loadCatalog(resolve(values.project ?? process.cwd()));
  const tree = dependencyTree(catalog, target);
  console.log(values.json ? JSON.stringify(tree, null, 2) : formatTree(tree));
}

async function resolveTarget(target, project) {
  const direct = resolve(target);
  try { await access(direct); return direct; } catch {}
  const item = findHandoff(await loadCatalog(resolve(project ?? process.cwd())), target);
  if (!item) throw new Error(`Handoff not found: ${target}`);
  return item.file;
}

async function readRequired(file, message) {
  if (!file) throw new Error(message);
  return await readFile(resolve(file), "utf8");
}

main().catch((error) => { console.error(`handoffx: ${error.message}`); process.exitCode = 1; });
