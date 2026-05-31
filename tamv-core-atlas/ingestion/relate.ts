// Capa 3 — Build the relationship graph between repos. Threshold-based to
// avoid noise. Edges are weighted by shared tags and frameworks.
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./config.js";
import { RepoMetaSchema, type RepoMeta } from "./schemas.js";
import { audit, writeJsonAtomic } from "./safe-fs.js";

const EDGE_THRESHOLD = 2;

async function main() {
  const dirs = await fs.readdir(PATHS.reposDir, { withFileTypes: true });
  const metas: RepoMeta[] = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaPath = path.join(PATHS.reposDir, d.name, "meta.json");
    try {
      metas.push(RepoMetaSchema.parse(JSON.parse(await fs.readFile(metaPath, "utf8"))));
    } catch (err) {
      await audit("relate.skip", { slug: d.name, error: String(err) });
    }
  }

  const nodes = metas.map((m) => ({
    id: m.slug,
    label: m.name,
    category: m.category,
    confidence: m.classification?.confidence ?? 0,
  }));

  type Edge = { from: string; to: string; type: string; weight: number; reasons: string[] };
  const edges: Edge[] = [];

  for (let i = 0; i < metas.length; i++) {
    for (let j = i + 1; j < metas.length; j++) {
      const a = metas[i]!;
      const b = metas[j]!;
      const sharedTags = a.tags.filter((t) => b.tags.includes(t));
      const sharedFrameworks = a.stack.frameworks.filter((f) => b.stack.frameworks.includes(f));
      const weight = sharedTags.length * 2 + sharedFrameworks.length;
      if (weight >= EDGE_THRESHOLD) {
        edges.push({
          from: a.slug,
          to: b.slug,
          type: "related",
          weight,
          reasons: [
            ...sharedTags.map((t) => `tag:${t}`),
            ...sharedFrameworks.map((f) => `framework:${f}`),
          ].slice(0, 10),
        });
      }
    }
  }

  await writeJsonAtomic(PATHS.graphJson, { nodes, edges });
  await audit("relate.complete", { nodes: nodes.length, edges: edges.length });
  // eslint-disable-next-line no-console
  console.log(`graph built: ${nodes.length} nodes, ${edges.length} edges`);
}

main().catch(async (err) => {
  await audit("relate.fatal", { error: String(err) });
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});