import process from "node:process";
import crypto from "node:crypto";
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";

import { runConstitutionalGuard } from "../src/lib/isabella/constitutionalGuard";
import { ConstitutionEngine } from "../src/lib/constitutionEngine";
import { BookPIChain } from "../src/lib/bookpi/BookPIChain";
import { AnubisSentinel } from "../src/lib/security/AnubisSentinel";

// ============================================================================
// TIPOS
// ============================================================================

type HexagonId =
  | "HE-Ingest"
  | "HE-Transform"
  | "HE-Publish"
  | "HE-Science"
  | "HE-Economy"
  | "HE-Identity"
  | "HE-Security";

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

type ConstitutionalViolation = {
  code: string;
  severity: "critical" | "warning" | "info";
  layer: string;
  message: string;
  context?: Record<string, unknown>;
};

type RuntimeAudit = {
  traceId: string;
  startedAt: string;
  completedAt?: string;
  mode: string;
  valid: boolean;
  integrityHash?: string;
  violations: ConstitutionalViolation[];
  executionMs?: number;
  he_hep_context: HeHepContext;
};

type ConstitutionalGuardResult = {
  valid: boolean;
  violations: ConstitutionalViolation[];
  checkedLayers: string[];
  timestamp: string;
};

type EOCTValidationEntry = {
  id: string;
  traceId: string;
  protocolType: "CONSTITUTIONAL_RUNTIME";
  ethicalScore: number;
  ontologicalIntegrity: boolean;
  collapsedAt: string;
  validatedBy: string;
  he_hep_context: HeHepContext;
};

type MSRBlockchainEntry = {
  id: string;
  traceId: string;
  eventType: string;
  integrityHash: string;
  previousHash: string;
  blockHash: string;
  timestamp: string;
  he_hep_context: HeHepContext;
};

// ============================================================================
// CONSTANTES
// ============================================================================

const HARD_FAIL = [
  "CONSTITUTION_BREACH",
  "ONTOLOGICAL_CONFLICT",
  "IDENTITY_CORRUPTION",
  "GOVERNANCE_OVERRIDE",
  "MEMORY_TAMPERING",
  "CANONICAL_HASH_MISMATCH",
  "GENEALOGICAL_BREAK",
] as const;

const HE_CONSTITUTIONAL_SECURITY: HeHepContext = {
  hexagon: "HE-Security",
  domain: "HEP-1",
};

const HE_CONSTITUTIONAL_SCIENCE: HeHepContext = {
  hexagon: "HE-Science",
  domain: "HEP-1",
};

const PATHS = {
  eoctRegistry: resolve(process.cwd(), "logs/eoct-protocol-registry.jsonl"),
  msrLedger: resolve(process.cwd(), "logs/msr-blockchain.jsonl"),
} as const;

// Estado de blockchain MSR (debería persistir entre ejecuciones)
let msrLastHash = "0000000000000000000000000000000000000000000000000000000000000000";

// ============================================================================
// HELPERS
// ============================================================================

function nowISO(): string {
  return new Date().toISOString();
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

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function createTraceId(): string {
  return [
    "tamv",
    "constitutional",
    Date.now().toString(36),
    crypto.randomBytes(6).toString("hex"),
  ].join(".");
}

// ============================================================================
// INTEGRACIÓN MSR BLOCKCHAIN
// ============================================================================

async function appendMSRBlock(
  traceId: string,
  eventType: string,
  integrityHash: string,
  context: HeHepContext,
): Promise<string> {
  const block: MSRBlockchainEntry = {
    id: generateId("msr"),
    traceId,
    eventType,
    integrityHash,
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
// INTEGRACIÓN EOCT
// ============================================================================

async function validateEOCT(
  traceId: string,
  violations: ConstitutionalViolation[],
  context: HeHepContext,
): Promise<string> {
  const criticalCount = violations.filter((v) => v.severity === "critical").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;

  // Score ético: penaliza críticos fuerte, warnings leve
  let ethicalScore = 100;
  ethicalScore -= criticalCount * 30;
  ethicalScore -= warningCount * 5;
  ethicalScore = Math.max(0, Math.min(100, ethicalScore));

  // Integridad ontológica: no violaciones críticas con códigos HARD_FAIL
  const hardFailViolations = violations.filter((v) =>
    HARD_FAIL.includes(v.code as any),
  );
  const ontologicalIntegrity = hardFailViolations.length === 0;

  const entry: EOCTValidationEntry = {
    id: generateId("eoct"),
    traceId,
    protocolType: "CONSTITUTIONAL_RUNTIME",
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
      `TAMV-EOCT-CRITICAL: Ontological integrity violation in constitutional runtime (${hardFailViolations.length} hard fail violations)`,
    );
  }

  if (ethicalScore < 50) {
    throw new Error(
      `TAMV-EOCT-CRITICAL: Ethical score too low (${ethicalScore}) for constitutional runtime`,
    );
  }

  return entry.id;
}

// ============================================================================
// MAIN RUNTIME
// ============================================================================

async function main(): Promise<void> {
  const startedAt = performance.now();
  const traceId = createTraceId();

  const runtimeAudit: RuntimeAudit = {
    traceId,
    startedAt: nowISO(),
    mode: process.env.TAMV_CONSTITUTION_MODE || "strict",
    valid: false,
    violations: [],
    he_hep_context: HE_CONSTITUTIONAL_SECURITY,
  };

  const bookpi = new BookPIChain();
  const anubis = new AnubisSentinel(
    Number(process.env.TAMV_MAX_ANOMALY_SCORE || 0.75),
  );

  const engine = new ConstitutionEngine({
    mode: runtimeAudit.mode,
    traceId,
    immutableRuntime: true,
    enforceGenealogy: true,
    enforceCanonicalIntegrity: true,
    enforceSemanticConsistency: true,
    allowExperimentalMutation: process.env.TAMV_ALLOW_EXPERIMENTAL === "true",
  });

  try {
    // 1. Pre-runtime: Anubis threat analysis
    const preRuntimeThreat = await anubis.analyzeRequest("SYSTEM_RUNTIME", {
      scope: "constitutional-runtime",
      env: process.env.NODE_ENV,
      traceId,
    });

    if (anubis.shouldBlock(preRuntimeThreat)) {
      throw new Error(
        `ANUBIS_RUNTIME_BLOCK: anomalyScore=${preRuntimeThreat.anomalyScore}`,
      );
    }

    // 2. Constitutional guard execution
    const result: ConstitutionalGuardResult = await runConstitutionalGuard({
      engine,
      scope: "full-system",
      traceId,
      layers: [
        "identity",
        "governance",
        "memory",
        "economy",
        "federation",
        "kernel",
        "security",
      ],
      strictSemanticValidation: true,
      verifyCanonicalHashes: true,
      verifyGenealogicalContinuity: true,
      enforceRootCanon: true,
    });

    const violations: ConstitutionalViolation[] = Array.isArray(result?.violations)
      ? result.violations
      : [];

    const criticalViolations = violations.filter((v) => {
      const code = String(v?.code || "").toUpperCase();
      return HARD_FAIL.includes(code as any);
    });

    const integrityHash = sha256({
      traceId,
      valid: result.valid,
      violations,
      checkedAt: nowISO(),
    });

    runtimeAudit.valid = result.valid === true && criticalViolations.length === 0;
    runtimeAudit.integrityHash = integrityHash;
    runtimeAudit.violations = violations;

    // 3. BookPI event: execution
    bookpi.recordEvent("CONSTITUTIONAL_RUNTIME_EXECUTED", {
      traceId,
      valid: runtimeAudit.valid,
      integrityHash,
      violations: violations.length,
      criticalViolations: criticalViolations.length,
      mode: runtimeAudit.mode,
      he_hep_context: HE_CONSTITUTIONAL_SECURITY,
    });

    // 4. MSR Blockchain: append block
    const msrBlockId = await appendMSRBlock(
      traceId,
      "CONSTITUTIONAL_RUNTIME",
      integrityHash,
      HE_CONSTITUTIONAL_SCIENCE,
    );

    // 5. EOCT validation
    const eoctValidationId = await validateEOCT(
      traceId,
      violations,
      HE_CONSTITUTIONAL_SCIENCE,
    );

    if (!runtimeAudit.valid) {
      bookpi.recordEvent("CONSTITUTIONAL_RUNTIME_FAILED", {
        traceId,
        integrityHash,
        violations,
        msrBlockId,
        eoctValidationId,
        he_hep_context: HE_CONSTITUTIONAL_SECURITY,
      });

      console.error(
        JSON.stringify(
          {
            status: "FAILED",
            traceId,
            integrityHash,
            violations,
            criticalViolations,
            msrBlockId,
            eoctValidationId,
          },
          null,
          2,
        ),
      );

      process.exitCode = 1;
      return;
    }

    runtimeAudit.completedAt = nowISO();
    runtimeAudit.executionMs = Math.round(performance.now() - startedAt);

    // 6. BookPI event: approved
    bookpi.recordEvent("CONSTITUTIONAL_RUNTIME_APPROVED", {
      traceId,
      integrityHash,
      executionMs: runtimeAudit.executionMs,
      msrBlockId,
      eoctValidationId,
      he_hep_context: HE_CONSTITUTIONAL_SECURITY,
    });

    console.log(
      JSON.stringify(
        {
          status: "OK",
          traceId,
          integrityHash,
          executionMs: runtimeAudit.executionMs,
          canonicalIntegrity: true,
          genealogyIntegrity: true,
          constitutionalRuntime: "ACTIVE",
          msrBlockId,
          eoctValidationId,
          he_hep_context: HE_CONSTITUTIONAL_SECURITY,
        },
        null,
        2,
      ),
    );
  } catch (error: any) {
    runtimeAudit.completedAt = nowISO();
    runtimeAudit.executionMs = Math.round(performance.now() - startedAt);

    // Emisión de evento de crash a BookPI
    bookpi.recordEvent("CONSTITUTIONAL_RUNTIME_CRASH", {
      traceId,
      error: error?.message || "unknown",
      executionMs: runtimeAudit.executionMs,
      he_hep_context: HE_CONSTITUTIONAL_SECURITY,
    });

    // Intentar registrar en MSR aunque haya fallado (para auditoría)
    try {
      const crashHash = sha256({
        traceId,
        error: error?.message,
        timestamp: nowISO(),
      });

      await appendMSRBlock(
        traceId,
        "CONSTITUTIONAL_RUNTIME_CRASH",
        crashHash,
        HE_CONSTITUTIONAL_SECURITY,
      );
    } catch {
      // Si MSR falla, no queremos bloquear el crash report
    }

    console.error(
      JSON.stringify(
        {
          status: "CRITICAL_FAILURE",
          traceId,
          error: error?.message || "unknown",
          stack: error?.stack,
          executionMs: runtimeAudit.executionMs,
          he_hep_context: HE_CONSTITUTIONAL_SECURITY,
        },
        null,
        2,
      ),
    );

    process.exitCode = 1;
  }
}

void main();
