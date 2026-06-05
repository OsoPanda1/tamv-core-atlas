import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Boxes, Database, GitBranch, Layers, Network, Workflow } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/common/Panel";
import { BOOKPI_EVENTS, CANON_ENTITIES, CSP_KPI } from "@/lib/csp-data";
import { FEDERATIONS } from "@/lib/tamv-data";

export const Route = createFileRoute("/csp/")({
  head: () => ({
    meta: [
      { title: "TAMV Atlas Core™ · CSP-α" },
      {
        name: "description",
        content:
          "Núcleo proto-cognitivo federado: ingesta, canon, grafo ontológico, BookPI y self-assembly.",
      },
      { property: "og:title", content: "Atlas Core · CSP-α" },
      { property: "og:description", content: "Sistema nervioso distribuido del ecosistema TAMV." },
    ],
  }),
  component: CspOverview,
});

const LAYERS = [
  {
    n: "0",
    title: "Semantic Ingestion Engine",
    icon: Layers,
    to: "/csp/ingestion",
    desc: "Repos, manifests, PDFs, webhooks. Pre-clasificación canónica.",
  },
  {
    n: "1",
    title: "Canon Registry Engine",
    icon: Database,
    to: "/csp/canon",
    desc: "Caos → canon. ID, tipo, federación, hash, dependencias.",
  },
  {
    n: "2",
    title: "Ontological Graph Engine",
    icon: GitBranch,
    to: "/csp/ontology",
    desc: "Neo4j-compatible: DEPENDS_ON · VALIDATED_BY · PROTECTED_BY.",
  },
  {
    n: "3",
    title: "Memory — BookPI Ledger",
    icon: Network,
    to: "/events",
    desc: "Append-only event ledger con traceId + hash + entityId.",
  },
  {
    n: "4",
    title: "Self-Assembly Engine",
    icon: Workflow,
    to: "/csp/assembly",
    desc: "Federation Compiler™ → docker-compose ejecutable.",
  },
];

function CspOverview() {
  return (
    <div>
      <PageHeader
        eyebrow="TAMV ATLAS CORE™ · CSP-α"
        title="Núcleo proto-cognitivo federado"
        description="Médula espinal del ecosistema TAMV. Cinco capas operativas (0-5) absorbiendo fuentes heterogéneas, canonizando entidades, proyectando grafo vivo y ensamblando topologías ejecutables bajo presión federada."
      >
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground rounded-sm border border-border bg-card px-2.5 py-1.5">
          Build · No-toy · Estrés real TAMV-K5
        </span>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat
            label="REPOS INGESTED"
            value={CSP_KPI.reposIngested}
            hint="GitHub · Zenodo · manifests"
          />
          <Stat
            label="CANON ENTITIES"
            value={CSP_KPI.canonEntities}
            delta="+3"
            hint="canonical=true"
          />
          <Stat label="ONTOLOGY EDGES" value={CSP_KPI.ontologyEdges} hint="Neo4j-compatible" />
          <Stat
            label="BOOKPI EVENTS"
            value={CSP_KPI.bookpiEvents.toLocaleString()}
            hint="append-only ledger"
          />
          <Stat
            label="PENDING CONFLICTS"
            value={CSP_KPI.pendingConflicts}
            hint="korima-validator"
          />
          <Stat label="ASSEMBLIES" value={CSP_KPI.assemblies} hint="self-assembly runs" />
        </div>

        <Panel eyebrow="ARCHITECTURE · LAYERS 0–5" title="Capas operativas concretadas">
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {LAYERS.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.n}>
                  <Link
                    to={l.to}
                    className="group flex flex-col h-full rounded-sm border border-border bg-card/40 p-4 hover:bg-secondary/40 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        CAPA {l.n}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium tracking-tight">{l.title}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{l.desc}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel
            eyebrow="CANON · LATEST"
            title="Entidades canonizadas"
            bodyClassName="p-0"
            className="xl:col-span-2"
          >
            <ul className="divide-y divide-border">
              {CANON_ENTITIES.slice(0, 6).map((c) => (
                <li key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <Boxes className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground truncate w-[260px]">
                    {c.id}
                  </span>
                  <span className="text-xs flex-1 truncate text-foreground/85">
                    {c.description}
                  </span>
                  <span className="mono text-[10px] text-muted-foreground tabular">{c.hash}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel eyebrow="BOOKPI · TAIL" title="Últimos eventos" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {BOOKPI_EVENTS.slice(0, 6).map((e) => (
                <li key={e.id} className="px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="mono text-[10px] text-muted-foreground tabular w-16">
                      {e.ts}
                    </span>
                    <span className="mono text-[10px] uppercase tracking-wider text-accent w-24">
                      {e.eventType}
                    </span>
                  </div>
                  <div className="mono text-[10px] text-muted-foreground truncate mt-0.5">
                    {e.entityId}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          eyebrow="FEDERATIONS · COVERAGE"
          title="Distribución canónica por federación"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {FEDERATIONS.map((f) => {
              const n = CANON_ENTITIES.filter((c) => c.federation === f.id).length;
              const pct = Math.round((n / CANON_ENTITIES.length) * 100);
              return (
                <li key={f.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="h-2 w-2 rounded-full" style={{ background: f.accent }} />
                  <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground w-8">
                    {f.code}
                  </span>
                  <span className="text-sm flex-1 truncate">{f.name}</span>
                  <div className="hidden md:block w-48 h-1 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: f.accent }} />
                  </div>
                  <span className="mono text-[10px] text-muted-foreground tabular w-10 text-right">
                    {n}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
