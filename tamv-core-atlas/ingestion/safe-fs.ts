// Defensive filesystem and string helpers. No symlinks, no path traversal,
// no oversized files. All evidence is read through these helpers.
import fs from "node:fs/promises";
import path from "node:path";
import { LIMITS, PATHS } from "./config.js";

const ALLOWED_TOP_FILES = new Set([
  "README.md",
  "readme.md",
  "README",
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".tool-versions",
  ".nvmrc",
]);

const ALLOWED_TOP_DIRS = new Set(["docs", "src", ".github"]);

export function safeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  if (!slug) throw new Error(`safeSlug: empty result for input "${input}"`);
  return slug;
}

/** Ensure `child` is strictly contained under `parent`. Blocks `..` escapes. */
export function assertContained(parent: string, child: string): void {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escape blocked: ${child} not under ${parent}`);
  }
}

export function isAllowedRepoPath(relPath: string): boolean {
  const normalized = path.posix.normalize(relPath);
  if (normalized.startsWith("..") || normalized.includes("/../")) return false;
  if (normalized.startsWith("/")) return false;
  const top = normalized.split("/")[0] ?? "";
  if (ALLOWED_TOP_FILES.has(top)) return true;
  if (ALLOWED_TOP_DIRS.has(top)) return true;
  return false;
}

export async function readTextFileSafe(filePath: string): Promise<string> {
  const stat = await fs.lstat(filePath);
  if (stat.isSymbolicLink()) throw new Error(`symlink blocked: ${filePath}`);
  if (!stat.isFile()) throw new Error(`not a regular file: ${filePath}`);
  if (stat.size > LIMITS.maxFileBytes) {
    throw new Error(`file too large (${stat.size}B > ${LIMITS.maxFileBytes}B): ${filePath}`);
  }
  return fs.readFile(filePath, "utf8");
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

export async function writeTextAtomic(filePath: string, value: string): Promise<void> {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, value, "utf8");
  await fs.rename(tmp, filePath);
}

export async function audit(event: string, payload: Record<string, unknown> = {}): Promise<void> {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload }) + "\n";
  await fs.mkdir(path.dirname(PATHS.auditLog), { recursive: true });
  await fs.appendFile(PATHS.auditLog, line, "utf8");
}

export async function readJsonIfExists<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
