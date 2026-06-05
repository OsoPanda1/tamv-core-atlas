import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/Panel";
import { TOMOS } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation OS · TAMV Core Kodex" },
      {
        name: "description",
        content:
          "Knowledge graph documental: tomos, canon, ADR, research, protocolos, ontologías y APIs.",
      },
      { property: "og:title", content: "Documentation OS · TAMV" },
      {
        property: "og:description",
        content: "GitBook + Obsidian-grade docs for the sovereign runtime.",
      },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  {
    title: "Canon",
    items: ["Enciclopedia Génesis", "Compendio F2", "Wiki Central", "Glosario MDX-4 HeHep"],
  },
  { title: "Tomos I → VII", items: TOMOS.map((t) => `Tomo ${t.number} · ${t.title}`) },
  {
    title: "Guías operativas",
    items: [
      "Implementación Ciudad Piloto",
      "Manual Kernel ORCID/Zenodo/Figshare",
      "Gobernanza ELITE HeHep",
    ],
  },
  {
    title: "ADR · Research",
    items: [
      "ADR-001 Heptafederación",
      "ADR-002 BookPI Ledger",
      "ADR-003 EOCT ABAC",
      "ADR-004 PQC roadmap",
    ],
  },
  {
    title: "APIs · Protocolos",
    items: ["Isabella API v1.0", "TAMVAI Núcleo", "Identity Ledger Schema", "BookPI Event Schema"],
  },
];

function DocsPage() {
  const location = useLocation();
  const onLeaf = location.pathname !== "/docs";

  return (
    <div>
      <PageHeader
        eyebrow="DOCUMENTATION · OS"
        title="Knowledge graph documental"
        description="Sistema documental navegable: tomos, canon, ADR, research, protocolos y ontologías. Búsqueda semántica, backlinks y referencias cruzadas."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[60vh]">
        <aside className="border-r border-border bg-sidebar/40 p-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
                {sec.title}
              </div>
              <ul className="space-y-1">
                {sec.items.map((it, i) => {
                  const slug = it
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  const active = location.pathname === `/docs/${slug}`;
                  return (
                    <li key={i}>
                      <Link
                        to="/docs/$slug"
                        params={{ slug }}
                        className={cn(
                          "block text-sm rounded-sm px-2.5 py-1.5 transition-colors",
                          active
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                        )}
                      >
                        {it}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
        <div className="p-8">{onLeaf ? <Outlet /> : <DocsLanding />}</div>
      </div>
    </div>
  );
}

function DocsLanding() {
  return (
    <article className="max-w-3xl">
      <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        KODEX · README
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        TAMV Core Kodex — Documentation OS
      </h1>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        Este sistema documental opera como un knowledge graph editorial. Cada entrada del canon
        (Tomos, Enciclopedia, ADR) es un nodo enlazable con backlinks bidireccionales, citaciones
        Zenodo/DOI y referencias cruzadas hacia el runtime constitucional y el ledger BookPI.
      </p>
      <h2 className="mt-8 text-base font-medium tracking-tight">Convenciones</h2>
      <ul className="mt-3 text-sm text-muted-foreground space-y-1.5">
        <li>· Custodio canónico — Edwin O. Castillo Trejo · ORCID 0009-0008-5050-1539</li>
        <li>· Canon científico — DOI 10.5281/zenodo.19436662</li>
        <li>· Toda doctrina debe pasar Korima · ontology validation</li>
        <li>· Todo evento queda sellado en BookPI Ledger</li>
      </ul>
      <h2 className="mt-8 text-base font-medium tracking-tight">Cómo leer el Kodex</h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        Comienza por el <em>Tomo I — Canon y Abstract</em>, continúa con el{" "}
        <em>Tomo II — Kernel Heptafederado</em> para entender la arquitectura, y profundiza después
        en los tomos territoriales (V, VI) y de futuro (VII · PQC).
      </p>
    </article>
  );
}
