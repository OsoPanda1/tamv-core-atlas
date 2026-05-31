// Capa 1 — Discovery. Lista repos del owner vía GitHub API con paginación,
// filtra archived/forks según config, valida con Zod, y persiste repos.json.
import { Octokit } from "@octokit/rest";
import { CONFIG, PATHS } from "./config.js";
import { RepoInputSchema, type RepoInput } from "./schemas.js";
import { audit, writeJsonAtomic } from "./safe-fs.js";

async function main() {
  if (!CONFIG.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN missing. Copy .env.example to .env and set a read-only PAT.");
  }
  const octokit = new Octokit({
    auth: CONFIG.GITHUB_TOKEN,
    userAgent: "tamv-core-atlas/1.0 (+https://github.com/REDACTED)",
    request: { timeout: 15_000 },
  });

  const repos: RepoInput[] = [];
  let scanned = 0;

  for await (const response of octokit.paginate.iterator(octokit.repos.listForUser, {
    username: CONFIG.GITHUB_OWNER,
    per_page: 100,
    sort: "updated",
  })) {
    for (const r of response.data) {
      scanned++;
      if (r.archived) continue;
      if (r.fork && CONFIG.INCLUDE_FORKS !== "true") continue;
      try {
        const parsed = RepoInputSchema.parse({
          name: r.name,
          url: r.html_url,
          defaultBranch: r.default_branch ?? undefined,
          archived: r.archived ?? false,
          fork: r.fork ?? false,
          pushedAt: r.pushed_at ?? undefined,
        });
        repos.push(parsed);
      } catch (err) {
        await audit("discover.rejected", { name: r.name, error: String(err) });
      }
      if (repos.length >= CONFIG.MAX_REPOS) break;
    }
    if (repos.length >= CONFIG.MAX_REPOS) break;
  }

  await writeJsonAtomic(PATHS.reposJson, repos);
  await audit("discover.complete", { scanned, kept: repos.length, owner: CONFIG.GITHUB_OWNER });
  // eslint-disable-next-line no-console
  console.log(`discovered ${repos.length} repos (scanned ${scanned}) for ${CONFIG.GITHUB_OWNER}`);
}

main().catch(async (err) => {
  await audit("discover.fatal", { error: String(err) });
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});