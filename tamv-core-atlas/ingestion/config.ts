// Central, validated configuration. Fail fast on bad env.
import { z } from "zod";

const EnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(20, "GITHUB_TOKEN required (read-only PAT)").optional(),
  GITHUB_OWNER: z.string().min(1).default("OsoPanda1"),
  INCLUDE_FORKS: z.enum(["true", "false"]).default("false"),
  MAX_REPOS: z.coerce.number().int().min(1).max(5000).default(500),
  CONCURRENCY: z.coerce.number().int().min(1).max(32).default(6),
});

export const CONFIG = EnvSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_OWNER: process.env.GITHUB_OWNER,
  INCLUDE_FORKS: process.env.INCLUDE_FORKS,
  MAX_REPOS: process.env.MAX_REPOS,
  CONCURRENCY: process.env.CONCURRENCY,
});

export const PATHS = {
  reposJson: "repos.json",
  atlasDir: "atlas",
  reposDir: "atlas/repos",
  indexJson: "atlas/index.json",
  graphJson: "atlas/graph.json",
  taxonomyJson: "atlas/taxonomy.json",
  auditLog: "atlas/audit.log",
} as const;

export const LIMITS = {
  maxFileBytes: 1024 * 1024, // 1 MB per evidence file
  maxRepoBytes: 8 * 1024 * 1024, // 8 MB total per repo
  httpTimeoutMs: 15_000,
  httpRetries: 3,
  httpBackoffMs: 800,
} as const;
