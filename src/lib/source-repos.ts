import type { FederationId } from "./tamv-data";

export type RepositoryAccess = "embedded" | "remote" | "pending_network";
export type IntegrationState = "absorbed" | "mapped" | "quarantined";
export type HardeningState = "enforced" | "needs_review" | "blocked";

export interface SourceRepository {
  name: string;
  url: string;
  federation: FederationId;
  role: string;
  functionalPayload: string[];
  integrationState: IntegrationState;
  hardeningState: HardeningState;
  access: RepositoryAccess;
  notes: string;
}

export interface HardeningControl {
  id: string;
  title: string;
  owner: "EOCT" | "Anubis" | "Horus" | "Korima" | "BookPI";
  severity: "critical" | "high" | "medium";
  status: "active" | "review";
  evidence: string;
}

export const SOURCE_REPOSITORIES: SourceRepository[] = [
  {
    name: "tamv-atlas-nextgen",
    url: "https://github.com/OsoPanda1/tamv-atlas-nextgen.git",
    federation: "infra",
    role: "Atlas NextGen, manifiestos de federación, playbooks de unificación, esquemas OpenAPI/Avro e infraestructura Kubernetes.",
    functionalPayload: [
      "docs/UNIFIED_*",
      "scripts/unify_osopanda_repos.sh",
      "schemas/openapi-omni-3.1.json",
      "infra/k8s/*",
    ],
    integrationState: "absorbed",
    hardeningState: "enforced",
    access: "embedded",
    notes:
      "Existe como árbol local y aporta el protocolo operativo de importación por subárboles aislados.",
  },
  {
    name: "real-del-monte-atlas",
    url: "https://github.com/OsoPanda1/real-del-monte-atlas.git",
    federation: "identity",
    role: "Piloto territorial Real del Monte: identidad soberana, nodos cívicos y superficie de gemelo digital municipal.",
    functionalPayload: ["territorial atlas", "identity nodes", "municipal digital twin"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes:
      "Debe importarse en cuarentena de lectura antes de activar flujos de datos territoriales.",
  },
  {
    name: "oso-data-weaver",
    url: "https://github.com/OsoPanda1/oso-data-weaver.git",
    federation: "cognition",
    role: "Tejido de datos: normalización, extracción y ensamblaje semántico para pipelines multi-fuente.",
    functionalPayload: ["data normalization", "semantic weaving", "extract-transform pipelines"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes:
      "Se conecta al motor de ingesta sólo después de redacción de secretos y validación de esquema.",
  },
  {
    name: "tamv-atlas",
    url: "https://github.com/OsoPanda1/tamv-atlas.git",
    federation: "infra",
    role: "Atlas base: taxonomía canónica, grafo de assets y documentos de operación del atlas vivo.",
    functionalPayload: ["canonical taxonomy", "asset graph", "atlas docs"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes:
      "Debe reconciliarse con Atlas NextGen evitando colisiones de rutas y entidades duplicadas.",
  },
  {
    name: "tamv-the-federated-frontier",
    url: "https://github.com/OsoPanda1/tamv-the-federated-frontier.git",
    federation: "governance",
    role: "Frontera federada: reglas de gobernanza, contratos de frontera y doctrina de expansión heptafederada.",
    functionalPayload: ["federation policy", "frontier contracts", "governance doctrine"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes: "Su contenido modifica política; requiere revisión EOCT antes de merge canónico.",
  },
  {
    name: "genesis-digytamv-nexus",
    url: "https://github.com/OsoPanda1/genesis-digytamv-nexus.git",
    federation: "science",
    role: "Nexus Genesis: origen documental, trazas de ciencia abierta y conexión de artefactos a repositorios académicos.",
    functionalPayload: ["genesis docs", "open science traces", "knowledge nexus"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes: "Se trata como fuente de memoria canónica; no debe ejecutar código sin sandbox.",
  },
  {
    name: "tamv-orchestrator",
    url: "https://github.com/OsoPanda1/tamv-orchestrator.git",
    federation: "cognition",
    role: "Orquestador operativo: jobs, eventos, reintentos y coordinación entre capas del runtime.",
    functionalPayload: ["jobs", "event orchestration", "retry policies"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes:
      "Cualquier worker importado debe declarar límites, timeouts y salida auditable en BookPI.",
  },
  {
    name: "genesis-orchestrator",
    url: "https://github.com/OsoPanda1/genesis-orchestrator.git",
    federation: "cognition",
    role: "Orquestación semilla para bootstrap de flujos Genesis y coordinación de arranque del ecosistema.",
    functionalPayload: ["bootstrap flows", "genesis orchestration", "initializers"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes: "Debe ejecutarse únicamente como plantilla hasta tener pruebas de idempotencia.",
  },
  {
    name: "citemesh-roots",
    url: "https://github.com/OsoPanda1/citemesh-roots.git",
    federation: "infra",
    role: "Raíces CITEMESH: topología F2, nodos raíz y contratos de conectividad territorial.",
    functionalPayload: ["mesh roots", "F2 topology", "connectivity contracts"],
    integrationState: "mapped",
    hardeningState: "needs_review",
    access: "pending_network",
    notes: "Debe validarse contra NetworkPolicy, ingress y reglas de egress antes de despliegue.",
  },
];

export const HARDENING_CONTROLS: HardeningControl[] = [
  {
    id: "H-01",
    title: "Aislamiento por subárbol federado",
    owner: "EOCT",
    severity: "critical",
    status: "active",
    evidence:
      "Cada repo externo se absorbe bajo un prefijo dedicado y nunca sobrescribe código raíz sin revisión humana.",
  },
  {
    id: "H-02",
    title: "Cuarentena de fuentes no verificadas",
    owner: "Anubis",
    severity: "critical",
    status: "active",
    evidence:
      "Los repos con acceso pendiente quedan en estado mapped/needs_review y no alimentan ejecución productiva.",
  },
  {
    id: "H-03",
    title: "Trazabilidad BookPI obligatoria",
    owner: "BookPI",
    severity: "high",
    status: "active",
    evidence:
      "Toda importación requiere url, federación, payload funcional, notas y estado de hardening.",
  },
  {
    id: "H-04",
    title: "Validación ontológica previa al merge",
    owner: "Korima",
    severity: "high",
    status: "review",
    evidence:
      "Las colisiones de canon se resuelven antes de promover un módulo de mapped a absorbed.",
  },
  {
    id: "H-05",
    title: "Headers defensivos en SSR",
    owner: "Horus",
    severity: "medium",
    status: "active",
    evidence:
      "El servidor aplica headers anti-sniffing, anti-clickjacking, referrer minimizado y permisos restringidos.",
  },
];

export const SOURCE_REPO_KPI = {
  total: SOURCE_REPOSITORIES.length,
  absorbed: SOURCE_REPOSITORIES.filter((repo) => repo.integrationState === "absorbed").length,
  mapped: SOURCE_REPOSITORIES.filter((repo) => repo.integrationState === "mapped").length,
  enforced: SOURCE_REPOSITORIES.filter((repo) => repo.hardeningState === "enforced").length,
  pendingReview: SOURCE_REPOSITORIES.filter((repo) => repo.hardeningState === "needs_review")
    .length,
  controls: HARDENING_CONTROLS.length,
};

export function repositoriesByFederation(federation: FederationId) {
  return SOURCE_REPOSITORIES.filter((repo) => repo.federation === federation);
}
