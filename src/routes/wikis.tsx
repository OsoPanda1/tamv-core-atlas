import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/Panel";
import { WIKIS } from "@/lib/wikis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wikis")({
  head: () => ({
    meta: [
      { title: "Wikis Canónicas · TAMV Core Kodex" },
      {
        name: "description",
        content:
          "Wikis ingestadas de 5 repositorios canónicos del ecosistema TAMV: NextGen, Digital Nexus, Atlas, Ecosistema, Analiza Este.",
      },
      { property: "og:title", content: "Wikis Canónicas · TAMV" },
      { property: "og:description", content: "Seed canónico de wikis del ecosistema TAMV." },
    ],
  }),
  component: WikisPage,
});

function WikisPage() {
  const location = useLocation();
  const onLeaf = location.pathname !== "/wikis";
  return (
    <div>
      <PageHeader
        eyebrow="DOCUMENTATION · WIKIS"
        title="Wikis canónicas ingestadas"
        description="Seed real de 5 repositorios del ecosistema TAMV. Markdown federado, renderizado en línea, listo para conectar al pipeline tamv-core-atlas."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[60vh]">
        <aside className="border-r border-border bg-sidebar/40 p-5 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
          <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">
            Repositorios · {WIKIS.length}
          </div>
          {WIKIS.map((w) => {
            const active = location.pathname === `/wikis/${w.slug}`;
            return (
              <Link
                key={w.slug}
                to="/wikis/$slug"
                params={{ slug: w.slug }}
                className={cn(
                  "block rounded-sm px-2.5 py-2 transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                <div className="text-sm font-medium">{w.title}</div>
                <div className="mono text-[10px] text-muted-foreground/70 mt-0.5">
                  {w.repo} · {w.lines.toLocaleString()} líneas
                </div>
              </Link>
            );
          })}
        </aside>
        <div className="p-8">{onLeaf ? <Outlet /> : <WikisIndex />}</div>
      </div>
    </div>
  );
}

function WikisIndex() {
  return (
    <article className="max-w-3xl">
      <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        WIKIS · INDEX
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Selecciona una wiki</h1>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        Cada entrada del menú lateral corresponde a una wiki canónica ingestada desde el repositorio
        original. Total de {WIKIS.reduce((n, w) => n + w.lines, 0).toLocaleString()} líneas de
        documentación federada disponibles offline.
      </p>
      <div className="mt-6 grid gap-3">
        {WIKIS.map((w) => (
          <Link
            key={w.slug}
            to="/wikis/$slug"
            params={{ slug: w.slug }}
            className="block rounded-sm border border-border p-4 hover:border-foreground/40 transition-colors"
          >
            <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {w.repo}
            </div>
            <div className="mt-1 font-medium">{w.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{w.description}</div>
          </Link>
        ))}
      </div>
    </article>
  );
}
