import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/common/Panel";
import { NexusGraph } from "@/components/nexus/NexusGraph";
import { EDGES, ENTITIES, FEDERATIONS, type Entity, type FederationId } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nexus")({
  head: () => ({
    meta: [
      { title: "Nexus Graph · TAMV Core Kodex" },
      { name: "description", content: "Knowledge graph of the TAMV ecosystem: sovereign entities, federations, lineage and dependencies." },
      { property: "og:title", content: "Nexus Graph · TAMV" },
      { property: "og:description", content: "Live knowledge graph of sovereign entities." },
    ],
  }),
  component: NexusPage,
});

function NexusPage() {
  const [filter, setFilter] = useState<FederationId | null>(null);
  const [selected, setSelected] = useState<Entity | null>(null);
  const focus = selected;
  const related = focus
    ? EDGES.filter((e) => e.from === focus.id || e.to === focus.id)
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="NEXUS · KNOWLEDGE GRAPH"
        title="Sovereign entity relationships"
        description="Entidades soberanas en 7 federaciones. Hover para inspeccionar. Filtra por federación para clustering y lineage."
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-sm border",
                filter === null ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              ALL
            </button>
            {FEDERATIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-sm border transition-colors",
                  filter === f.id ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span style={{ color: f.accent }}>●</span> {f.code} {f.name}
              </button>
            ))}
          </div>
          <NexusGraph height={620} highlightFederation={filter} onSelect={setSelected} />
        </div>

        <div className="space-y-4">
          <Panel eyebrow="INSPECTOR" title={focus ? focus.name : "Hover an entity"}>
            {focus ? (
              <div className="space-y-3 text-sm">
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {focus.kind} · {FEDERATIONS.find((f) => f.id === focus.federation)?.name}
                </div>
                <p className="text-foreground/85 leading-relaxed">{focus.description}</p>
                <div className="flex items-center gap-3 mono text-[10px] uppercase tracking-wider text-muted-foreground tabular">
                  <span>trust {focus.trust}</span>
                  <span>edges {related.length}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pasa el cursor sobre un nodo para inspeccionar su lineage, federación y trust score.
              </p>
            )}
          </Panel>
          <Panel eyebrow="LEGEND" title="Federations" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {FEDERATIONS.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: f.accent }} />
                  <span className="mono text-[10px] uppercase tracking-wider w-8 text-muted-foreground">{f.code}</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="mono text-[10px] text-muted-foreground tabular">{ENTITIES.filter((e) => e.federation === f.id).length}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}