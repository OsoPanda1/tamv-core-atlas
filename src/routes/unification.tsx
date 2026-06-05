import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, GitBranch, LockKeyhole, ShieldAlert } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/common/Panel";
import { FEDERATIONS } from "@/lib/tamv-data";
import { HARDENING_CONTROLS, SOURCE_REPOSITORIES, SOURCE_REPO_KPI } from "@/lib/source-repos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/unification")({
  head: () => ({
    meta: [
      { title: "Source Unification · TAMV" },
      {
        name: "description",
        content:
          "Auditable unification and hardening matrix for the nine OsoPanda1 TAMV source repositories.",
      },
      { property: "og:title", content: "TAMV Source Unification" },
      {
        property: "og:description",
        content: "Federated source registry, hardening controls and quarantine states.",
      },
    ],
  }),
  component: UnificationPage,
});

function UnificationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="UNIFICACIÓN · ENDURECIMIENTO"
        title="Matriz viva de fuentes OsoPanda1"
        description="Registro operativo para absorber, aislar y promover código funcional de Atlas, Genesis, Orchestrator, Data Weaver, Real del Monte y CITEMESH sin romper el canon raíz."
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat label="Fuentes declaradas" value={SOURCE_REPO_KPI.total} hint="repos solicitados" />
          <Stat
            label="Absorbidas"
            value={SOURCE_REPO_KPI.absorbed}
            hint="árbol local verificable"
          />
          <Stat label="Mapeadas" value={SOURCE_REPO_KPI.mapped} hint="pendientes de red/token" />
          <Stat
            label="Hardening activo"
            value={SOURCE_REPO_KPI.enforced}
            hint="controles aplicados"
          />
          <Stat label="Revisión" value={SOURCE_REPO_KPI.pendingReview} hint="quarantine gates" />
          <Stat label="Controles" value={SOURCE_REPO_KPI.controls} hint="EOCT · Horus · Anubis" />
        </div>

        <Panel
          eyebrow="SOURCE REGISTRY"
          title="Repositorios fuente y carga funcional"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30 text-left mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Repo</th>
                  <th className="px-4 py-3 font-medium">Federación</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Payload funcional</th>
                  <th className="px-4 py-3 font-medium">Nota de hardening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SOURCE_REPOSITORIES.map((repo) => {
                  const federation = FEDERATIONS.find((f) => f.id === repo.federation)!;
                  return (
                    <tr
                      key={repo.name}
                      className="align-top hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3 min-w-[240px]">
                        <a
                          href={repo.url.replace(/\.git$/, "")}
                          className="font-medium hover:text-primary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {repo.name}
                        </a>
                        <div className="mono mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {repo.access}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: federation.accent }}
                          />
                          <span>
                            {federation.code} · {federation.name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {repo.role}
                        </p>
                      </td>
                      <td className="px-4 py-3 min-w-[150px]">
                        <StateBadge state={repo.integrationState} />
                        <div className="mt-2">
                          <HardeningBadge state={repo.hardeningState} />
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[260px]">
                        <div className="flex flex-wrap gap-1.5">
                          {repo.functionalPayload.map((payload) => (
                            <span
                              key={payload}
                              className="rounded-sm border border-border bg-card px-2 py-1 mono text-[10px] text-muted-foreground"
                            >
                              {payload}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[260px] text-xs text-muted-foreground leading-relaxed">
                        {repo.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel eyebrow="HARDENING" title="Controles de promoción segura" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {HARDENING_CONTROLS.map((control) => (
                <li key={control.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">
                        {control.id} · {control.title}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "mono rounded-sm px-2 py-1 text-[10px] uppercase tracking-wider",
                        {
                          "bg-destructive/10 text-destructive": control.severity === "critical",
                          "bg-warning/10 text-warning": control.severity === "high",
                          "bg-secondary text-muted-foreground": control.severity === "medium",
                        },
                      )}
                    >
                      {control.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {control.evidence}
                  </p>
                  <div className="mt-2 mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    owner {control.owner} · {control.status}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="FEDERATIONS" title="Cobertura por federación" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {FEDERATIONS.map((federation) => {
                const repos = SOURCE_REPOSITORIES.filter(
                  (repo) => repo.federation === federation.id,
                );
                const pct = Math.round((repos.length / SOURCE_REPOSITORIES.length) * 100);
                return (
                  <li key={federation.id} className="px-4 py-3 flex items-center gap-4">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: federation.accent }}
                    />
                    <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground w-8">
                      {federation.code}
                    </span>
                    <span className="text-sm flex-1 truncate">{federation.name}</span>
                    <div className="hidden md:block h-1 w-48 overflow-hidden rounded-full bg-secondary/60">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: federation.accent }}
                      />
                    </div>
                    <span className="mono text-[10px] text-muted-foreground tabular w-10 text-right">
                      {repos.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: "absorbed" | "mapped" | "quarantined" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 mono text-[10px] uppercase tracking-wider",
        {
          "bg-success/10 text-success": state === "absorbed",
          "bg-accent/10 text-accent": state === "mapped",
          "bg-warning/10 text-warning": state === "quarantined",
        },
      )}
    >
      {state === "absorbed" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <GitBranch className="h-3 w-3" />
      )}
      {state}
    </span>
  );
}

function HardeningBadge({ state }: { state: "enforced" | "needs_review" | "blocked" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 mono text-[10px] uppercase tracking-wider",
        {
          "bg-success/10 text-success": state === "enforced",
          "bg-warning/10 text-warning": state === "needs_review",
          "bg-destructive/10 text-destructive": state === "blocked",
        },
      )}
    >
      <ShieldAlert className="h-3 w-3" />
      {state}
    </span>
  );
}
