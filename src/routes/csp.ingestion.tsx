import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, XCircle, Plus } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/common/Panel";
import { INGESTION_SOURCES, type IngestionSource } from "@/lib/csp-data";
import { federationById } from "@/lib/tamv-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csp/ingestion")({
  head: () => ({
    meta: [
      { title: "Semantic Ingestion Engine · CSP-α" },
      {
        name: "description",
        content: "Capa 0. Repos, manifests y webhooks normalizados a entidades canon.",
      },
    ],
  }),
  component: IngestionPage,
});

const STATUS_ICON: Record<IngestionSource["status"], typeof CheckCircle2> = {
  ingested: CheckCircle2,
  running: Loader2,
  queued: CircleDashed,
  failed: XCircle,
};

const STATUS_COLOR: Record<IngestionSource["status"], string> = {
  ingested: "text-success",
  running: "text-primary",
  queued: "text-muted-foreground",
  failed: "text-destructive",
};

function IngestionPage() {
  const [url, setUrl] = useState("github://OsoPanda1/");
  const [queue, setQueue] = useState<IngestionSource[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const id = `ing-q${Date.now().toString(36)}`;
    const traceId = `repo.ingestion-${Math.random().toString(36).slice(2, 8)}`;
    setQueue((q) => [
      {
        id,
        url: url.trim(),
        kind: "github",
        federation: "infra",
        status: "queued",
        files: 0,
        entitiesExtracted: 0,
        lastRun: "T-00:00:00",
        traceId,
      },
      ...q,
    ]);
    setUrl("github://OsoPanda1/");
  };

  const all = [...queue, ...INGESTION_SOURCES];

  return (
    <div>
      <PageHeader
        eyebrow="CAPA 0 · SEMANTIC INGESTION ENGINE"
        title="Absorción y pre-clasificación de fuentes"
        description="RepoIngestionService · DocumentIngestionService · WebhookIngestionService. Cada ingesta produce traceId, hash y eventos BookPI append-only."
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="SOURCES" value={all.length} hint="Activas + cola" />
          <Stat
            label="FILES SCANNED"
            value={INGESTION_SOURCES.reduce((a, s) => a + s.files, 0)}
            hint="MD · YAML · package.json"
          />
          <Stat
            label="ENTITIES EXTRACTED"
            value={INGESTION_SOURCES.reduce((a, s) => a + s.entitiesExtracted, 0)}
            hint="→ Canon Registry"
          />
          <Stat
            label="FAILED"
            value={INGESTION_SOURCES.filter((s) => s.status === "failed").length}
            hint="Reintento manual"
          />
        </div>

        <Panel eyebrow="REPO INGESTION" title="Conectar fuente">
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="github://owner/repo · zenodo://doi · manifest://..."
              className="flex-1 min-w-[280px] rounded-sm border border-border bg-card px-3 py-2 text-sm mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="mono text-[10px] uppercase tracking-wider px-3 py-2 rounded-sm border border-primary bg-primary/10 text-foreground hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3" /> Encolar ingesta
            </button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Encolar genera traceId nuevo, persiste en BookPI como{" "}
            <span className="mono">INGESTION</span> y dispara{" "}
            <span className="mono">SemanticExtractor → CanonRegistry → Neo4j → Qdrant</span> al
            estar conectado el backend NestJS.
          </p>
        </Panel>

        <Panel eyebrow="SOURCES" title="Estado de ingestión" bodyClassName="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5">URL</th>
                <th className="px-4 py-2.5">Kind</th>
                <th className="px-4 py-2.5">Federation</th>
                <th className="px-4 py-2.5 text-right tabular">Files</th>
                <th className="px-4 py-2.5 text-right tabular">Entities</th>
                <th className="px-4 py-2.5">Trace</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {all.map((s) => {
                const Icon = STATUS_ICON[s.status];
                const fed = federationById(s.federation);
                return (
                  <tr key={s.id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-3 mono text-[11px] truncate max-w-[320px]">{s.url}</td>
                    <td className="px-4 py-3 mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.kind}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: fed.accent }}
                        />
                        {fed.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right mono text-[11px] tabular text-muted-foreground">
                      {s.files}
                    </td>
                    <td className="px-4 py-3 text-right mono text-[11px] tabular text-foreground">
                      {s.entitiesExtracted}
                    </td>
                    <td className="px-4 py-3 mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {s.traceId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider",
                          STATUS_COLOR[s.status],
                        )}
                      >
                        <Icon className={cn("h-3 w-3", s.status === "running" && "animate-spin")} />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
