// Capa 2.C — Rule-based classifier. Cheap, deterministic, with confidence.
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./config.js";
import { RepoMetaSchema } from "./schemas.js";
import { audit, writeJsonAtomic } from "./safe-fs.js";

type Rule = { category: string; re: RegExp; weight: number };

const RULES: Rule[] = [
  { category: "frontend", re: /\b(react|next|vite|vue|svelte|astro|tailwind)\b/i, weight: 2 },
  { category: "backend", re: /\b(express|fastify|nestjs|hapi|postgres|prisma|drizzle)\b/i, weight: 2 },
  { category: "ai", re: /\b(llm|openai|anthropic|embedding|qdrant|pinecone|rag)\b/i, weight: 3 },
  { category: "cli", re: /\b(commander|oclif|yargs|bin)\b/i, weight: 2 },
  { category: "infra", re: /\b(docker|kubernetes|terraform|ansible|helm|nginx)\b/i, weight: 2 },
  { category: "library", re: /\b(library|sdk|module|package)\b/i, weight: 1 },
  { category: "docs", re: /\b(docs|wiki|mdx|documentation|handbook)\b/i, weight: 2 },
  { category: "automation", re: /\b(github actions|workflow|cron|bot|webhook)\b/i, weight: 2 },
];

function classify(text: string): { category: string; confidence: number; reasons: string[] } {
  const scores = new Map<string, number>();
  const reasons: string[] = [];
  for (const rule of RULES) {
    const match = text.match(rule.re);
    if (match) {
      scores.set(rule.category, (scores.get(rule.category) ?? 0) + rule.weight);
      reasons.push(`matched /${rule.re.source}/ → ${rule.category}`);
    }
  }
  if (scores.size === 0) return { category: "experiment", confidence: 0.3, reasons: ["no rule matched"] };
  const [best] = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const total = [...scores.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.min(0.95, 0.4 + (best![1] / total) * 0.55);
  return { category: best![0], confidence, reasons: reasons.slice(0, 10) };
}

async function main() {
  const dirs = await fs.readdir(PATHS.reposDir, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaPath = path.join(PATHS.reposDir, d.name, "meta.json");
    try {
      const meta = RepoMetaSchema.parse(JSON.parse(await fs.readFile(metaPath, "utf8")));
      const haystack = [
        meta.name,
        meta.purpose,
        ...meta.tags,
        ...meta.stack.frameworks,
        ...meta.stack.tools,
      ]
        .join(" ")
        .toLowerCase();
      const result = classify(haystack);
      meta.category = result.category;
      meta.classification = result;
      meta.updatedAt = new Date().toISOString();
      await writeJsonAtomic(metaPath, meta);
    } catch (err) {
      await audit("classify.error", { slug: d.name, error: String(err) });
    }
  }
  // eslint-disable-next-line no-console
  console.log("classification complete");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});