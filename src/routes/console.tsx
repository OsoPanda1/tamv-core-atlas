import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/common/Panel";
import { NexusGraph } from "@/components/nexus/NexusGraph";
import { EDGES, ENTITIES, FEDERATIONS, type FederationId } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "Heptafederated Console · TAMV Core Kodex" },
      {
        name: "description",
        content:
          "Live console of the seven TAMV federations: science, infrastructure, cognition, governance, identity, economy and defense.",
      },
      { property: "og:title", content: "Heptafederated Console · TAMV" },
      { property: "og:description", content: "Seven federations, one constitutional runtime." },
    ],
  }),
  component: ConsolePage,
});

function ConsolePage() {
  const [active, setActive] = useState<FederationId>("governance");
  const fed = FEDERATIONS.find((f) => f.id === active)!;
  const members = ENTITIES.filter((e) => e.federation === active);
  const inbound = EDGES.filter((e) => members.some((m) => m.id === e.to));
  const outbound = EDGES.filter((e) => members.some((m) => m.id === e.from));

  return (
    <div>
      <PageHeader
        eyebrow="HEPTAFEDERATED · CONSOLE"
        title="Seven federations · one constitutional runtime"
        description="Cada federación es navegable, expandible y auditable. Estado operativo, trust, riesgo, señales y dependencias en tiempo real."
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {FEDERATIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={cn(
                "text-left rounded-sm border bg-card/60 p-3 transition-all hover:bg-secondary/60",
                active === f.id ? "border-primary/60 ring-1 ring-primary/40" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className="mono text-[10px] uppercase tracking-wider"
                  style={{ color: f.accent }}
                >
                  {f.code}
                </span>
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", {
                    "bg-success": f.status === "operational",
                    "bg-warning": f.status === "watch",
                    "bg-destructive": f.status !== "operational" && f.status !== "watch",
                  })}
                />
              </div>
              <div className="mt-2 text-sm font-medium leading-tight">{f.name}</div>
              <div className="mt-2 mono text-[10px] uppercase tracking-wider text-muted-foreground tabular">
                trust {f.trust} · risk {f.risk}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel
            eyebrow={`${fed.code} · ${fed.name.toUpperCase()}`}
            title={fed.mandate}
            className="xl:col-span-2"
            bodyClassName="p-0"
          >
            <NexusGraph height={460} highlightFederation={active} />
          </Panel>

          <div className="space-y-6">
            <Panel eyebrow="STATE" title="Operational telemetry">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Trust score" value={fed.trust} suffix="/100" tone="success" />
                <Metric label="Risk index" value={fed.risk} suffix="/100" tone="warning" />
                <Metric label="Active nodes" value={fed.nodes} />
                <Metric label="Signals · 24h" value={fed.signals.toLocaleString()} />
                <Metric label="Inbound deps" value={inbound.length} />
                <Metric label="Outbound deps" value={outbound.length} />
              </div>
            </Panel>

            <Panel eyebrow="MEMBERS" title={`${members.length} entities`} bodyClassName="p-0">
              <ul className="divide-y divide-border max-h-[280px] overflow-y-auto">
                {members.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm truncate">{m.name}</span>
                      <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {m.kind}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">
                      {m.description}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-sm border border-border bg-secondary/40 p-3">
      <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn("mt-1 text-xl font-medium tabular", {
          "text-success": tone === "success",
          "text-warning": tone === "warning",
        })}
      >
        {value}
        {suffix && <span className="mono text-[10px] text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
