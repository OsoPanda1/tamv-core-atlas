// Capa 2.B — Re-validate every meta.json with Zod and apply safe defaults.
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./config.js";
import { RepoMetaSchema } from "./schemas.js";
import { audit, writeJsonAtomic } from "./safe-fs.js";

async function main() {
  const dirs = await fs.readdir(PATHS.reposDir, { withFileTypes: true });
  let ok = 0;
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaPath = path.join(PATHS.reposDir, d.name, "meta.json");
    try {
      const raw = JSON.parse(await fs.readFile(metaPath, "utf8"));
      const meta = RepoMetaSchema.parse(raw);
      meta.updatedAt = new Date().toISOString();
      await writeJsonAtomic(metaPath, meta);
      ok++;
    } catch (err) {
      await audit("normalize.error", { slug: d.name, error: String(err) });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`normalized ${ok} repos`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});