import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/common/Panel";
import { EVENTS, FEDERATIONS } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Event Stream · TAMV Mission Control" },
      { name: "description", content: "Live observability feed: sentinel alerts, node health, constitutional violations, runtime execution." },
      { property: "og:title", content: "Event Stream · TAMV" },
      { property: "og:description", content: "Mission-control observability across the seven federations." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="EVENT STREAM · MISSION CONTROL"
        title="Live observability across the heptafederation"
        description="Feed unificado: alertas de centinelas, salud de nodos, violaciones constitucionales, conflictos Korima, anomalías y sincronización federativa."
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Panel eyebrow="LIVE FEED" title="Últimos eventos canónicos" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {EVENTS.map((e) => (
                <li key={e.id} className="px-5 py-3.5 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground tabular w-20">{e.ts}</span>
                    <span className={cn("mono text-[10px] uppercase tracking-wider w-20", {
                      "text-success": e.level === "info",
                      "text-warning": e.level === "warn",
                      "text-destructive": e.level === "critical",
                      "text-accent": e.level === "audit",
                    })}>{e.level}</span>
                    <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground w-28">{e.source}</span>
                    <span className="text-sm flex-1">{e.message}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel eyebrow="FILTERS" title="Federations">
            <ul className="space-y-1.5 text-sm">
              {FEDERATIONS.map((f) => (
                <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-secondary/50 cursor-pointer">
                  <span className="h-2 w-2 rounded-full" style={{ background: f.accent }} />
                  <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground w-8">{f.code}</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="mono text-[10px] text-muted-foreground tabular">{f.signals}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel eyebrow="LEVELS" title="Severity">
            <ul className="space-y-1.5 text-sm">
              {[
                { lvl: "info", color: "bg-success", n: 8421 },
                { lvl: "audit", color: "bg-accent", n: 1284 },
                { lvl: "warn", color: "bg-warning", n: 137 },
                { lvl: "critical", color: "bg-destructive", n: 4 },
              ].map((s) => (
                <li key={s.lvl} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-secondary/50">
                  <span className={cn("h-2 w-2 rounded-full", s.color)} />
                  <span className="mono text-[10px] uppercase tracking-wider flex-1">{s.lvl}</span>
                  <span className="mono text-[10px] text-muted-foreground tabular">{s.n.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}