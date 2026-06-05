// Capa 1.5 — Fetch metadata raw from GitHub Contents API for each repo:
// README, package.json, and a few config files. NO clone, NO execution.
// Writes evidence under atlas/repos/<slug>/evidence/raw/ (gitignored).
import fs from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { CONFIG, LIMITS, PATHS } from "./config.js";
import { RepoInputSchema, type RepoInput } from "./schemas.js";
import { audit, safeSlug, writeTextAtomic, readJsonIfExists, assertContained } from "./safe-fs.js";
import { fetchWithRetry } from "./http.js";

const FILES = ["README.md", "readme.md", "package.json", "tsconfig.json", "Dockerfile"];

async function fetchOne(repo: RepoInput): Promise<void> {
  const slug = safeSlug(repo.name);
  const evidenceDir = path.join(PATHS.reposDir, slug, "evidence", "raw");
  assertContained(PATHS.reposDir, evidenceDir);
  await fs.mkdir(evidenceDir, { recursive: true });

  let bytesTotal = 0;
  for (const file of FILES) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${repo.name}/contents/${encodeURIComponent(file)}`;
    try {
      const res = await fetchWithRetry(url, {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          Authorization: `Bearer ${CONFIG.GITHUB_TOKEN}`,
          "User-Agent": "tamv-core-atlas",
        },
      });
      if (res.status === 404) continue;
      if (!res.ok) {
        await audit("fetch.skip", { repo: repo.name, file, status: res.status });
        continue;
      }
      const body = await res.text();
      bytesTotal += body.length;
      if (body.length > LIMITS.maxFileBytes) {
        await audit("fetch.too-large", { repo: repo.name, file, size: body.length });
        continue;
      }
      if (bytesTotal > LIMITS.maxRepoBytes) {
        await audit("fetch.repo-cap", { repo: repo.name });
        break;
      }
      const safeName = file.replace(/[^A-Za-z0-9._-]/g, "_");
      const dest = path.join(evidenceDir, safeName);
      assertContained(evidenceDir, dest);
      await writeTextAtomic(dest, body);
    } catch (err) {
      await audit("fetch.error", { repo: repo.name, file, error: String(err) });
    }
  }
  await audit("fetch.complete", { repo: repo.name, bytes: bytesTotal });
}

async function main() {
  if (!CONFIG.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN required for fetch");
  const reposRaw = (await readJsonIfExists<unknown[]>(PATHS.reposJson)) ?? [];
  const repos = reposRaw.map((r) => RepoInputSchema.parse(r));

  const limit = pLimit(CONFIG.CONCURRENCY);
  await Promise.all(repos.map((r) => limit(() => fetchOne(r))));
  console.log(`fetched evidence for ${repos.length} repos`);
}

main().catch(async (err) => {
  await audit("fetch.fatal", { error: String(err) });
  console.error(err);
  process.exit(1);
});
