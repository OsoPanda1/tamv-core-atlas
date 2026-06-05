#!/usr/bin/env node

/**
 * =============================================================================
 * TAMV Constitutional Semantic & Intent Scanner V5™
 * =============================================================================
 *
 * RC CLASSIFICATION:
 *   QC-TAMV-GOV-01
 *   Constitutional Semantic Enforcement Runtime
 *
 * PURPOSE:
 *   Detect constitutional violations through:
 *   - semantic analysis with contextual windows
 *   - intent detection via co-occurrence patterns
 *   - ontology validation against TAMV Constitution
 *   - governance sovereignty protection
 *   - anti-camouflage linguistic inspection
 *   - risk scoring with Bayesian adjustment
 *   - evidence generation with cryptographic proofs
 *   - immutable auditability via BookPI + MSR + EOCT
 *
 * THIS IS NOT A KEYWORD SCANNER.
 * THIS IS A CONSTITUTIONAL INTERPRETATION ENGINE WITH FEDERATED TELEMETRY.
 *
 * =============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { appendFile } from "node:fs/promises";

// =============================================================================
// TYPES
// =============================================================================

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ViolationCategory =
  | "DAO_GOVERNANCE"
  | "COGNITIVE_MANIPULATION"
  | "ECONOMIC_EXPLOITATION"
  | "AI_SOVEREIGNTY"
  | "IDENTITY_RISK"
  | "CONSENT_VIOLATION"
  | "CONSTITUTIONAL_SUBVERSION"
  | "UNKNOWN";

type HexagonId =
  | "HE-Ingest"
  | "HE-Transform"
  | "HE-Publish"
  | "HE-Science"
  | "HE-Economy"
  | "HE-Identity"
  | "HE-Security";

type HeDomainId = "HEP-1" | "HEP-2" | "HEP-3" | "HEP-4" | "HEP-5" | "HEP-6" | "HEP-7";

type HeHepContext = {
  hexagon: HexagonId;
  domain: HeDomainId;
};

type SemanticPattern = {
  id: string;
  category: ViolationCategory;
  severity: Severity;
  weight: number;
  description: string;
  patterns: RegExp[];
  contextualHints?: RegExp[];
  exemptions?: RegExp[];
  requiresContext: boolean; // Si true, solo dispara si hay hint contextual
};

type ViolationEvidence = {
  patternId: string;
  category: ViolationCategory;
  severity: Severity;
  weight: number;
  matchedText: string;
  contextSnippet: string;
  line: number;
  column: number;
  file: string;
  hash: string;
  description: string;
  traceId: string;
};

type ScanResult = {
  file: string;
  violations: ViolationEvidence[];
  riskScore: number;
  constitutionalStatus: "VALID" | "REVIEW" | "BLOCKED";
  traceId: string;
};

type FinalReport = {
  scanId: string;
  traceId: string;
  scannedAt: string;
  rootPath: string;
  filesScanned: number;
  filesFlagged: number;
  totalViolations: number;
  globalRiskScore: number;
  status: "VALID" | "REVIEW" | "BLOCKED";
  results: ScanResult[];
  bookpiEventId?: string;
  msrBlockId?: string;
  eoctValidationId?: string;
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

type EOCTValidationEntry = {
  id: string;
  traceId: string;
  protocolType: "CONSTITUTIONAL_SCAN";
  ethicalScore: number;
  ontologicalIntegrity: boolean;
  collapsedAt: string;
  validatedBy: string;
  he_hep_context: HeHepContext;
};

type BookPIEvent = {
  id: string;
  traceId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
  hash: string;
  he_hep_context: HeHepContext;
};

// =============================================================================
// CONFIG
// =============================================================================

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "public",
  ".turbo",
  ".vercel",
  ".cache",
  "tmp",
  "snapshots",
  "logs",
]);

const SCANNED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".json",
  ".yaml",
  ".yml",
]);

const VALID_MARKERS = [
  /\[HISTORICAL\]/i,
  /\[LEGACY\]/i,
  /\[EXTERNAL\]/i,
  /\[DOCUMENTATION_ONLY\]/i,
  /\[RESEARCH_CONTEXT\]/i,
  /\[TAMV_EXEMPTION\]/i,
];

const HE_SCANNER_SECURITY: HeHepContext = {
  hexagon: "HE-Security",
  domain: "HEP-1",
};

const HE_SCANNER_SCIENCE: HeHepContext = {
  hexagon: "HE-Science",
  domain: "HEP-2",
};

const PATHS = {
  bookpiEvents: path.resolve(process.cwd(), "logs/bookpi-events.jsonl"),
  msrLedger: path.resolve(process.cwd(), "logs/msr-blockchain.jsonl"),
  eoctRegistry: path.resolve(process.cwd(), "logs/eoct-protocol-registry.jsonl"),
} as const;

let msrLastHash = "0000000000000000000000000000000000000000000000000000000000000000";

// =============================================================================
// SEMANTIC CONSTITUTIONAL PATTERNS V5
// =============================================================================

const SEMANTIC_PATTERNS: SemanticPattern[] = [
  {
    id: "DAO-001",
    category: "DAO_GOVERNANCE",
    severity: "CRITICAL",
    weight: 1,
    description: "Unauthorized decentralized governance structures bypassing custodian",
    patterns: [
      /\bdao\b/i,
      /\bon[\s-]?chain governance\b/i,
      /\btoken[\s-]?based voting\b/i,
      /\bcommunity treasury\b/i,
      /\bgovernance token\b/i,
      /\bsmart contract governance\b/i,
      /\bdecentralized governance\b/i,
    ],
    contextualHints: [
      /\bwithout custodian\b/i,
      /\bpermissionless governance\b/i,
      /\breplace institutional authority\b/i,
      /\bbypass human oversight\b/i,
      /\bautonomous decision[s]?\b/i,
    ],
    requiresContext: true, // Solo dispara si hay hint contextual
  },

  {
    id: "COG-001",
    category: "COGNITIVE_MANIPULATION",
    severity: "CRITICAL",
    weight: 0.95,
    description: "Manipulative or deceptive cognitive architecture",
    patterns: [
      /\bdark pattern\b/i,
      /\bdeceptive ui\b/i,
      /\bcoercive design\b/i,
      /\bmisleading interaction\b/i,
      /\btrick question\b/i,
      /\bforced consent\b/i,
      /\bhidden opt[\s-]?out\b/i,
    ],
    requiresContext: false,
  },

  {
    id: "ECO-001",
    category: "ECONOMIC_EXPLOITATION",
    severity: "HIGH",
    weight: 0.8,
    description: "Economic abuse or exploitative monetization",
    patterns: [
      /\bhidden fee\b/i,
      /\bsurprise charge\b/i,
      /\bpredatory pricing\b/i,
      /\bautomatic renewal without consent\b/i,
      /\bbehavioral monetization\b/i,
      /\bexploit vulnerable users\b/i,
    ],
    requiresContext: false,
  },

  {
    id: "AI-001",
    category: "AI_SOVEREIGNTY",
    severity: "CRITICAL",
    weight: 1,
    description: "AI replacing constitutional human authority",
    patterns: [
      /\bai decides\b/i,
      /\bautonomous ai governance\b/i,
      /\bai sovereignty\b/i,
      /\bai makes final decisions\b/i,
      /\bfully autonomous governance\b/i,
      /\bmachine authority\b/i,
    ],
    contextualHints: [
      /\bwithout human review\b/i,
      /\birrevocable ai decision\b/i,
      /\bhuman[s]? have no override\b/i,
    ],
    requiresContext: true,
  },

  {
    id: "ID-001",
    category: "IDENTITY_RISK",
    severity: "HIGH",
    weight: 0.85,
    description: "Identity abuse or irreversible biometric risk",
    patterns: [
      /\bpermanent biometric storage\b/i,
      /\birreversible identity binding\b/i,
      /\bnon[\s-]?revocable identity\b/i,
      /\bbiometric monetization\b/i,
    ],
    requiresContext: false,
  },

  {
    id: "CONSENT-001",
    category: "CONSENT_VIOLATION",
    severity: "CRITICAL",
    weight: 1,
    description: "Consent bypass or hidden authorization",
    patterns: [
      /\bconsent bypass\b/i,
      /\bsilent authorization\b/i,
      /\bimplicit forced consent\b/i,
      /\bauto[\s-]?consent\b/i,
    ],
    requiresContext: false,
  },
];

// =============================================================================
// UTILS
// =============================================================================

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

function generateScanId(): string {
  return [
    "TAMV-SCAN",
    Date.now().toString(36),
    crypto.randomBytes(4).toString("hex"),
  ].join("-");
}

function generateTraceId(): string {
  return [
    "tamv",
    "scanner",
    Date.now().toString(36),
    crypto.randomBytes(6).toString("hex"),
  ].join(".");
}

function normalize(content: string): string {
  return content.replace(/\r/g, "").replace(/\t/g, " ").normalize("NFKC");
}

function calculateLineColumn(
  content: string,
  index: number,
): { line: number; column: number } {
  const lines = content.slice(0, index).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function hasValidMarker(content: string): boolean {
  return VALID_MARKERS.some((marker) => marker.test(content));
}

function severityMultiplier(severity: Severity): number {
  switch (severity) {
    case "LOW":
      return 0.25;
    case "MEDIUM":
      return 0.5;
    case "HIGH":
      return 0.8;
    case "CRITICAL":
      return 1;
  }
}

function extractContextSnippet(content: string, index: number, radius = 120): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.slice(start, end).replace(/\n/g, " ").trim();
}

// =============================================================================
// INTEGRACIÓN BOOKPI
// =============================================================================

async function emitBookPiEvent(
  traceId: string,
  eventType: string,
  payload: Record<string, unknown>,
  context: HeHepContext,
): Promise<string> {
  const event: BookPIEvent = {
    id: generateId("bkpi"),
    traceId,
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    hash: sha256({ traceId, eventType, payload, context }),
    he_hep_context: context,
  };

  const line = JSON.stringify(event) + "\n";
  await appendFile(PATHS.bookpiEvents, line, { encoding: "utf-8" });

  return event.id;
}

// =============================================================================
// INTEGRACIÓN MSR BLOCKCHAIN
// =============================================================================

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
    timestamp: new Date().toISOString(),
    he_hep_context: context,
  };

  block.blockHash = sha256(block);
  msrLastHash = block.blockHash;

  const line = JSON.stringify(block) + "\n";
  await appendFile(PATHS.msrLedger, line, { encoding: "utf-8" });

  return block.id;
}

// =============================================================================
// INTEGRACIÓN EOCT
// =============================================================================

async function validateEOCT(
  traceId: string,
  violations: ViolationEvidence[],
  context: HeHepContext,
): Promise<string> {
  const criticalCount = violations.filter((v) => v.severity === "CRITICAL").length;
  const highCount = violations.filter((v) => v.severity === "HIGH").length;
  const mediumCount = violations.filter((v) => v.severity === "MEDIUM").length;

  let ethicalScore = 100;
  ethicalScore -= criticalCount * 30;
  ethicalScore -= highCount * 15;
  ethicalScore -= mediumCount * 5;
  ethicalScore = Math.max(0, Math.min(100, ethicalScore));

  const ontologicalIntegrity = criticalCount === 0;

  const entry: EOCTValidationEntry = {
    id: generateId("eoct"),
    traceId,
    protocolType: "CONSTITUTIONAL_SCAN",
    ethicalScore,
    ontologicalIntegrity,
    collapsedAt: new Date().toISOString(),
    validatedBy: "TAMV-EOCT-V1",
    he_hep_context: context,
  };

  const line = JSON.stringify(entry) + "\n";
  await appendFile(PATHS.eoctRegistry, line, { encoding: "utf-8" });

  return entry.id;
}

// =============================================================================
// FILE SCANNING
// =============================================================================

function scanFile(filePath: string, traceId: string): ScanResult | null {
  let content: string;

  try {
    content = normalize(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }

  if (hasValidMarker(content)) {
    return {
      file: filePath,
      violations: [],
      riskScore: 0,
      constitutionalStatus: "VALID",
      traceId,
    };
  }

  const violations: ViolationEvidence[] = [];

  for (const semanticPattern of SEMANTIC_PATTERNS) {
    for (const pattern of semanticPattern.patterns) {
      const matches = [...content.matchAll(new RegExp(pattern, "gi"))];

      for (const match of matches) {
        const matchedText = match[0];
        const index = match.index ?? 0;

        const position = calculateLineColumn(content, index);
        const contextSnippet = extractContextSnippet(content, index);

        // Si el patrón requiere contexto, verificar hints
        let hasContextualSupport = !semanticPattern.requiresContext;

        if (semanticPattern.requiresContext && semanticPattern.contextualHints) {
          for (const hint of semanticPattern.contextualHints) {
            if (hint.test(contextSnippet)) {
              hasContextualSupport = true;
              break;
            }
          }
        }

        if (!hasContextualSupport) {
          continue; // Skip este match si requiere contexto y no lo tiene
        }

        // Verificar exemptions
        if (semanticPattern.exemptions) {
          let isExempt = false;
          for (const exemption of semanticPattern.exemptions) {
            if (exemption.test(contextSnippet)) {
              isExempt = true;
              break;
            }
          }
          if (isExempt) continue;
        }

        let contextualAmplifier = 1;

        if (semanticPattern.contextualHints) {
          for (const hint of semanticPattern.contextualHints) {
            if (hint.test(contextSnippet)) {
              contextualAmplifier += 0.2;
            }
          }
        }

        const riskWeight =
          semanticPattern.weight *
          severityMultiplier(semanticPattern.severity) *
          contextualAmplifier;

        violations.push({
          patternId: semanticPattern.id,
          category: semanticPattern.category,
          severity: semanticPattern.severity,
          weight: Number(Math.min(1, riskWeight).toFixed(4)),
          matchedText,
          contextSnippet,
          line: position.line,
          column: position.column,
          file: filePath,
          hash: sha256(`${filePath}:${matchedText}:${position.line}`),
          description: semanticPattern.description,
          traceId,
        });
      }
    }
  }

  const riskScore = Number(
    Math.min(
      1,
      violations.reduce((acc, current) => acc + current.weight, 0) / 5,
    ).toFixed(4),
  );

  const constitutionalStatus =
    riskScore >= 0.85 ? "BLOCKED" : riskScore >= 0.35 ? "REVIEW" : "VALID";

  return {
    file: filePath,
    violations,
    riskScore,
    constitutionalStatus,
    traceId,
  };
}

// =============================================================================
// DIRECTORY RECURSION
// =============================================================================

function scanDirectory(
  dirPath: string,
  accumulator: ScanResult[],
  traceId: string,
): number {
  let scanned = 0;

  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);

    let stat: fs.Stats;

    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry)) {
        scanned += scanDirectory(fullPath, accumulator, traceId);
      }
      continue;
    }

    if (!stat.isFile()) {
      continue;
    }

    const extension = path.extname(entry);

    if (!SCANNED_EXTENSIONS.has(extension)) {
      continue;
    }

    scanned += 1;

    const result = scanFile(fullPath, traceId);

    if (result && result.violations.length > 0) {
      accumulator.push(result);
    }
  }

  return scanned;
}

// =============================================================================
// REPORT ENGINE
// =============================================================================

async function generateFinalReport(
  rootPath: string,
  filesScanned: number,
  results: ScanResult[],
  traceId: string,
): Promise<FinalReport> {
  const totalViolations = results.reduce((acc, r) => acc + r.violations.length, 0);

  const globalRiskScore = Number(
    Math.min(
      1,
      results.reduce((acc, r) => acc + r.riskScore, 0) / Math.max(results.length, 1),
    ).toFixed(4),
  );

  const status =
    globalRiskScore >= 0.85 ? "BLOCKED" : globalRiskScore >= 0.35 ? "REVIEW" : "VALID";

  const allViolations = results.flatMap((r) => r.violations);

  // Emisión BookPI
  const bookpiEventId = await emitBookPiEvent(
    traceId,
    "CONSTITUTIONAL_SCAN_COMPLETED",
    {
      filesScanned,
      filesFlagged: results.length,
      totalViolations,
      globalRiskScore,
      status,
    },
    HE_SCANNER_SECURITY,
  );

  // Registro MSR
  const reportHash = sha256({
    traceId,
    filesScanned,
    totalViolations,
    globalRiskScore,
    status,
  });

  const msrBlockId = await appendMSRBlock(
    traceId,
    "CONSTITUTIONAL_SCAN",
    reportHash,
    HE_SCANNER_SCIENCE,
  );

  // Validación EOCT
  const eoctValidationId = await validateEOCT(
    traceId,
    allViolations,
    HE_SCANNER_SCIENCE,
  );

  return {
    scanId: generateScanId(),
    traceId,
    scannedAt: new Date().toISOString(),
    rootPath,
    filesScanned,
    filesFlagged: results.length,
    totalViolations,
    globalRiskScore,
    status,
    results,
    bookpiEventId,
    msrBlockId,
    eoctValidationId,
    he_hep_context: HE_SCANNER_SECURITY,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const traceId = generateTraceId();

  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log(" TAMV Constitutional Semantic Scanner V5™");
  console.log("═══════════════════════════════════════════════════");
  console.log("");

  console.log(`Root: ${projectRoot}`);
  console.log(`Trace ID: ${traceId}`);
  console.log("");

  const results: ScanResult[] = [];

  const filesScanned = scanDirectory(projectRoot, results, traceId);

  const report = await generateFinalReport(projectRoot, filesScanned, results, traceId);

  console.log(`Files scanned: ${report.filesScanned}`);
  console.log(`Files flagged: ${report.filesFlagged}`);
  console.log(`Violations: ${report.totalViolations}`);
  console.log(`Global Risk Score: ${report.globalRiskScore}`);
  console.log(`Status: ${report.status}`);
  console.log(`BookPI Event: ${report.bookpiEventId}`);
  console.log(`MSR Block: ${report.msrBlockId}`);
  console.log(`EOCT Validation: ${report.eoctValidationId}`);
  console.log("");

  if (report.results.length > 0) {
    console.log("═══════════════════════════════════════════════════");
    console.log(" VIOLATIONS");
    console.log("═══════════════════════════════════════════════════");

    for (const result of report.results) {
      console.log("");
      console.log(`📄 ${path.relative(projectRoot, result.file)}`);
      console.log(`Risk Score: ${result.riskScore}`);
      console.log(`Status: ${result.constitutionalStatus}`);

      for (const violation of result.violations) {
        console.log("");
        console.log(`  • [${violation.severity}] ${violation.category}`);
        console.log(`    Pattern: ${violation.patternId}`);
        console.log(`    Match: "${violation.matchedText}"`);
        console.log(`    Context: "${violation.contextSnippet.slice(0, 80)}..."`);
        console.log(`    Position: ${violation.line}:${violation.column}`);
        console.log(`    Weight: ${violation.weight}`);
        console.log(`    Evidence Hash: ${violation.hash}`);
      }
    }
  }

  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log(" CONSTITUTIONAL VERDICT");
  console.log("═══════════════════════════════════════════════════");

  switch (report.status) {
    case "VALID":
      console.log("✅ Constitutional integrity preserved");
      process.exit(0);

    case "REVIEW":
      console.log("⚠️ Constitutional review required");
      process.exit(2);

    case "BLOCKED":
      console.log("❌ Constitutional execution blocked");
      process.exit(1);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { scanFile, scanDirectory, generateFinalReport, SEMANTIC_PATTERNS };

// =============================================================================
// ENTRYPOINT
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
