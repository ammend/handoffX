import { createHash } from "node:crypto";

export function parseDocument(content, file = "") {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`Missing or malformed frontmatter${file ? `: ${file}` : ""}`);
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    metadata[key] = parseValue(raw);
  }
  return { metadata, body: match[2] };
}

export function serializeDocument(metadata, body) {
  const lines = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\s+/, "").replace(/\s*$/, "")}\n`;
}

export function digest(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function validateDocument(content, file = "") {
  const errors = [], warnings = [];
  let parsed;
  try { parsed = parseDocument(content, file); } catch (error) { return { valid: false, errors: [error.message], warnings }; }
  const { metadata, body } = parsed;
  if (metadata.handoffx !== "0.1") errors.push('handoffx must be "0.1"');
  if (metadata.kind === "handoff") validateHandoff(metadata, body, errors, warnings);
  else if (metadata.kind === "handoff-response") validateResponse(metadata, body, errors);
  else errors.push('kind must be "handoff" or "handoff-response"');
  return { valid: errors.length === 0, errors, warnings, metadata, body, sha256: digest(content) };
}

function validateHandoff(value, body, errors, warnings) {
  requireString(value, "handoff_id", errors); requireInteger(value, "revision", errors, 1);
  requireString(value, "subject", errors); requireDate(value, "created_at", errors); requireDate(value, "updated_at", errors);
  if (!["draft", "offered", "closed"].includes(value.status)) errors.push("status must be draft, offered, or closed");
  requireStringArray(value, "depends_on", errors);
  if (value.audience !== undefined) requireStringArray(value, "audience", errors);
  if (value.previous_sha256 !== undefined && !isDigest(value.previous_sha256)) errors.push("previous_sha256 must be sha256:<64 lowercase hex>");
  const headings = ["Objective or problem", "Current state", "Known facts and evidence", "Actions tried and outcomes", "Decisions and rationale", "Constraints and risks", "Next actions", "Verification or exit criteria", "Open questions and assumptions"];
  for (const heading of headings) if (!body.includes(`## ${heading}`)) warnings.push(`missing recommended section: ${heading}`);
}

function validateResponse(value, body, errors) {
  requireString(value, "handoff_id", errors); requireInteger(value, "base_revision", errors, 1);
  if (!isDigest(value.base_sha256)) errors.push("base_sha256 must be sha256:<64 lowercase hex>");
  requireString(value, "responder", errors);
  if (!["accepted", "needs-info", "rejected"].includes(value.disposition)) errors.push("disposition must be accepted, needs-info, or rejected");
  requireDate(value, "created_at", errors);
  if (value.disposition === "needs-info" && !/## Questions[\s\S]*\n- (?!No questions\.)\S/.test(body)) errors.push("needs-info response must contain a concrete question");
}

function requireString(value, key, errors) { if (typeof value[key] !== "string" || !value[key].trim()) errors.push(`${key} must be a non-empty string`); }
function requireInteger(value, key, errors, minimum) { if (!Number.isInteger(value[key]) || value[key] < minimum) errors.push(`${key} must be an integer >= ${minimum}`); }
function requireDate(value, key, errors) { if (typeof value[key] !== "string" || Number.isNaN(Date.parse(value[key]))) errors.push(`${key} must be an RFC 3339 date-time`); }
function requireStringArray(value, key, errors) { if (!Array.isArray(value[key]) || value[key].some((item) => typeof item !== "string") || new Set(value[key]).size !== value[key].length) errors.push(`${key} must be an array of unique strings`); }
function isDigest(value) { return typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value); }
function parseValue(raw) { if (!raw) return ""; try { return JSON.parse(raw); } catch { return raw; } }
