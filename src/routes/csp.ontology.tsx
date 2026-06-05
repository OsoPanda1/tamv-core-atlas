import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/common/Panel";
import { CANON_ENTITIES, ONTOLOGY_EDGES, canonById, type OntologyEdge } from "@/lib/csp-data";
import { federationById } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csp/ontology")({
  head: () => ({
    meta: [
      { title: "Ontological Graph · CSP-α" },
      {
        name: "description",
        content:
          "Capa 2. Grafo semántico Neo4j-compatible con relaciones DEPENDS_ON · VALIDATED_BY · PROTECTED_BY.",
      },
    ],
  }),
  component: OntologyPage,
});

const EDGE_COLOR: Record<OntologyEdge["kind"], string> = {
  DEPENDS_ON: "oklch(0.72 0.16 230)",
  VALIDATED_BY: "oklch(0.75 0.16 145)",
  PROTECTED_BY: "oklch(0.72 0.18 25)",
  PERSISTS_TO: "oklch(0.78 0.14 75)",
  EXTENDS: "oklch(0.72 0.16 295)",
};

function OntologyPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const n = CANON_ENTITIES.length;
    const cx = 360;
    const cy = 310;
    const r = 230;
    CANON_ENTITIES.forEach((c, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      map.set(c.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    });
    return map;
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="CAPA 2 · ONTOLOGICAL GRAPH ENGINE"
        title="Grafo vivo — Neo4j compatible"
        description="Cada entidad canon se proyecta como (:Entity {id,type,federation,hash}). Las dependencias se materializan como relaciones tipadas reutilizables por queries Cypher."
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Panel eyebrow="GRAPH VIEW" title="Proyección canon → grafo" bodyClassName="p-0">
            <div className="relative aspect-[4/3] w-full bg-[radial-gradient(circle_at_center,oklch(0.18_0.03_265/0.4),transparent_70%)]">
              <svg viewBox="0 0 720 620" className="absolute inset-0 h-full w-full">
                {ONTOLOGY_EDGES.map((e, i) => {
                  const a = positions.get(e.from);
                  const b = positions.get(e.to);
                  if (!a || !b) return null;
                  const hi = hovered && (e.from === hovered || e.to === hovered);
                  return (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={EDGE_COLOR[e.kind]}
                      strokeOpacity={hi ? 0.9 : hovered ? 0.1 : 0.35}
                      strokeWidth={hi ? 1.5 : 0.8}
                    />
                  );
                })}
                {CANON_ENTITIES.map((c) => {
                  const p = positions.get(c.id)!;
                  const fed = federationById(c.federation);
                  const hi = hovered === c.id;
                  return (
                    <g
                      key={c.id}
                      onMouseEnter={() => setHovered(c.id)}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hi ? 11 : 7}
                        fill={fed.accent}
                        fillOpacity={hi ? 1 : 0.85}
                        stroke="oklch(0.12 0.02 265)"
                        strokeWidth={1}
                      />
                      <text
                        x={p.x}
                        y={p.y + 24}
                        textAnchor="middle"
                        fontSize="9"
                        fill="oklch(0.78 0.02 265)"
                        fontFamily="ui-monospace, monospace"
                      >
                        {c.canonicalId}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            eyebrow="INSPECTOR"
            title={hovered ? (canonById(hovered)?.canonicalId ?? "—") : "Hover un nodo"}
          >
            {hovered && canonById(hovered) ? (
              <div className="space-y-2 text-xs">
                <div className="mono text-[10px] text-muted-foreground break-all">{hovered}</div>
                <p className="text-foreground/85 leading-relaxed">
                  {canonById(hovered)!.description}
                </p>
                <div className="mono text-[10px] text-muted-foreground">
                  edges:{" "}
                  {ONTOLOGY_EDGES.filter((e) => e.from === hovered || e.to === hovered).length}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Coloca el cursor sobre un nodo para ver sus aristas.
              </p>
            )}
          </Panel>
          <Panel eyebrow="CYPHER · SAMPLE" title="Projection query">
            <pre className="mono text-[10px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{`MERGE (e:Entity {id:$id})
SET e.type=$type,
    e.federation=$fed,
    e.hash=$hash
WITH e
UNWIND $deps AS d
MERGE (t:Entity {id:d})
MERGE (e)-[:DEPENDS_ON]->(t);`}</pre>
          </Panel>
          <Panel eyebrow="RELATION TYPES" title="Edge legend" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {Object.entries(EDGE_COLOR).map(([kind, color]) => (
                <li key={kind} className="px-4 py-2 flex items-center gap-2 text-xs">
                  <span className="h-0.5 w-6" style={{ background: color }} />
                  <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex-1">
                    {kind}
                  </span>
                  <span className="mono text-[10px] text-muted-foreground tabular">
                    {ONTOLOGY_EDGES.filter((e) => e.kind === kind).length}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Panel eyebrow="EDGES · TABLE" title="Aristas canónicas" bodyClassName="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5">From</th>
                <th className="px-4 py-2.5">Relation</th>
                <th className="px-4 py-2.5">To</th>
              </tr>
            </thead>
            <tbody>
              {ONTOLOGY_EDGES.map((e, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/60 hover:bg-secondary/30 cursor-pointer",
                    (hovered === e.from || hovered === e.to) && "bg-secondary/60",
                  )}
                  onMouseEnter={() => setHovered(e.from)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td className="px-4 py-2.5 mono text-[11px] truncate max-w-[260px]">{e.from}</td>
                  <td
                    className="px-4 py-2.5 mono text-[10px] uppercase tracking-wider"
                    style={{ color: EDGE_COLOR[e.kind] }}
                  >
                    {e.kind}
                  </td>
                  <td className="px-4 py-2.5 mono text-[11px] truncate max-w-[260px]">{e.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
