// TAMV Atlas Core™ — CSP-α seed data.
// Capa de datos simulada lista para cablear NestJS / Neo4j / Qdrant / BookPI real.

import type { FederationId } from "./tamv-data";

export type CanonType =
  | "protocol"
  | "service"
  | "document"
  | "ai"
  | "ledger"
  | "guardian"
  | "doctrine"
  | "module"
  | "node";

export interface CanonEntity {
  id: string; // TAMV.FED.IDENTITY.IDNVIDA.V1
  canonicalId: string;
  type: CanonType;
  federation: FederationId;
  description: string;
  dependencies: string[];
  sourceRefs: string[];
  hash: string; // sha256-12
  canonical: boolean;
  createdAt: string;
}

export interface IngestionSource {
  id: string;
  url: string;
  kind: "github" | "zenodo" | "manifest" | "webhook" | "pdf";
  federation: FederationId;
  status: "ingested" | "running" | "queued" | "failed";
  files: number;
  entitiesExtracted: number;
  lastRun: string;
  traceId: string;
}

export interface BookPiEvent {
  id: string;
  ts: string;
  eventType: "INGESTION" | "CANONIZATION" | "PROJECTION" | "ASSEMBLY" | "CONFLICT" | "MERGE";
  entityId: string;
  hash: string;
  source: string;
  traceId: string;
}

export interface OntologyEdge {
  from: string;
  to: string;
  kind: "DEPENDS_ON" | "VALIDATED_BY" | "PERSISTS_TO" | "PROTECTED_BY" | "EXTENDS";
}

export interface AssemblySpec {
  id: string;
  target: string;
  image: string;
  env: Record<string, string>;
  dependsOn: string[];
  ports: number[];
}

export const CANON_ENTITIES: CanonEntity[] = [
  {
    id: "TAMV.COG.AI.ISABELLA.V1",
    canonicalId: "IsabellaAI",
    type: "ai",
    federation: "cognition",
    description: "IA civilizatoria multisensorial XR-nativa. ADN Anubis, ética radical.",
    dependencies: ["TAMV.GOV.PROTO.EOCT.V1", "TAMV.COG.DOC.KORIMA.V1"],
    sourceRefs: ["github://OsoPanda1/isabella-core", "zenodo://10.5281/zenodo.19436662"],
    hash: "9a4f6c1e8b22",
    canonical: true,
    createdAt: "2026-05-12T11:04:00Z",
  },
  {
    id: "TAMV.GOV.PROTO.EOCT.V1",
    canonicalId: "EOCT",
    type: "protocol",
    federation: "governance",
    description: "Constitutional Runtime: ABAC, trust engine, mandate validation.",
    dependencies: [],
    sourceRefs: ["github://OsoPanda1/eoct-runtime"],
    hash: "c1b87a3041ff",
    canonical: true,
    createdAt: "2026-05-09T08:32:00Z",
  },
  {
    id: "TAMV.COG.DOC.KORIMA.V1",
    canonicalId: "KorimaCodex",
    type: "doctrine",
    federation: "cognition",
    description: "Validador ontológico y lexicon explorer del canon TAMV.",
    dependencies: ["TAMV.GOV.PROTO.EOCT.V1"],
    sourceRefs: ["github://OsoPanda1/korima-codex"],
    hash: "f0e2d8b4a019",
    canonical: true,
    createdAt: "2026-05-10T15:10:00Z",
  },
  {
    id: "TAMV.ECO.LEDGER.BOOKPI.V1",
    canonicalId: "BookPI",
    type: "ledger",
    federation: "economy",
    description: "Ledger append-only de eventos canon. Trace + hash + entityId.",
    dependencies: ["TAMV.GOV.PROTO.EOCT.V1"],
    sourceRefs: ["github://OsoPanda1/bookpi-ledger"],
    hash: "7d29ac51e604",
    canonical: true,
    createdAt: "2026-05-11T02:18:00Z",
  },
  {
    id: "TAMV.DEF.GUARD.ANUBIS.V1",
    canonicalId: "Anubis",
    type: "guardian",
    federation: "defense",
    description: "Custodia ética. Bloqueo ontológico de derivas semánticas.",
    dependencies: ["TAMV.ECO.LEDGER.BOOKPI.V1"],
    sourceRefs: ["github://OsoPanda1/anubis-sentinel"],
    hash: "44a91bf3c780",
    canonical: true,
    createdAt: "2026-05-13T09:55:00Z",
  },
  {
    id: "TAMV.DEF.GUARD.HORUS.V1",
    canonicalId: "Horus",
    type: "guardian",
    federation: "defense",
    description: "Sentinel de integridad operativa y monitoreo de kernels.",
    dependencies: ["TAMV.ECO.LEDGER.BOOKPI.V1"],
    sourceRefs: ["github://OsoPanda1/horus-sentinel"],
    hash: "8b7c5d12af30",
    canonical: true,
    createdAt: "2026-05-13T10:12:00Z",
  },
  {
    id: "TAMV.COG.MOD.MDX5.V1",
    canonicalId: "MD-X5",
    type: "module",
    federation: "cognition",
    description: "Runtime de pipelines, event sourcing, retry y self-healing.",
    dependencies: ["TAMV.ECO.LEDGER.BOOKPI.V1"],
    sourceRefs: ["github://OsoPanda1/mdx5-orchestrator"],
    hash: "23e8419bd5a1",
    canonical: true,
    createdAt: "2026-05-12T18:40:00Z",
  },
  {
    id: "TAMV.INF.NODE.RDM.V1",
    canonicalId: "RDMNodeZero",
    type: "node",
    federation: "infra",
    description: "Piloto territorial Real del Monte. Nodo cero soberano.",
    dependencies: ["TAMV.COG.AI.ISABELLA.V1", "TAMV.ECO.LEDGER.BOOKPI.V1", "TAMV.DEF.GUARD.ANUBIS.V1"],
    sourceRefs: ["github://OsoPanda1/rdm-node-zero"],
    hash: "61aa37e0fbc9",
    canonical: true,
    createdAt: "2026-05-15T07:22:00Z",
  },
  {
    id: "TAMV.IDN.SERV.ATLAS.V1",
    canonicalId: "AtlasUI",
    type: "service",
    federation: "identity",
    description: "Visualizador de grafo, ledger y estado del kernel.",
    dependencies: ["TAMV.ECO.LEDGER.BOOKPI.V1"],
    sourceRefs: ["github://OsoPanda1/atlas-ui"],
    hash: "9c20b8775edd",
    canonical: true,
    createdAt: "2026-05-14T12:00:00Z",
  },
];

export const ONTOLOGY_EDGES: OntologyEdge[] = [
  { from: "TAMV.COG.AI.ISABELLA.V1", to: "TAMV.GOV.PROTO.EOCT.V1", kind: "DEPENDS_ON" },
  { from: "TAMV.COG.AI.ISABELLA.V1", to: "TAMV.COG.DOC.KORIMA.V1", kind: "VALIDATED_BY" },
  { from: "TAMV.COG.AI.ISABELLA.V1", to: "TAMV.DEF.GUARD.ANUBIS.V1", kind: "PROTECTED_BY" },
  { from: "TAMV.COG.AI.ISABELLA.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "PERSISTS_TO" },
  { from: "TAMV.COG.DOC.KORIMA.V1", to: "TAMV.GOV.PROTO.EOCT.V1", kind: "DEPENDS_ON" },
  { from: "TAMV.COG.MOD.MDX5.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "PERSISTS_TO" },
  { from: "TAMV.DEF.GUARD.HORUS.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "PERSISTS_TO" },
  { from: "TAMV.DEF.GUARD.ANUBIS.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "PERSISTS_TO" },
  { from: "TAMV.INF.NODE.RDM.V1", to: "TAMV.COG.AI.ISABELLA.V1", kind: "DEPENDS_ON" },
  { from: "TAMV.INF.NODE.RDM.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "DEPENDS_ON" },
  { from: "TAMV.INF.NODE.RDM.V1", to: "TAMV.DEF.GUARD.ANUBIS.V1", kind: "PROTECTED_BY" },
  { from: "TAMV.IDN.SERV.ATLAS.V1", to: "TAMV.ECO.LEDGER.BOOKPI.V1", kind: "DEPENDS_ON" },
];

export const INGESTION_SOURCES: IngestionSource[] = [
  { id: "ing-001", url: "github://OsoPanda1/isabella-core", kind: "github", federation: "cognition", status: "ingested", files: 142, entitiesExtracted: 18, lastRun: "T-00:04:21", traceId: "repo.ingestion-7m2x4a" },
  { id: "ing-002", url: "github://OsoPanda1/eoct-runtime", kind: "github", federation: "governance", status: "ingested", files: 88, entitiesExtracted: 11, lastRun: "T-00:09:48", traceId: "repo.ingestion-7m1p9b" },
  { id: "ing-003", url: "github://OsoPanda1/bookpi-ledger", kind: "github", federation: "economy", status: "ingested", files: 64, entitiesExtracted: 9, lastRun: "T-00:12:02", traceId: "repo.ingestion-7m0kq2" },
  { id: "ing-004", url: "github://OsoPanda1/rdm-node-zero", kind: "github", federation: "infra", status: "running", files: 211, entitiesExtracted: 24, lastRun: "T-00:00:14", traceId: "repo.ingestion-7m3z8f" },
  { id: "ing-005", url: "zenodo://10.5281/zenodo.19436662", kind: "zenodo", federation: "science", status: "ingested", files: 6, entitiesExtracted: 6, lastRun: "T-00:22:55", traceId: "doc.ingestion-7m2a1c" },
  { id: "ing-006", url: "manifest://heptafed.yaml", kind: "manifest", federation: "governance", status: "queued", files: 1, entitiesExtracted: 0, lastRun: "—", traceId: "manifest-7m4r2d" },
  { id: "ing-007", url: "webhook://github/push#main", kind: "webhook", federation: "infra", status: "ingested", files: 3, entitiesExtracted: 2, lastRun: "T-00:01:09", traceId: "wh-7m3v0e" },
  { id: "ing-008", url: "github://OsoPanda1/anubis-sentinel", kind: "github", federation: "defense", status: "failed", files: 0, entitiesExtracted: 0, lastRun: "T-00:31:42", traceId: "repo.ingestion-7lx88a" },
];

export const BOOKPI_EVENTS: BookPiEvent[] = [
  { id: "bp-1801", ts: "T-00:00:08", eventType: "INGESTION", entityId: "TAMV.INF.NODE.RDM.V1", hash: "61aa37e0fbc9", source: "github://OsoPanda1/rdm-node-zero/README.md", traceId: "repo.ingestion-7m3z8f" },
  { id: "bp-1800", ts: "T-00:00:21", eventType: "CANONIZATION", entityId: "TAMV.INF.NODE.RDM.V1", hash: "61aa37e0fbc9", source: "canon-registry", traceId: "repo.ingestion-7m3z8f" },
  { id: "bp-1799", ts: "T-00:00:42", eventType: "PROJECTION", entityId: "TAMV.INF.NODE.RDM.V1", hash: "61aa37e0fbc9", source: "neo4j://tamv-graph", traceId: "repo.ingestion-7m3z8f" },
  { id: "bp-1798", ts: "T-00:01:11", eventType: "INGESTION", entityId: "TAMV.COG.AI.ISABELLA.V1", hash: "9a4f6c1e8b22", source: "github://OsoPanda1/isabella-core/package.json", traceId: "repo.ingestion-7m2x4a" },
  { id: "bp-1797", ts: "T-00:01:48", eventType: "ASSEMBLY", entityId: "TAMV.INF.NODE.RDM.V1", hash: "a08c12fe44b7", source: "self-assembly", traceId: "assembly-7m4y1z" },
  { id: "bp-1796", ts: "T-00:02:32", eventType: "CONFLICT", entityId: "TAMV.COG.DOC.KORIMA.V1", hash: "f0e2d8b4a019", source: "korima-validator", traceId: "validation-7m1k02" },
  { id: "bp-1795", ts: "T-00:03:04", eventType: "MERGE", entityId: "TAMV.COG.DOC.KORIMA.V1", hash: "f0e2d8b4a019", source: "isabella-analyst", traceId: "merge-7m1k15" },
  { id: "bp-1794", ts: "T-00:03:55", eventType: "CANONIZATION", entityId: "TAMV.GOV.PROTO.EOCT.V1", hash: "c1b87a3041ff", source: "canon-registry", traceId: "repo.ingestion-7m1p9b" },
  { id: "bp-1793", ts: "T-00:04:40", eventType: "PROJECTION", entityId: "TAMV.DEF.GUARD.HORUS.V1", hash: "8b7c5d12af30", source: "neo4j://tamv-graph", traceId: "repo.ingestion-7m0v8c" },
  { id: "bp-1792", ts: "T-00:05:18", eventType: "INGESTION", entityId: "TAMV.ECO.LEDGER.BOOKPI.V1", hash: "7d29ac51e604", source: "github://OsoPanda1/bookpi-ledger/README.md", traceId: "repo.ingestion-7m0kq2" },
  { id: "bp-1791", ts: "T-00:06:02", eventType: "ASSEMBLY", entityId: "TAMV.COG.MOD.MDX5.V1", hash: "9912ab23cd14", source: "self-assembly", traceId: "assembly-7m3x09" },
  { id: "bp-1790", ts: "T-00:07:21", eventType: "PROJECTION", entityId: "TAMV.COG.AI.ISABELLA.V1", hash: "9a4f6c1e8b22", source: "neo4j://tamv-graph", traceId: "repo.ingestion-7m2x4a" },
];

export const RDM_ASSEMBLY: AssemblySpec[] = [
  {
    id: "tamv-gov-proto-eoct-v1",
    target: "TAMV.GOV.PROTO.EOCT.V1",
    image: "tamv/eoct-runtime:1.4.0",
    env: { TAMV_FEDERATION: "governance", TAMV_HASH: "c1b87a3041ff" },
    dependsOn: [],
    ports: [8443],
  },
  {
    id: "tamv-eco-ledger-bookpi-v1",
    target: "TAMV.ECO.LEDGER.BOOKPI.V1",
    image: "tamv/bookpi-ledger:0.9.2",
    env: { TAMV_FEDERATION: "economy", TAMV_HASH: "7d29ac51e604" },
    dependsOn: ["tamv-gov-proto-eoct-v1"],
    ports: [8500],
  },
  {
    id: "tamv-def-guard-anubis-v1",
    target: "TAMV.DEF.GUARD.ANUBIS.V1",
    image: "tamv/anubis-sentinel:0.7.1",
    env: { TAMV_FEDERATION: "defense", TAMV_HASH: "44a91bf3c780" },
    dependsOn: ["tamv-eco-ledger-bookpi-v1"],
    ports: [8600],
  },
  {
    id: "tamv-cog-ai-isabella-v1",
    target: "TAMV.COG.AI.ISABELLA.V1",
    image: "tamv/isabella-core:2.1.0",
    env: { TAMV_FEDERATION: "cognition", TAMV_HASH: "9a4f6c1e8b22" },
    dependsOn: ["tamv-gov-proto-eoct-v1", "tamv-def-guard-anubis-v1"],
    ports: [9000, 9001],
  },
  {
    id: "tamv-inf-node-rdm-v1",
    target: "TAMV.INF.NODE.RDM.V1",
    image: "tamv/rdm-node-zero:0.4.0",
    env: { TAMV_FEDERATION: "infra", TAMV_HASH: "61aa37e0fbc9", TAMV_TERRITORY: "real-del-monte" },
    dependsOn: ["tamv-cog-ai-isabella-v1", "tamv-eco-ledger-bookpi-v1", "tamv-def-guard-anubis-v1"],
    ports: [80, 443],
  },
];

export function renderComposeYaml(specs: AssemblySpec[]): string {
  const lines: string[] = ["version: \"3.9\"", "services:"];
  for (const s of specs) {
    lines.push(`  ${s.id}:`);
    lines.push(`    image: ${s.image}`);
    lines.push(`    environment:`);
    for (const [k, v] of Object.entries(s.env)) lines.push(`      ${k}: "${v}"`);
    if (s.dependsOn.length) {
      lines.push(`    depends_on:`);
      for (const d of s.dependsOn) lines.push(`      - ${d}`);
    }
    if (s.ports.length) {
      lines.push(`    ports:`);
      for (const p of s.ports) lines.push(`      - "${p}:${p}"`);
    }
  }
  return lines.join("\n");
}

export const CSP_KPI = {
  reposIngested: 14,
  canonEntities: CANON_ENTITIES.length,
  ontologyEdges: ONTOLOGY_EDGES.length,
  bookpiEvents: 18421,
  pendingConflicts: 3,
  assemblies: 4,
};

export const canonById = (id: string) => CANON_ENTITIES.find((c) => c.id === id);