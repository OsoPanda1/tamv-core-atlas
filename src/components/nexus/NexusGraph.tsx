import { useMemo, useState } from "react";
import {
  EDGES,
  ENTITIES,
  FEDERATIONS,
  type Entity,
  type FederationId,
} from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

interface NexusGraphProps {
  height?: number;
  highlightFederation?: FederationId | null;
  onSelect?: (entity: Entity | null) => void;
}

type Point = {
  x: number;
  y: number;
  fed: FederationId;
};

type LayoutResult = {
  positions: Map<string, Point>;
  cx: number;
  cy: number;
  outerRadius: number;
};

const DEFAULT_WIDTH = 980;

// Helper: color por federación via CSS custom properties
const fedColor = (id: FederationId) => `var(--fed-${id})`;

// Deterministic radial-by-federation layout con parámetros explícitos
function computeLayout(width: number, height: number): LayoutResult {
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 40;
  const federationRingRadius = outerRadius * 0.62;

  const positions = new Map<string, Point>();

  FEDERATIONS.forEach((fed, fi) => {
    const fedAngle =
      (fi / FEDERATIONS.length) * Math.PI * 2 -
      Math.PI / 2; // inicia arriba y gira en sentido horario
    const fedCx = cx + Math.cos(fedAngle) * federationRingRadius;
    const fedCy = cy + Math.sin(fedAngle) * federationRingRadius;

    const members = ENTITIES.filter((e) => e.federation === fed.id);

    if (members.length === 0) return;

    const baseRadius = 34;
    const extraRadius =
      members.length <= 3 ? 0 : Math.min(16, (members.length - 3) * 3);
    const clusterRadius = baseRadius + extraRadius;

    members.forEach((m, mi) => {
      const a = (mi / members.length) * Math.PI * 2;
      const x = fedCx + Math.cos(a) * clusterRadius;
      const y = fedCy + Math.sin(a) * clusterRadius;

      positions.set(m.id, {
        x,
        y,
        fed: fed.id,
      });
    });
  });

  return { positions, cx, cy, outerRadius };
}

export function NexusGraph({
  height = 560,
  highlightFederation,
  onSelect,
}: NexusGraphProps) {
  const width = DEFAULT_WIDTH;

  const { positions, cx, cy, outerRadius } = useMemo(
    () => computeLayout(width, height),
    [height],
  );

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = hoverId ?? selectedId ?? null;

  const isDimmed = (id: string): boolean => {
    const fed = positions.get(id)?.fed;

    if (highlightFederation && fed && fed !== highlightFederation) {
      return true;
    }

    if (activeId) {
      if (id === activeId) return false;
      const connected = EDGES.some(
        (e) =>
          (e.from === activeId && e.to === id) ||
          (e.to === activeId && e.from === id),
      );
      return !connected;
    }

    return false;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-border bg-[oklch(0.13_0.011_250)]">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative h-auto w-full"
        style={{ minHeight: height }}
        role="img"
        aria-label="Nexus graph of TAMV heptafederations"
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.62 0.13 245 / 0.45)" />
            <stop offset="100%" stopColor="oklch(0.62 0.13 245 / 0)" />
          </radialGradient>
        </defs>

        {/* core aura */}
        <circle cx={cx} cy={cy} r={120} fill="url(#coreGlow)" />

        {/* rings */}
        <circle
          cx={cx}
          cy={cy}
          r={outerRadius * 0.7}
          fill="none"
          stroke="oklch(0.28 0.012 250)"
          strokeDasharray="2 6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerRadius * 0.95}
          fill="none"
          stroke="oklch(0.24 0.012 250)"
          strokeDasharray="2 6"
        />

        {/* federation labels */}
        {FEDERATIONS.map((fed, fi) => {
          const a =
            (fi / FEDERATIONS.length) * Math.PI * 2 - Math.PI / 2;
          const labelRadius = outerRadius - 18;
          const lx = cx + Math.cos(a) * labelRadius;
          const ly = cy + Math.sin(a) * labelRadius;
          const dim =
            highlightFederation &&
            highlightFederation !== fed.id;

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
                opacity={dim ? 0.25 : 0.9}
              >
                {fed.code} · {fed.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* edges */}
        {EDGES.map((edge, i) => {
          const a = positions.get(edge.from);
          const b = positions.get(edge.to);
          if (!a || !b) return null;

          const dim = isDimmed(edge.from) || isDimmed(edge.to);
          const isHighlighted =
            activeId &&
            (edge.from === activeId || edge.to === activeId);

          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={fedColor(a.fed)}
              strokeOpacity={
                dim ? 0.06 : isHighlighted ? 0.55 : 0.28
              }
              strokeWidth={isHighlighted ? 1.5 : 1}
            />
          );
        })}

        {/* nodes */}
        {ENTITIES.map((entity) => {
          const p = positions.get(entity.id);
          if (!p) return null;

          const dim = isDimmed(entity.id);
          const isActive = activeId === entity.id;

          return (
            <g
              key={entity.id}
              transform={`translate(${p.x}, ${p.y})`}
              className="cursor-pointer transition-opacity"
              opacity={dim ? 0.2 : 1}
              onMouseEnter={() => {
                setHoverId(entity.id);
                onSelect?.(entity);
              }}
              onMouseLeave={() => {
                setHoverId(null);
                onSelect?.(selectedId ? null : null);
              }}
              onClick={() => {
                setSelectedId((prev) =>
                  prev === entity.id ? null : entity.id,
                );
                onSelect?.(
                  selectedId === entity.id ? null : entity,
                );
              }}
            >
              <circle
                r={isActive ? 7 : 4}
                fill={fedColor(p.fed)}
                stroke={
                  isActive
                    ? "oklch(0.94 0.01 90)"
                    : "oklch(0.16 0.012 250)"
                }
                strokeWidth={1.5}
              />
              {isActive && (
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
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="11"
          className="mono"
          letterSpacing="0.2em"
          fill="oklch(0.78 0.04 230)"
        >
          NODO CERO
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="9"
          className="mono"
          letterSpacing="0.18em"
          fill="oklch(0.66 0.015 240)"
        >
          KODEX CORE · TAMV-K5
        </text>
      </svg>
    </div>
  );
}
