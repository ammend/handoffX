import { readFile, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseDocument } from "./protocol.js";

export async function loadCatalog(project = process.cwd()) {
  const directory = resolve(project, ".handoff");
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => resolve(directory, entry.name)).sort();
  const catalog = await Promise.all(files.map(async (file) => {
    const metadata = parseDocument(await readFile(file, "utf8"), file).metadata;
    return {
      id: metadata.handoff_id ?? basename(file, ".md"),
      kind: metadata.kind,
      revision: metadata.revision,
      title: metadata.subject ?? basename(file, ".md"),
      status: metadata.status ?? "unknown",
      createdAt: metadata.created_at ?? "unknown",
      dependsOn: Array.isArray(metadata.depends_on) ? metadata.depends_on : [],
      file,
    };
  }));
  const latest = new Map();
  for (const item of catalog.filter((entry) => entry.kind === "handoff")) {
    const current = latest.get(item.id);
    if (!current || item.revision > current.revision) latest.set(item.id, item);
  }
  return [...latest.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function findHandoff(catalog, target) {
  return catalog.find((item) => item.id === target || item.file === resolve(target) || basename(item.file) === target);
}

export function dependencyTree(catalog, target) {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const root = findHandoff(catalog, target);
  if (!root) throw new Error(`Handoff not found: ${target}`);
  const visit = (item, ancestors = new Set()) => ({
    id: item.id,
    title: item.title,
    file: item.file,
    dependencies: item.dependsOn.map((id) => {
      if (ancestors.has(id) || id === item.id) return { id, cycle: true };
      const dependency = byId.get(id);
      if (!dependency) return { id, missing: true };
      return visit(dependency, new Set([...ancestors, item.id]));
    }),
  });
  return visit(root);
}

export function formatTree(node, prefix = "", last = true, root = true) {
  const marker = root ? "" : `${prefix}${last ? "└─ " : "├─ "}`;
  const suffix = node.missing ? " [missing]" : node.cycle ? " [cycle]" : "";
  const lines = [`${marker}${node.id}${node.title && node.title !== node.id ? ` — ${node.title}` : ""}${suffix}`];
  const childPrefix = root ? "" : `${prefix}${last ? "   " : "│  "}`;
  for (let index = 0; index < (node.dependencies ?? []).length; index++) {
    lines.push(formatTree(node.dependencies[index], childPrefix, index === node.dependencies.length - 1, false));
  }
  return lines.join("\n");
}
