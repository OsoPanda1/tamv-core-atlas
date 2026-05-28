import { useMemo, useState } from "react";
import { EDGES, ENTITIES, FEDERATIONS, type Entity, type FederationId } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

interface NexusGraphProps {
  height?: number;
  highlightFederation?: FederationId | null;
  onSelect?: (entity: Entity | null) => void;
}

// Deterministic radial-by-federation layout
function computeLayout(width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 80;
  const positions = new Map<string, { x: number; y: number; fed: FederationId }>();

  FEDERATIONS.forEach((fed, fi) => {
    const fedAngle = (fi / FEDERATIONS.length) * Math.PI * 2 - Math.PI / 2;
    const fedCx = cx + Math.cos(fedAngle) * radius * 0.62;
    const fedCy = cy + Math.sin(fedAngle) * radius * 0.62;
    const members = ENTITIES.filter((e) => e.federation === fed.id);
    members.forEach((m, mi) => {
      const a = (mi / Math.max(members.length, 1)) * Math.PI * 2;
      const r = 38 + (members.length > 3 ? 10 : 0);
      positions.set(m.id, {
        x: fedCx + Math.cos(a) * r,
        y: fedCy + Math.sin(a) * r,
        fed: fed.id,
      });
    });
  });
  return { positions, cx, cy };
}

export function NexusGraph({ height = 560, highlightFederation, onSelect }: NexusGraphProps) {
  const width = 980;
  const { positions, cx, cy } = useMemo(() => computeLayout(width, height), [height]);
  const [hover, setHover] = useState<string | null>(null);

  const fedColor = (id: FederationId) => `var(--fed-${id})`;

  const isDim = (id: string) => {
    const fed = positions.get(id)?.fed;
    if (highlightFederation && fed !== highlightFederation) return true;
    if (hover) {
      const connected = EDGES.some(
        (e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id),
      );
      if (id !== hover && !connected) return true;
    }
    return false;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-border bg-[oklch(0.13_0.011_250)]">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative w-full h-auto"
        style={{ minHeight: height }}
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.62 0.13 245 / 0.45)" />
            <stop offset="100%" stopColor="oklch(0.62 0.13 245 / 0)" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={120} fill="url(#coreGlow)" />
        <circle cx={cx} cy={cy} r={210} fill="none" stroke="oklch(0.28 0.012 250)" strokeDasharray="2 6" />
        <circle cx={cx} cy={cy} r={310} fill="none" stroke="oklch(0.24 0.012 250)" strokeDasharray="2 6" />

        {/* federation labels */}
        {FEDERATIONS.map((fed, fi) => {
          const a = (fi / FEDERATIONS.length) * Math.PI * 2 - Math.PI / 2;
          const lx = cx + Math.cos(a) * (Math.min(width, height) / 2 - 30);
          const ly = cy + Math.sin(a) * (Math.min(width, height) / 2 - 30);
          return (
            <g key={fed.id}>
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                className="mono"
                fontSize="10"
                letterSpacing="0.18em"
                fill={fedColor(fed.id)}
                opacity={highlightFederation && highlightFederation !== fed.id ? 0.25 : 0.85}
              >
                {fed.code} · {fed.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* edges */}
        {EDGES.map((e, i) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          const dim = isDim(e.from) || isDim(e.to);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={fedColor(a.fed)}
              strokeOpacity={dim ? 0.06 : 0.35}
              strokeWidth={1}
            />
          );
        })}

        {/* nodes */}
        {ENTITIES.map((entity) => {
          const p = positions.get(entity.id);
          if (!p) return null;
          const dim = isDim(entity.id);
          const active = hover === entity.id;
          return (
            <g
              key={entity.id}
              transform={`translate(${p.x}, ${p.y})`}
              className="cursor-pointer transition-opacity"
              opacity={dim ? 0.2 : 1}
              onMouseEnter={() => {
                setHover(entity.id);
                onSelect?.(entity);
              }}
              onMouseLeave={() => {
                setHover(null);
                onSelect?.(null);
              }}
            >
              <circle
                r={active ? 7 : 4}
                fill={fedColor(p.fed)}
                stroke={active ? "oklch(0.94 0.01 90)" : "oklch(0.16 0.012 250)"}
                strokeWidth={1.5}
              />
              {active && (
                <text
                  x={10}
                  y={4}
                  fontSize="11"
                  fill="oklch(0.94 0.01 90)"
                  className="mono"
                >
                  {entity.name}
                </text>
              )}
            </g>
          );
        })}

        {/* core label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" className="mono" letterSpacing="0.2em" fill="oklch(0.78 0.04 230)">
          NODO CERO
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" className="mono" letterSpacing="0.18em" fill="oklch(0.66 0.015 240)">
          KODEX CORE · TAMV-K5
        </text>
      </svg>
    </div>
  );
}