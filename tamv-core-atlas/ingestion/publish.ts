// Capa 4 — Publish. Validates every meta.json, writes per-repo summary.md
// and the global atlas/index.json. With --validate, exits non-zero on issues.
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./config.js";
import { RepoMetaSchema, type RepoMeta } from "./schemas.js";
import { audit, writeJsonAtomic, writeTextAtomic } from "./safe-fs.js";

function renderSummary(meta: RepoMeta): string {
  const tags = meta.tags.length ? meta.tags.map((t) => `\`${t}\``).join(" ") : "_none_";
  return [
    `# ${meta.name}`,
    "",
    `- URL: ${meta.url}`,
    `- Slug: \`${meta.slug}\``,
    `- Category: **${meta.category}** (confidence ${meta.classification?.confidence?.toFixed(2) ?? "n/a"})`,
    `- Default branch: \`${meta.defaultBranch ?? "n/a"}\``,
    `- Updated: ${meta.updatedAt ?? "n/a"}`,
    "",
    "## Purpose",
    "",
    meta.purpose || "_TBD_",
    "",
    "## Tags",
    "",
    tags,
    "",
    "## Stack",
    "",
    `- Languages: ${meta.stack.languages.join(", ") || "_n/a_"}`,
    `- Frameworks: ${meta.stack.frameworks.join(", ") || "_n/a_"}`,
    `- Tools: ${meta.stack.tools.join(", ") || "_n/a_"}`,
    "",
    "## Commands",
    "",
    Object.keys(meta.commands).length
      ? Object.entries(meta.commands).map(([k, v]) => `- **${k}**: \`${v}\``).join("\n")
      : "_none detected_",
    "",
    "## Relations",
    "",
    meta.relations.length
      ? meta.relations.map((r) => `- ${r.type} → \`${r.target}\` (w=${r.weight})`).join("\n")
      : "_no declared relations_",
    "",
  ].join("\n");
}

async function main() {
  const validateOnly = process.argv.includes("--validate");
  const dirs = await fs.readdir(PATHS.reposDir, { withFileTypes: true });
  const repos: RepoMeta[] = [];
  const errors: Array<{ slug: string; error: string }> = [];

  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaPath = path.join(PATHS.reposDir, d.name, "meta.json");
    try {
      const meta = RepoMetaSchema.parse(JSON.parse(await fs.readFile(metaPath, "utf8")));
      repos.push(meta);
      if (!validateOnly) {
        await writeTextAtomic(path.join(PATHS.reposDir, d.name, "summary.md"), renderSummary(meta));
      }
    } catch (err) {
      errors.push({ slug: d.name, error: String(err) });
      await audit("publish.invalid", { slug: d.name, error: String(err) });
    }
  }

  const stats = { byCategory: {} as Record<string, number>, byTag: {} as Record<string, number> };
  for (const r of repos) {
    stats.byCategory[r.category] = (stats.byCategory[r.category] ?? 0) + 1;
    for (const t of r.tags) stats.byTag[t] = (stats.byTag[t] ?? 0) + 1;
  }

  if (!validateOnly) {
    await writeJsonAtomic(PATHS.indexJson, {
      generatedAt: new Date().toISOString(),
      total: repos.length,
      repos,
      stats,
    });
  }

  await audit("publish.complete", { total: repos.length, errors: errors.length, validateOnly });

  // eslint-disable-next-line no-console
  console.log(
    `${validateOnly ? "validated" : "published"} ${repos.length} repos${errors.length ? ` with ${errors.length} errors` : ""}`,
  );
  if (errors.length) process.exit(2);
}

main().catch(async (err) => {
  await audit("publish.fatal", { error: String(err) });
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});