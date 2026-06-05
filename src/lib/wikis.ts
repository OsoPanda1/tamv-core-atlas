// Canonical wiki seed: 5 ingested repos from the TAMV ecosystem.
// Markdown bodies are loaded eagerly as raw strings via Vite glob import.
const RAW = import.meta.glob("../content/wikis/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface WikiDoc {
  slug: string;
  repo: string;
  title: string;
  description: string;
  lines: number;
  body: string;
}

const META: Record<string, { repo: string; title: string; description: string }> = {
  "analiza-este-lovable-tamv": {
    repo: "OsoPanda1/analiza-este-lovable-tamv",
    title: "Analiza Este · Lovable TAMV",
    description: "Documentación funcional y arquitectura SPA del módulo de análisis Lovable.",
  },
  "tamv-online-nextgen": {
    repo: "OsoPanda1/TAMV-ONLINE-NEXTGEN-1.0",
    title: "TAMV Online NextGen · DM-X4",
    description: "Ecosistema civilizatorio sintiente: Blockchain MSR, Isabella AI, 4D, Korima.",
  },
  "ecosistema-nextgen-tamv": {
    repo: "OsoPanda1/ecosistema-nextgen-tamv",
    title: "Ecosistema NextGen TAMV",
    description: "Infraestructura socio-técnica distribuida: marketplace, XR, IA ética, MSR.",
  },
  "tamv-atlas": {
    repo: "OsoPanda1/tamv-atlas",
    title: "TAMV Atlas · Federated Civilizational",
    description: "Monorepo full-stack: DIDs/PIDs, firmas criptográficas, federación de repos.",
  },
  "tamv-digital-nexus": {
    repo: "OsoPanda1/tamv-digital-nexus",
    title: "TAMV Digital Nexus · MD-X4",
    description: "Consolidación de 177 repos federados, 3D/XR, Isabella Prime, gobernanza.",
  },
};

// Newly fused docs from tamv-atlas-nextgen repository (Plataforma Territorial LTOS Real del Monte).
const NG_META = {
  "tamv-atlas-nextgen-readme": {
    repo: "OsoPanda1/Plataforma-Territorial-LTOS-REAL-DEL-MONTE",
    title: "TAMV Atlas NextGen · README",
    description: "Estado real del monorepo: frontend, backend, AtlasKernel, federación.",
  },
  "atlasng-repo_unification_playbook": {
    repo: "tamv-atlas-nextgen/docs",
    title: "Repo Unification Playbook",
    description: "Procedimiento canónico para descubrir, importar y federar repos OsoPanda1.",
  },
  "atlasng-rfc-0001-federation-module-freeze": {
    repo: "tamv-atlas-nextgen/docs/rfc",
    title: "RFC-0001 · Federation Module Freeze",
    description: "Congelación modular de federaciones y gobernanza de cambios.",
  },
  "atlasng-tamv-md-x4-integracion-schedra": {
    repo: "tamv-atlas-nextgen/docs",
    title: "TAMV MD-X4 · Integración Schedra",
    description: "Integración del scheduler Schedra con el runtime federado MD-X4.",
  },
  "atlasng-unified_01_platform_and_architecture": {
    repo: "tamv-atlas-nextgen/docs",
    title: "Unified 01 · Plataforma y Arquitectura",
    description: "Capítulo unificado de plataforma y arquitectura del ecosistema TAMV.",
  },
  "atlasng-unified_02_services_and_apis": {
    repo: "tamv-atlas-nextgen/docs",
    title: "Unified 02 · Servicios y APIs",
    description: "Catálogo unificado de servicios y contratos API del runtime.",
  },
  "atlasng-unified_03_governance_and_security": {
    repo: "tamv-atlas-nextgen/docs",
    title: "Unified 03 · Gobernanza y Seguridad",
    description: "Marco unificado de gobernanza, seguridad y postura antifrágil.",
  },
} as const;

Object.assign(META, NG_META);

export const WIKIS: WikiDoc[] = Object.entries(RAW)
  .map(([path, body]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const meta = META[slug] ?? { repo: slug, title: slug, description: "" };
    return {
      slug,
      repo: meta.repo,
      title: meta.title,
      description: meta.description,
      lines: body.split("\n").length,
      body,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function getWiki(slug: string): WikiDoc | undefined {
  return WIKIS.find((w) => w.slug === slug);
}
