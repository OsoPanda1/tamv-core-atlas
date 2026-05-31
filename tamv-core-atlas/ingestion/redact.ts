// Security — redact secrets from any text artifact under atlas/. Idempotent.
// Patterns cover GitHub PATs, AWS access keys, generic API keys, JWTs, and
// PEM private keys. Run BEFORE publish.
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./config.js";
import { audit } from "./safe-fs.js";

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "aws-access-key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "github-pat-classic", re: /ghp_[A-Za-z0-9]{36,}/g },
  { name: "github-pat-fine", re: /github_pat_[A-Za-z0-9_]{70,}/g },
  { name: "openai-key", re: /sk-[A-Za-z0-9]{32,}/g },
  { name: "jwt", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  {
    name: "pem-private-key",
    re: /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g,
  },
  {
    name: "generic-secret-assignment",
    re: /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"'\n]{8,}["']/gi,
  },
];

function redact(text: string): { text: string; hits: Record<string, number> } {
  const hits: Record<string, number> = {};
  let out = text;
  for (const p of PATTERNS) {
    const matches = out.match(p.re);
    if (matches && matches.length) {
      hits[p.name] = matches.length;
      out = out.replace(p.re, `[REDACTED:${p.name}]`);
    }
  }
  return { text: out, hits };
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(md|json|txt|ya?ml)$/i.test(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  const files = await walk(PATHS.atlasDir);
  let total = 0;
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const { text, hits } = redact(raw);
    if (text !== raw) {
      await fs.writeFile(file, text, "utf8");
      total += Object.values(hits).reduce((a, b) => a + b, 0);
      await audit("redact.applied", { file, hits });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`redaction complete (${total} matches across ${files.length} files)`);
  if (process.argv.includes("--validate") && total > 0) process.exit(2);
}

main().catch(async (err) => {
  await audit("redact.fatal", { error: String(err) });
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});