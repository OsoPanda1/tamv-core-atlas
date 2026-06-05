import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { resolve, dirname } from "node:path";
import {
  readFile,
  writeFile,
  mkdir,
  access,
  constants,
  appendFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import crypto from "node:crypto";

// Importaciones del ecosistema TAMV
import {
  emitLocalEliteBookPiEvent,
  projectBookPiLedger,
  type BookPiEvent,
} from "./elite-bookpi.mjs";
import { ELITE_HEHEP_MANIFEST } from "./elite-manifest.mjs";
import {
  stableHash,
  publishEvent,
  createEvent,
} from "./federation-bus.mjs";

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();

const PATHS = {
  script: resolve(ROOT, "scripts/unify_osopanda_repos.sh"),
  manifest: resolve(ROOT, "docs/repo-unification-manifest.json"),
  audit: resolve(ROOT, "logs/fusion-audit.log"),
  snapshots: resolve(ROOT, "snapshots"),
  lockDir: resolve(ROOT, "logs/.fusion.lock"),
  lockMeta: resolve(ROOT, "logs/.fusion.lock/meta.json"),
  msrLedger: resolve(ROOT, "logs/msr-blockchain.jsonl"),
  eoctRegistry: resolve(ROOT, "logs/eoct-protocol-registry.jsonl"),
} as const;

const DEFAULT_TIMEOUT_MS = 1000 * 60 * 30; // 30 min
const DISCOVERY_TIMEOUT_MS = 1000 * 60 * 5; // 5 min
const DEFAULT_MAX_BUFFER_BYTES = 1024 * 1024 * 32; // 32 MB
const LOCK_WAIT_TIMEOUT_MS = 1000 * 60 * 35; // 35 min
const LOCK_POLL_INTERVAL_MS = 500;
const LOCK_STALE_MS = 1000 * 60 * 60; // 1 hora

// ============================================================================
// TIPOS
// ============================================================================

type HexagonId =
  | "HE-Ingest"
  | "HE-Transform"
  | "HE-Publish"
  | "HE-Science"
  | "HE-Economy"
  | "HE-Identity";

type HeDomainId =
  | "HEP-1"
  | "HEP-2"
  | "HEP-3"
  | "HEP-4"
  | "HEP-5"
  | "HEP-6"
  | "HEP-7";

type HeHepContext = {
  hexagon: HexagonId;
  domain: HeDomainId;
};

type RepoManifestEntry = {
  name: string;
  url: string;
  branch?: string;
  commit?: string;
  [key: string]: unknown;
};

type RepoManifest = {
  version: string;
  owner: string;
  repositories: RepoManifestEntry[];
  discoveredAt?: string;
  [key: string]: unknown;
};

type AuditLogEntry = {
  timestamp: string;
  traceId: string;
  type: string;
  he_hep_context: HeHepContext;
  [key: string]: unknown;
};

type MSRBlockchainEntry = {
  id: string;
  traceId: string;
  eventType: string;
  manifestHash: string;
  previousHash: string;
  blockHash: string;
  timestamp: string;
  signature?: string;
  he_hep_context: HeHepContext;
};

type EOCTProtocolEntry = {
  id: string;
  traceId: string;
  protocolType: "FUSION" | "DISCOVERY";
  ethicalScore: number;
  ontologicalIntegrity: boolean;
  collapsedAt: string;
  validatedBy: string;
  he_hep_context: HeHepContext;
};

type FusionDiscoveryResult = {
  ok: true;
  mode: "DISCOVERY";
  owner: string;
  traceId: string;
  manifest: RepoManifest;
  manifestHash: string;
  snapshotPath: string;
  stdout: string;
  stderr: string;
  elapsedMs: number;
  bookpiEventId: string;
  msrBlockId: string;
  eoctValidationId: string;
};

type FusionExecutionResultSuccess = {
  ok: true;
  mode: "FUSION";
  owner: string;
  traceId: string;
  executedAt: string;
  elapsedMs: number;
  manifestHashBefore: string;
  manifestHashAfter: string;
  manifestChanged: boolean;
  repositories: number;
  manifestPath: string;
  snapshotPath: string;
  stdout: string;
  stderr: string;
  bookpiEventId: string;
  msrBlockId: string;
  eoctValidationId: string;
};

type FusionExecutionResultFailure = {
  ok: false;
  owner: string;
  traceId: string;
  error: string;
  executedAt: string;
  bookpiEventId: string;
};

type FusionExecutionResult =
  | FusionExecutionResultSuccess
  | FusionExecutionResultFailure;

// ============================================================================
// CONTEXTOS HE-HEP ESTÁNDAR
// ============================================================================

const HE_FUSION_INGEST: HeHepContext = {
  hexagon: "HE-Ingest",
  domain: "HEP-1",
};

const HE_FUSION_TRANSFORM: HeHepContext = {
  hexagon: "HE-Transform",
  domain: "HEP-2",
};

const HE_FUSION_SCIENCE: HeHepContext = {
  hexagon: "HE-Science",
  domain: "HEP-1",
};

const HE_FUSION_ECONOMY: HeHepContext = {
  hexagon: "HE-Economy",
  domain: "HEP-1",
};

// ============================================================================
// ERRORES
// ============================================================================

class ScriptExecutionError extends Error {
  stdout?: string;
  stderr?: string;
  code?: number | string;
  signal?: NodeJS.Signals | null;

  constructor(
    message: string,
    details?: {
      stdout?: string;
      stderr?: string;
      code?: number | string;
      signal?: NodeJS.Signals | null;
    },
  ) {
    super(message);
    this.name = "ScriptExecutionError";
    this.stdout = details?.stdout;
    this.stderr = details?.stderr;
    this.code = details?.code;
    this.signal = details?.signal;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateTraceId(context: string): string {
  const now = Date.now().toString(36);
  const rand = crypto.randomBytes(6).toString("hex");
  return `${context}-${now}-${rand}`;
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function normalizeOwner(owner: string): string {
  const value = String(owner ?? "").trim();
  if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
    throw new Error(
      `TAMV-CRITICAL: Invalid repository owner format: ${owner}`,
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "__undefined__";
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((key) => {
      const v = obj[key];
      return `${JSON.stringify(key)}:${stableStringify(v)}`;
    });
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(data: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(data)).digest("hex");
}

function safeJsonParse<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`TAMV-CRITICAL: ${label} is not valid JSON`);
  }
}

function validateManifest(manifest: unknown): asserts manifest is RepoManifest {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("TAMV-CRITICAL: Manifest is missing or not an object");
  }

  const m = manifest as Partial<RepoManifest>;

  if (typeof m.version !== "string" || !m.version.trim()) {
    throw new Error("TAMV-CRITICAL: Manifest.version is invalid");
  }

  if (typeof m.owner !== "string" || !m.owner.trim()) {
    throw new Error("TAMV-CRITICAL: Manifest.owner is invalid");
  }

  if (!Array.isArray(m.repositories)) {
    throw new Error("TAMV-CRITICAL: Manifest.repositories is not an array");
  }

  if (m.repositories.length === 0) {
    throw new Error("TAMV-CRITICAL: No repositories discovered in manifest");
  }

  for (const repo of m.repositories) {
    if (!repo || typeof repo !== "object") {
      throw new Error("TAMV-CRITICAL: Invalid repository entry");
    }

    const entry = repo as RepoManifestEntry;

    if (typeof entry.name !== "string" || !entry.name.trim()) {
      throw new Error("TAMV-CRITICAL: Manifest repository entry missing name");
    }

    if (typeof entry.url !== "string" || !entry.url.trim()) {
      throw new Error("TAMV-CRITICAL: Manifest repository entry missing url");
    }

    if (entry.commit !== undefined) {
      const commit = String(entry.commit);
      if (!/^[0-9a-fA-F]{40}$|^[0-9a-fA-F]{64}$/.test(commit)) {
        throw new Error(
          `TAMV-CRITICAL: Invalid commit hash for ${entry.name}: ${commit}`,
        );
      }
    }
  }
}

async function ensureEnvironment(): Promise<void> {
  await mkdir(dirname(PATHS.manifest), { recursive: true });
  await mkdir(dirname(PATHS.audit), { recursive: true });
  await mkdir(PATHS.snapshots, { recursive: true });
  await mkdir(dirname(PATHS.msrLedger), { recursive: true });
  await mkdir(dirname(PATHS.eoctRegistry), { recursive: true });

  try {
    await access(PATHS.script, constants.X_OK);
  } catch {
    throw new Error(
      `TAMV-CRITICAL: Fusion script is missing or not executable: ${PATHS.script}`,
    );
  }
}

async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  const line = JSON.stringify(entry) + "\n";
  await appendFile(PATHS.audit, line, { encoding: "utf-8" });
}

async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const content = JSON.stringify(value, null, 2) + "\n";
  await writeFile(tmpPath, content, { encoding: "utf-8" });
  await rename(tmpPath, filePath);
}

async function acquireLock(
  traceId: string,
  owner: string,
): Promise<() => Promise<void>> {
  await mkdir(dirname(PATHS.lockDir), { recursive: true });

  const started = Date.now();

  while (true) {
    try {
      await mkdir(PATHS.lockDir);

      await writeFile(
        PATHS.lockMeta,
        JSON.stringify(
          {
            traceId,
            owner,
            pid: process.pid,
            startedAt: nowISO(),
          },
          null,
          2,
        ) + "\n",
        { encoding: "utf-8" },
      );

      return async () => {
        await rm(PATHS.lockDir, { recursive: true, force: true });
      };
    } catch {
      let stale = false;

      try {
        const dirStat = await stat(PATHS.lockDir);
        const age = Date.now() - dirStat.mtimeMs;
        stale = age > LOCK_STALE_MS;
      } catch {
        stale = false;
      }

      if (stale) {
        await rm(PATHS.lockDir, { recursive: true, force: true });
        continue;
      }

      const elapsed = Date.now() - started;
      if (elapsed > LOCK_WAIT_TIMEOUT_MS) {
        throw new Error(
          `TAMV-CRITICAL: Fusion lock timeout exceeded for owner=${owner} after ${Math.round(elapsed / 1000)}s`,
        );
      }

      await delay(LOCK_POLL_INTERVAL_MS);
    }
  }
}

async function executeScript(
  args: string[],
  traceId: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execFileAsync(PATHS.script, args, {
      cwd: ROOT,
      timeout: timeoutMs,
      maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
      windowsHide: true,
      shell: false,
      killSignal: "SIGTERM",
      env: {
        ...process.env,
        LANG: "C",
        LC_ALL: "C",
        TAMV_FUSION_MODE: "ACTIVE",
        TAMV_TRACE_ID: traceId,
      },
    });
  } catch (err: any) {
    throw new ScriptExecutionError(
      `TAMV-CRITICAL: Fusion script failed: ${err?.message ?? "unknown error"}`,
      {
        stdout: err?.stdout,
        stderr: err?.stderr,
        code: err?.code,
        signal: err?.signal,
      },
    );
  }
}

// ============================================================================
// INTEGRACIÓN BOOKPI
// ============================================================================

async function emitBookPiEvent(
  traceId: string,
  eventType: string,
  payload: Record<string, unknown>,
  context: HeHepContext,
): Promise<string> {
  const event: BookPiEvent = {
    id: generateId("bkpi"),
    traceId,
    eventType,
    payload,
    he_hep_context: context,
    timestamp: nowISO(),
    hash: sha256({ traceId, eventType, payload, context }),
  };

  await emitLocalEliteBookPiEvent(event);

  return event.id;
}

// ============================================================================
// INTEGRACIÓN MSR BLOCKCHAIN
// ============================================================================

let msrLastHash = "0000000000000000000000000000000000000000000000000000000000000000";

async function appendMSRBlock(
  traceId: string,
  eventType: string,
  manifestHash: string,
  context: HeHepContext,
): Promise<string> {
  const block: MSRBlockchainEntry = {
    id: generateId("msr"),
    traceId,
    eventType,
    manifestHash,
    previousHash: msrLastHash,
    blockHash: "",
    timestamp: nowISO(),
    he_hep_context: context,
  };

  block.blockHash = sha256(block);
  msrLastHash = block.blockHash;

  const line = JSON.stringify(block) + "\n";
  await appendFile(PATHS.msrLedger, line, { encoding: "utf-8" });

  return block.id;
}

// ============================================================================
// INTEGRACIÓN EOCT (Ethical Ontological Collapse Theorem)
// ============================================================================

async function validateEOCT(
  traceId: string,
  protocolType: "FUSION" | "DISCOVERY",
  manifest: RepoManifest,
  context: HeHepContext,
): Promise<string> {
  // Evaluación ética: verificar que el manifest cumple estándares TAMV
  const ethicalScore = calculateEthicalScore(manifest);
  const ontologicalIntegrity = validateOntologicalIntegrity(manifest);

  const entry: EOCTProtocolEntry = {
    id: generateId("eoct"),
    traceId,
    protocolType,
    ethicalScore,
    ontologicalIntegrity,
    collapsedAt: nowISO(),
    validatedBy: "TAMV-EOCT-V1",
    he_hep_context: context,
  };

  const line = JSON.stringify(entry) + "\n";
  await appendFile(PATHS.eoctRegistry, line, { encoding: "utf-8" });

  if (!ontologicalIntegrity) {
    throw new Error(
      `TAMV-EOCT-CRITICAL: Ontological integrity violation detected in ${protocolType}`,
    );
  }

  if (ethicalScore < 50) {
    throw new Error(
      `TAMV-EOCT-CRITICAL: Ethical score too low (${ethicalScore}) for ${protocolType}`,
    );
  }

  return entry.id;
}

function calculateEthicalScore(manifest: RepoManifest): number {
  // Heurística: más repos = más complejidad, penalización leve
  // Repos con commit explícito = mejor trazabilidad, bonus
  let score = 100;

  if (manifest.repositories.length > 50) {
    score -= 10;
  }

  const withCommit = manifest.repositories.filter((r) => r.commit).length;
  const commitRatio = withCommit / manifest.repositories.length;

  score += commitRatio * 20;

  return Math.max(0, Math.min(100, score));
}

function validateOntologicalIntegrity(manifest: RepoManifest): boolean {
  // Regla: todos los repos deben tener URL válida y nombre único
  const names = new Set<string>();

  for (const repo of manifest.repositories) {
    if (!repo.url.startsWith("http://") && !repo.url.startsWith("https://")) {
      return false;
    }

    if (names.has(repo.name)) {
      return false; // nombre duplicado
    }

    names.add(repo.name);
  }

  return true;
}

// ============================================================================
// NÚCLEO DE DISCOVERY
// ============================================================================

async function runDiscoveryCore(
  owner: string,
  traceId: string,
): Promise<FusionDiscoveryResult> {
  const args = [
    "--owner",
    owner,
    "--import-mode",
    "none",
    "--manifest",
    PATHS.manifest,
  ];

  const startedAt = performance.now();

  const { stdout, stderr } = await executeScript(args, traceId, DISCOVERY_TIMEOUT_MS);

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(PATHS.manifest, "utf-8");
  } catch {
    throw new Error("TAMV-CRITICAL: Manifest file not created by fusion script");
  }

  const manifest = safeJsonParse<RepoManifest>(manifestRaw, "Manifest file");
  validateManifest(manifest);

  const manifestHash = sha256(manifest);

  const snapshotPath = resolve(
    PATHS.snapshots,
    `manifest-${traceId}-${manifestHash.slice(0, 16)}.json`,
  );

  await atomicWriteJson(snapshotPath, {
    traceId,
    owner,
    mode: "DISCOVERY",
    manifestHash,
    manifest,
    capturedAt: nowISO(),
  });

  const elapsedMs = Math.round(performance.now() - startedAt);

  // Emisión a BookPI
  const bookpiEventId = await emitBookPiEvent(
    traceId,
    "FUSION_DISCOVERY_SUCCESS",
    {
      owner,
      manifestHash,
      repositories: manifest.repositories.length,
      elapsedMs,
    },
    HE_FUSION_INGEST,
  );

  // Registro en MSR Blockchain
  const msrBlockId = await appendMSRBlock(
    traceId,
    "DISCOVERY",
    manifestHash,
    HE_FUSION_SCIENCE,
  );

  // Validación EOCT
  const eoctValidationId = await validateEOCT(
    traceId,
    "DISCOVERY",
    manifest,
    HE_FUSION_SCIENCE,
  );

  await appendAuditLog({
    timestamp: nowISO(),
    traceId,
    type: "DISCOVERY_SUCCESS",
    owner,
    elapsedMs,
    manifestHash,
    repositories: manifest.repositories.length,
    snapshotPath,
    bookpiEventId,
    msrBlockId,
    eoctValidationId,
    he_hep_context: HE_FUSION_INGEST,
  });

  return {
    ok: true,
    mode: "DISCOVERY",
    owner,
    traceId,
    manifest,
    manifestHash,
    snapshotPath,
    stdout,
    stderr,
    elapsedMs,
    bookpiEventId,
    msrBlockId,
    eoctValidationId,
  };
}

// ============================================================================
// NÚCLEO DE FUSION
// ============================================================================

async function runFusionCore(
  owner: string,
  traceId: string,
): Promise<FusionExecutionResult> {
  const startedAt = performance.now();

  const discovery = await runDiscoveryCore(owner, `${traceId}.pre`);
  const manifestHashBefore = discovery.manifestHash;

  const args = [
    "--owner",
    owner,
    "--import-mode",
    "squash",
    "--manifest",
    PATHS.manifest,
  ];

  const { stdout, stderr } = await executeScript(args, traceId, DEFAULT_TIMEOUT_MS);

  let finalManifestRaw: string;
  try {
    finalManifestRaw = await readFile(PATHS.manifest, "utf-8");
  } catch {
    throw new Error("TAMV-CRITICAL: Post-fusion manifest file not found");
  }

  const finalManifest = safeJsonParse<RepoManifest>(
    finalManifestRaw,
    "Post-fusion manifest",
  );
  validateManifest(finalManifest);

  const manifestHashAfter = sha256(finalManifest);
  const manifestChanged = manifestHashBefore !== manifestHashAfter;

  const snapshotPath = resolve(
    PATHS.snapshots,
    `post-fusion-${traceId}-${manifestHashAfter.slice(0, 16)}.json`,
  );

  await atomicWriteJson(snapshotPath, {
    traceId,
    owner,
    mode: "FUSION",
    manifestHashBefore,
    manifestHashAfter,
    manifestChanged,
    manifest: finalManifest,
    capturedAt: nowISO(),
  });

  const elapsedMs = Math.round(performance.now() - startedAt);

  // Emisión a BookPI
  const bookpiEventId = await emitBookPiEvent(
    traceId,
    "FUSION_EXECUTION_SUCCESS",
    {
      owner,
      manifestHashBefore,
      manifestHashAfter,
      manifestChanged,
      repositories: finalManifest.repositories.length,
      elapsedMs,
    },
    HE_FUSION_TRANSFORM,
  );

  // Registro en MSR Blockchain
  const msrBlockId = await appendMSRBlock(
    traceId,
    "FUSION",
    manifestHashAfter,
    HE_FUSION_ECONOMY,
  );

  // Validación EOCT
  const eoctValidationId = await validateEOCT(
    traceId,
    "FUSION",
    finalManifest,
    HE_FUSION_SCIENCE,
  );

  await appendAuditLog({
    timestamp: nowISO(),
    traceId,
    type: "FUSION_SUCCESS",
    owner,
    elapsedMs,
    manifestHashBefore,
    manifestHashAfter,
    manifestChanged,
    repositories: finalManifest.repositories.length,
    snapshotPath,
    bookpiEventId,
    msrBlockId,
    eoctValidationId,
    he_hep_context: HE_FUSION_TRANSFORM,
  });

  return {
    ok: true,
    mode: "FUSION",
    owner,
    traceId,
    executedAt: nowISO(),
    elapsedMs,
    manifestHashBefore,
    manifestHashAfter,
    manifestChanged,
    repositories: finalManifest.repositories.length,
    manifestPath: PATHS.manifest,
    snapshotPath,
    stdout,
    stderr,
    bookpiEventId,
    msrBlockId,
    eoctValidationId,
  };
}

// ============================================================================
// API PÚBLICA
// ============================================================================

export async function discoverFusionPlan(
  owner = "OsoPanda1",
): Promise<FusionDiscoveryResult> {
  await ensureEnvironment();

  const normalizedOwner = normalizeOwner(owner);
  const traceId = generateTraceId("fusion.discovery");
  const release = await acquireLock(traceId, normalizedOwner);

  try {
    return await runDiscoveryCore(normalizedOwner, traceId);
  } catch (error: any) {
    const bookpiEventId = await emitBookPiEvent(
      traceId,
      "FUSION_DISCOVERY_FAILURE",
      {
        owner: normalizedOwner,
        error: error?.message ?? "unknown",
      },
      HE_FUSION_INGEST,
    );

    await appendAuditLog({
      timestamp: nowISO(),
      traceId,
      type: "DISCOVERY_FAILURE",
      owner: normalizedOwner,
      error: error?.message ?? "unknown",
      stdout: error?.stdout,
      stderr: error?.stderr,
      code: error?.code,
      signal: error?.signal,
      bookpiEventId,
      he_hep_context: HE_FUSION_INGEST,
    });

    throw error;
  } finally {
    await release();
  }
}

export async function executeFusion(
  owner = "OsoPanda1",
): Promise<FusionExecutionResult> {
  await ensureEnvironment();

  const normalizedOwner = normalizeOwner(owner);
  const traceId = generateTraceId("fusion.execute");
  const release = await acquireLock(traceId, normalizedOwner);

  try {
    return await runFusionCore(normalizedOwner, traceId);
  } catch (error: any) {
    const bookpiEventId = await emitBookPiEvent(
      traceId,
      "FUSION_EXECUTION_FAILURE",
      {
        owner: normalizedOwner,
        error: error?.message ?? "unknown",
      },
      HE_FUSION_TRANSFORM,
    );

    await appendAuditLog({
      timestamp: nowISO(),
      traceId,
      type: "FUSION_FAILURE",
      owner: normalizedOwner,
      error: error?.message ?? "unknown",
      stdout: error?.stdout,
      stderr: error?.stderr,
      code: error?.code,
      signal: error?.signal,
      bookpiEventId,
      he_hep_context: HE_FUSION_TRANSFORM,
    });

    return {
      ok: false,
      owner: normalizedOwner,
      traceId,
      error: error?.message ?? "Fusion execution failed",
      executedAt: nowISO(),
      bookpiEventId,
    };
  } finally {
    await release();
  }
}
