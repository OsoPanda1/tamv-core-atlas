// Capa 2.A — From raw evidence, extract structured signals into meta.json.
// No code execution; only string parsing of README / package.json.
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { PATHS } from "./config.js";
import { RepoInputSchema, RepoMetaSchema, type Stack } from "./schemas.js";
import { audit, readJsonIfExists, readTextFileSafe, safeSlug, writeJsonAtomic } from "./safe-fs.js";

function detectStackFromPackageJson(pkg: Record<string, unknown>): Stack {
  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };
  const has = (n: string) => Object.prototype.hasOwnProperty.call(deps, n);
  const frameworks: string[] = [];
  const tools: string[] = [];
  if (has("react")) frameworks.push("react");
  if (has("next")) frameworks.push("next");
  if (has("vite")) frameworks.push("vite");
  if (has("@tanstack/react-start")) frameworks.push("tanstack-start");
  if (has("express")) frameworks.push("express");
  if (has("fastify")) frameworks.push("fastify");
  if (has("@nestjs/core")) frameworks.push("nestjs");
  if (has("vue")) frameworks.push("vue");
  if (has("svelte")) frameworks.push("svelte");
  if (has("astro")) frameworks.push("astro");
  if (has("typescript")) tools.push("typescript");
  if (has("eslint")) tools.push("eslint");
  if (has("prettier")) tools.push("prettier");
  if (has("vitest") || has("jest")) tools.push("tests");
  if (has("tailwindcss")) tools.push("tailwind");
  return { languages: [], frameworks, tools };
}

function extractPurposeFromReadme(md: string): string {
  const parsed = matter(md);
  const body = parsed.content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .trim();
  const firstParagraph = body.split(/\n\s*\n/).find((p) => p.trim().length > 20) ?? "";
  return firstParagraph.replace(/\s+/g, " ").slice(0, 500).trim();
}

async function processRepo(repoName: string, url: string, defaultBranch?: string): Promise<void> {
  const slug = safeSlug(repoName);
  const repoDir = path.join(PATHS.reposDir, slug);
  const rawDir = path.join(repoDir, "evidence", "raw");
  await fs.mkdir(repoDir, { recursive: true });

  let purpose = "";
  let stack: Stack = { languages: [], frameworks: [], tools: [] };
  const commands: Record<string, string> = {};
  const tags: string[] = [];

  // README
  for (const candidate of ["README.md", "readme.md"]) {
    try {
      const md = await readTextFileSafe(path.join(rawDir, candidate));
      purpose = extractPurposeFromReadme(md);
      break;
    } catch {
      // ignore
    }
  }

  // package.json
  try {
    const pkgRaw = await readTextFileSafe(path.join(rawDir, "package.json"));
    const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
    stack = detectStackFromPackageJson(pkg);
    const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};
    for (const key of ["dev", "build", "start", "test"]) {
      if (typeof scripts[key] === "string") commands[key] = scripts[key]!.slice(0, 200);
    }
    if (typeof pkg.keywords === "object" && Array.isArray(pkg.keywords)) {
      for (const k of pkg.keywords as unknown[]) {
        if (typeof k === "string" && k.length <= 40) tags.push(k.toLowerCase());
      }
    }
  } catch {
    // package.json missing or invalid — ok
  }

  const meta = RepoMetaSchema.parse({
    name: repoName,
    slug,
    url,
    defaultBranch,
    category: "experiment",
    tags: Array.from(new Set(tags)).slice(0, 50),
    purpose,
    stack,
    commands,
    relations: [],
    collectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await writeJsonAtomic(path.join(repoDir, "meta.json"), meta);
  await audit("extract.ok", { repo: repoName, slug });
}

async function main() {
  const reposRaw = (await readJsonIfExists<unknown[]>(PATHS.reposJson)) ?? [];
  const repos = reposRaw.map((r) => RepoInputSchema.parse(r));
  for (const r of repos) {
    try {
      await processRepo(r.name, r.url, r.defaultBranch);
    } catch (err) {
      await audit("extract.error", { repo: r.name, error: String(err) });
    }
  }
  console.log(`extracted signals for ${repos.length} repos`);
}

main().catch(async (err) => {
  await audit("extract.fatal", { error: String(err) });
  console.error(err);
  process.exit(1);
});
