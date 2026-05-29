import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/Panel";
import { CANON_ENTITIES, type CanonEntity } from "@/lib/csp-data";
import { FEDERATIONS, federationById, type FederationId } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csp/canon")({
  head: () => ({
    meta: [
      { title: "Canon Registry · CSP-α" },
      { name: "description", content: "Capa 1. Canonización determinista: ID, tipo, federación, hash, dependencias." },
    ],
  }),
  component: CanonPage,
});

function CanonPage() {
  const [filter, setFilter] = useState<FederationId | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CanonEntity | null>(CANON_ENTITIES[0]);

  const list = CANON_ENTITIES.filter(
    (c) =>
      (!filter || c.federation === filter) &&
      (!q || (c.id + c.description + c.canonicalId).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader
        eyebrow="CAPA 1 · CANON REGISTRY ENGINE"
        title="Caos heterogéneo → canon determinista"
        description="Cada entrada pasa por normalize() y se persiste con ID canónico, hash sha256, federación, dependencias explícitas y refs de origen."
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] rounded-sm border border-border bg-card px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar TAMV.* o canonical id…"
                className="flex-1 bg-transparent py-2 text-sm mono placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "mono text-[10px] uppercase tracking-wider px-2.5 py-2 rounded-sm border",
                filter === null ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              ALL
            </button>
            {FEDERATIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "mono text-[10px] uppercase tracking-wider px-2.5 py-2 rounded-sm border",
                  filter === f.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span style={{ color: f.accent }}>●</span> {f.code}
              </button>
            ))}
          </div>
          <Panel eyebrow="CANON ENTITIES" title={`${list.length} canonical`} bodyClassName="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Federation</th>
                  <th className="px-4 py-2.5">Hash</th>
                  <th className="px-4 py-2.5 text-right tabular">Deps</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const fed = federationById(c.federation);
                  const active = selected?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors",
                        active ? "bg-secondary/60" : "hover:bg-secondary/30",
                      )}
                    >
                      <td className="px-4 py-3 mono text-[11px] text-foreground truncate max-w-[280px]">{c.id}</td>
                      <td className="px-4 py-3 mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.type}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: fed.accent }} />
                          <span className="text-foreground/80">{fed.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 mono text-[10px] tabular text-muted-foreground">{c.hash}</td>
                      <td className="px-4 py-3 text-right mono text-[11px] tabular text-muted-foreground">{c.dependencies.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel eyebrow="INSPECTOR" title={selected ? selected.canonicalId : "—"}>
            {selected ? (
              <div className="space-y-4 text-sm">
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground break-all">{selected.id}</div>
                <p className="text-foreground/85 leading-relaxed">{selected.description}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <dt className="mono text-[10px] uppercase tracking-wider text-muted-foreground">type</dt>
                  <dd className="text-foreground/90">{selected.type}</dd>
                  <dt className="mono text-[10px] uppercase tracking-wider text-muted-foreground">federation</dt>
                  <dd className="text-foreground/90">{federationById(selected.federation).name}</dd>
                  <dt className="mono text-[10px] uppercase tracking-wider text-muted-foreground">hash</dt>
                  <dd className="mono text-foreground/90 tabular">{selected.hash}</dd>
                  <dt className="mono text-[10px] uppercase tracking-wider text-muted-foreground">canonical</dt>
                  <dd className="mono text-success">true</dd>
                </dl>
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">dependencies</div>
                  {selected.dependencies.length === 0 ? (
                    <div className="mono text-[11px] text-muted-foreground/70">— ninguna</div>
                  ) : (
                    <ul className="space-y-1">
                      {selected.dependencies.map((d) => (
                        <li key={d} className="mono text-[11px] text-foreground/90 truncate">{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">sourceRefs</div>
                  <ul className="space-y-1">
                    {selected.sourceRefs.map((s) => (
                      <li key={s} className="mono text-[11px] text-foreground/80 truncate">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecciona una entidad.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}