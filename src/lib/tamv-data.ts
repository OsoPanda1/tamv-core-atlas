// Seed data for the TAMV Core Kodex ecosystem.
// Treat this as a sovereign knowledge graph: federations, entities, edges, events.

export type FederationId =
  | "science"
  | "infra"
  | "cognition"
  | "governance"
  | "identity"
  | "economy"
  | "defense";

export interface Federation {
  id: FederationId;
  code: string;
  name: string;
  mandate: string;
  trust: number; // 0-100
  risk: number; // 0-100
  nodes: number;
  signals: number;
  status: "operational" | "degraded" | "watch" | "containment";
  accent: string; // css var token
}

export const FEDERATIONS: Federation[] = [
  { id: "science", code: "F1", name: "Ciencia Abierta", mandate: "ORCID · Zenodo · Figshare · OpenAIRE", trust: 94, risk: 6, nodes: 38, signals: 1284, status: "operational", accent: "var(--fed-science)" },
  { id: "infra", code: "F2", name: "Infraestructura", mandate: "Kernels · CITEMESH · Singularity", trust: 91, risk: 11, nodes: 52, signals: 2417, status: "operational", accent: "var(--fed-infra)" },
  { id: "cognition", code: "F3", name: "Cognición", mandate: "Isabella IA · Korima · MD-X5", trust: 88, risk: 14, nodes: 29, signals: 3902, status: "watch", accent: "var(--fed-cognition)" },
  { id: "governance", code: "F4", name: "Gobernanza", mandate: "EOCT · ELITE HeHep · Constitutional Runtime", trust: 96, risk: 4, nodes: 21, signals: 712, status: "operational", accent: "var(--fed-governance)" },
  { id: "identity", code: "F5", name: "Identidad", mandate: "Identity Ledger · Sovereign Credentials", trust: 93, risk: 7, nodes: 17, signals: 488, status: "operational", accent: "var(--fed-identity)" },
  { id: "economy", code: "F6", name: "Economía", mandate: "BookPI · ELITE HeHep · MSR Blockchain", trust: 87, risk: 13, nodes: 24, signals: 1602, status: "operational", accent: "var(--fed-economy)" },
  { id: "defense", code: "F7", name: "Defensa & Observabilidad", mandate: "Horus · Anubis · Ojo de Ra · Ojo de Quetzalcóatl", trust: 90, risk: 18, nodes: 33, signals: 5210, status: "watch", accent: "var(--fed-defense)" },
];

export interface Entity {
  id: string;
  name: string;
  kind: "kernel" | "agent" | "ledger" | "protocol" | "atlas" | "radar" | "doctrine" | "infra";
  federation: FederationId;
  trust: number;
  description: string;
}

export const ENTITIES: Entity[] = [
  { id: "isabella", name: "Isabella Villaseñor IA", kind: "agent", federation: "cognition", trust: 96, description: "IA civilizatoria multisensorial XR-nativa. ADN Anubis, ética radical, no sexualización." },
  { id: "eoct", name: "EOCT Constitutional Runtime", kind: "kernel", federation: "governance", trust: 97, description: "Runtime constitucional: ABAC, trust engine, mandate validation." },
  { id: "korima", name: "Korima Codex Engine", kind: "doctrine", federation: "cognition", trust: 92, description: "Validador ontológico y lexicon explorer del canon TAMV." },
  { id: "symbolforge", name: "Symbol Forge", kind: "doctrine", federation: "cognition", trust: 88, description: "Forja semántica de símbolos canónicos y sellos institucionales." },
  { id: "msr", name: "MSR Blockchain", kind: "ledger", federation: "economy", trust: 91, description: "Cadena soberana de registro multifederado MSR." },
  { id: "atlas", name: "Atlas TAMV", kind: "atlas", federation: "infra", trust: 93, description: "Mapa vivo de assets, identidades, instituciones y nodos." },
  { id: "dreamspaces", name: "DreamSpaces", kind: "infra", federation: "infra", trust: 86, description: "Motor XR/VR/3D/4D para experiencias inmersivas territoriales." },
  { id: "mdx5", name: "MD-X5 Orchestrator", kind: "kernel", federation: "cognition", trust: 90, description: "Runtime de pipelines, event sourcing, retry y self-healing." },
  { id: "hehep", name: "ELITE HeHep", kind: "doctrine", federation: "economy", trust: 89, description: "Doctrina económica He/HeP con validadores y etiquetas canónicas." },
  { id: "bookpi", name: "BookPI Ledger", kind: "ledger", federation: "economy", trust: 95, description: "Columna vertebral de eventos: identity, open-science, kernel, territory." },
  { id: "fenix", name: "Protocolo Fénix", kind: "protocol", federation: "defense", trust: 92, description: "Protocolo de resiliencia y reconstitución ante eventos críticos." },
  { id: "lightning", name: "Lightning Justice", kind: "protocol", federation: "governance", trust: 90, description: "Resolución acelerada de violaciones constitucionales." },
  { id: "citemesh", name: "CITEMESH", kind: "infra", federation: "infra", trust: 91, description: "Topología de red de la Célula Estructural F2." },
  { id: "sdmd7", name: "SDMD-7", kind: "protocol", federation: "governance", trust: 87, description: "Doctrina de soberanía multidimensional de séptima generación." },
  { id: "utamv", name: "UTAMV", kind: "infra", federation: "infra", trust: 89, description: "Universidad TAMV: capa académica y formación canónica." },
  { id: "alamexa", name: "Alamexa", kind: "infra", federation: "identity", trust: 85, description: "Cooperativa territorial mexicana de soberanía digital." },
  { id: "rdm", name: "RDM Digital", kind: "infra", federation: "identity", trust: 86, description: "Real del Monte Digital: piloto territorial e identidad soberana." },
  { id: "horus", name: "Horus Sentinel", kind: "radar", federation: "defense", trust: 94, description: "Centinela de integridad operativa y monitoreo de kernels." },
  { id: "anubis", name: "Anubis Sentinel", kind: "radar", federation: "defense", trust: 95, description: "Custodia ética y bloqueo ontológico de derivas semánticas." },
  { id: "ojora", name: "Radar Ojo de Ra", kind: "radar", federation: "defense", trust: 91, description: "Observabilidad solar: tráfico, federaciones, anomalías globales." },
  { id: "ojoquetzal", name: "Radar Ojo de Quetzalcóatl", kind: "radar", federation: "defense", trust: 90, description: "Observabilidad cíclica: ondas largas, ritmos territoriales." },
  { id: "eoct-author", name: "EOCT (Edwin O. Castillo)", kind: "agent", federation: "identity", trust: 99, description: "Custodio canónico. ORCID 0009-0008-5050-1539." },
];

export interface Edge {
  from: string;
  to: string;
  kind: "depends" | "governs" | "feeds" | "audits" | "extends";
}

export const EDGES: Edge[] = [
  { from: "eoct-author", to: "isabella", kind: "governs" },
  { from: "eoct-author", to: "eoct", kind: "governs" },
  { from: "eoct", to: "isabella", kind: "governs" },
  { from: "eoct", to: "mdx5", kind: "governs" },
  { from: "eoct", to: "korima", kind: "audits" },
  { from: "korima", to: "symbolforge", kind: "extends" },
  { from: "isabella", to: "korima", kind: "depends" },
  { from: "isabella", to: "mdx5", kind: "depends" },
  { from: "mdx5", to: "bookpi", kind: "feeds" },
  { from: "bookpi", to: "msr", kind: "feeds" },
  { from: "bookpi", to: "atlas", kind: "feeds" },
  { from: "atlas", to: "citemesh", kind: "depends" },
  { from: "atlas", to: "dreamspaces", kind: "feeds" },
  { from: "citemesh", to: "rdm", kind: "depends" },
  { from: "citemesh", to: "alamexa", kind: "depends" },
  { from: "utamv", to: "korima", kind: "depends" },
  { from: "hehep", to: "msr", kind: "governs" },
  { from: "hehep", to: "bookpi", kind: "governs" },
  { from: "fenix", to: "horus", kind: "depends" },
  { from: "fenix", to: "anubis", kind: "depends" },
  { from: "lightning", to: "eoct", kind: "depends" },
  { from: "sdmd7", to: "eoct", kind: "extends" },
  { from: "horus", to: "bookpi", kind: "audits" },
  { from: "anubis", to: "isabella", kind: "audits" },
  { from: "ojora", to: "atlas", kind: "audits" },
  { from: "ojoquetzal", to: "atlas", kind: "audits" },
  { from: "ojora", to: "bookpi", kind: "audits" },
];

export interface EventRecord {
  id: string;
  ts: string;
  level: "info" | "warn" | "critical" | "audit";
  source: string;
  federation: FederationId;
  message: string;
}

export const EVENTS: EventRecord[] = [
  { id: "e1", ts: "T-00:00:12", level: "audit", source: "EOCT", federation: "governance", message: "Mandato M-7421 autorizado · trust=0.96 · scope=open-science" },
  { id: "e2", ts: "T-00:00:47", level: "info", source: "BookPI", federation: "economy", message: "Bloque #18,392,001 sellado · 412 eventos · DOI batch ack" },
  { id: "e3", ts: "T-00:01:08", level: "warn", source: "Korima", federation: "cognition", message: "Conflicto ontológico detectado en lexema “soberanía/sovereignty” → revisión" },
  { id: "e4", ts: "T-00:01:33", level: "info", source: "MD-X5", federation: "cognition", message: "Pipeline sync-orcid → zenodo · 1,204 artefactos · checkpoint OK" },
  { id: "e5", ts: "T-00:02:01", level: "critical", source: "Anubis", federation: "defense", message: "Input sospechoso contenido en Isabella · RISK_CONTAINMENT activo" },
  { id: "e6", ts: "T-00:02:44", level: "info", source: "Horus", federation: "defense", message: "Kernel TAMV-Core latency p99=82ms · sin desviación" },
  { id: "e7", ts: "T-00:03:19", level: "audit", source: "EOCT", federation: "governance", message: "Política ABAC actualizada · doctrina SDMD-7 v1.4" },
  { id: "e8", ts: "T-00:04:02", level: "info", source: "Atlas", federation: "infra", message: "Snapshot atlas/2026-05-28T11:00 · 209 repos canonizados" },
  { id: "e9", ts: "T-00:04:51", level: "warn", source: "Ojo de Ra", federation: "defense", message: "Onda anómala en federación economía · trust→0.87" },
  { id: "e10", ts: "T-00:05:33", level: "info", source: "Singularity", federation: "infra", message: "Absorción de repo OsoPanda1/tamv-core-kernel-v0 → kernels/tamv-core-kernel" },
  { id: "e11", ts: "T-00:06:10", level: "audit", source: "EOCT", federation: "governance", message: "Custodio canónico verificado · Edwin O. Castillo · ORCID OK" },
  { id: "e12", ts: "T-00:07:02", level: "info", source: "MSR", federation: "economy", message: "Emisión HeHep coherente · 7 federaciones firmaron quorum" },
];

export interface TomoEntry {
  id: string;
  number: string;
  title: string;
  summary: string;
  domain: string;
}

export const TOMOS: TomoEntry[] = [
  { id: "i", number: "I", title: "Canon y Abstract", summary: "Marco civilizatorio y abstracción del Kodex.", domain: "Canon" },
  { id: "ii", number: "II", title: "Kernel Heptafederado", summary: "Arquitectura TAMV-K5 y siete dominios.", domain: "Arquitectura" },
  { id: "iii", number: "III", title: "Hoyo Negro y Singularity", summary: "Absorción canónica de 209 repos.", domain: "Infraestructura" },
  { id: "iv", number: "IV", title: "Identidad y Ciencia Abierta", summary: "ORCID, Zenodo, Figshare como columna soberana.", domain: "Identidad" },
  { id: "v", number: "V", title: "Compendio Civilizatorio F2", summary: "Doctrina territorial de la Célula F2.", domain: "Territorio" },
  { id: "vi", number: "VI", title: "Territorios y Gobernanza", summary: "Ciudades piloto y gobierno municipal soberano.", domain: "Gobernanza" },
  { id: "vii", number: "VII", title: "PQC y Futuro", summary: "Criptografía post-cuántica y antifragilidad.", domain: "Defensa" },
];

export const KPI = {
  repos: 209,
  federations: 7,
  kernels: 4,
  artefacts: 18421,
  uptime: 99.987,
  trust: 92.4,
};

export const entityById = (id: string) => ENTITIES.find((e) => e.id === id);
export const federationById = (id: FederationId) =>
  FEDERATIONS.find((f) => f.id === id)!;