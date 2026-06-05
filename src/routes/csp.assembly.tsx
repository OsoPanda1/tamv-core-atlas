import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Download, CheckCircle2 } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/common/Panel";
import { RDM_ASSEMBLY, renderComposeYaml } from "@/lib/csp-data";

export const Route = createFileRoute("/csp/assembly")({
  head: () => ({
    meta: [
      { title: "Self-Assembly Engine · CSP-α" },
      {
        name: "description",
        content: "Capa 4. Federation Compiler™ — canon + grafo → docker-compose ejecutable.",
      },
    ],
  }),
  component: AssemblyPage,
});

const STEPS = [
  { k: "resolve", label: "Resolve canon entities" },
  { k: "verify", label: "Verify hashes & consistency" },
  { k: "topo", label: "Topological sort (graph)" },
  { k: "compile", label: "Compile to docker-compose" },
  { k: "persist", label: "Persist artifact + BookPI event" },
] as const;

function AssemblyPage() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [yaml, setYaml] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setYaml(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 480));
    }
    setYaml(renderComposeYaml(RDM_ASSEMBLY));
    setRunning(false);
  };

  const download = () => {
    if (!yaml) return;
    const blob = new Blob([yaml], { type: "text/yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rdm-node-zero.compose.yaml";
    a.click();
  };

  return (
    <div>
      <PageHeader
        eyebrow="CAPA 4 · SELF-ASSEMBLY ENGINE"
        title="Federation Compiler™ — Build RDM Node Zero"
        description="Convierte entidades canon + grafo en una topología ejecutable. Cada assembly emite evento BookPI con hash del artefacto."
      >
        <button
          onClick={run}
          disabled={running}
          className="mono text-[10px] uppercase tracking-wider px-3 py-2 rounded-sm border border-primary bg-primary/15 text-foreground hover:bg-primary/25 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          <Play className="h-3 w-3" />
          {running ? "Compilando…" : "Build RDM Node Zero"}
        </button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="MODULES" value={RDM_ASSEMBLY.length} hint="entidades en topología" />
          <Stat label="LAYERS" value={4} hint="ordenadas topológicamente" />
          <Stat
            label="EXPOSED PORTS"
            value={RDM_ASSEMBLY.reduce((a, s) => a + s.ports.length, 0)}
            hint="incluye 80/443 perimetrales"
          />
          <Stat
            label="LAST BUILD"
            value={yaml ? "OK" : "—"}
            delta={yaml ? "sealed" : undefined}
            hint="BookPI · ASSEMBLY"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel eyebrow="PIPELINE" title="Assembly steps" bodyClassName="p-0">
            <ol className="divide-y divide-border">
              {STEPS.map((s, i) => {
                const done = step > i || (yaml && step === i);
                const active = running && step === i;
                return (
                  <li key={s.k} className="px-4 py-3 flex items-center gap-3">
                    <span
                      className={`mono text-[10px] uppercase tracking-wider tabular w-5 ${done ? "text-success" : active ? "text-primary" : "text-muted-foreground/60"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}
                      />
                    )}
                    <span className="text-xs flex-1">{s.label}</span>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel
            eyebrow="MODULES"
            title="Federation Compiler output"
            bodyClassName="p-0"
            className="xl:col-span-2"
          >
            <ul className="divide-y divide-border">
              {RDM_ASSEMBLY.map((m) => (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="mono text-[11px] text-foreground truncate">{m.id}</span>
                    <span className="mono text-[10px] text-muted-foreground truncate">
                      {m.image}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 mono text-[10px] text-muted-foreground">
                    <span>fed={m.env.TAMV_FEDERATION}</span>
                    <span>ports={m.ports.join(",")}</span>
                    {m.dependsOn.length > 0 && <span>depends={m.dependsOn.length}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          eyebrow="ARTIFACT"
          title="rdm-node-zero.compose.yaml"
          action={
            yaml && (
              <button
                onClick={download}
                className="mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-sm border border-border hover:bg-secondary/40 flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" /> descargar
              </button>
            )
          }
        >
          {yaml ? (
            <pre className="mono text-[11px] leading-relaxed text-foreground/90 overflow-auto max-h-[460px]">
              {yaml}
            </pre>
          ) : (
            <div className="text-xs text-muted-foreground">
              Pulsa <span className="mono">Build RDM Node Zero</span> para ejecutar el Federation
              Compiler™ sobre las entidades canónicas resueltas.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
