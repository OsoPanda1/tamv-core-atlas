import { useEffect, useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core, ElementDefinition } from "cytoscape";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitMerge, RefreshCw, Network, Boxes, ScrollText } from "lucide-react";

interface Entity {
  canonical_id: string;
  type: string;
  federation: string;
  title: string;
  description: string | null;
}
interface Relation {
  source_canonical_id: string;
  target_canonical_id: string;
  relation_type: string;
}
interface BookEvent {
  id: string;
  event_type: string;
  source: string;
  trace_id: string;
  hash: string;
  created_at: string;
  payload: Record<string, unknown>;
}

const FED_COLORS: Record<string, string> = {
  identity: "#22d3ee",
  academia: "#a78bfa",
  ai: "#f472b6",
  governance: "#fbbf24",
  economy: "#34d399",
  atlas: "#60a5fa",
  knowledge: "#f97316",
  core: "#94a3b8",
  unknown: "#64748b",
};

const SEED_REPOS = [
  "https://github.com/OsoPanda1/tamv-atlas.git",
  "https://github.com/OsoPanda1/tamv-core-atlas.git",
  "https://github.com/OsoPanda1/tamv-digital-nexus.git",
  "https://github.com/OsoPanda1/TAMV-ONLINE-NEXTGEN-1.0.git",
  "https://github.com/OsoPanda1/ecosistema-nextgen-tamv.git",
  "https://github.com/OsoPanda1/rdm-turismodigital.git",
  "https://github.com/OsoPanda1/real-del-monte-atlas.git",
  "https://github.com/OsoPanda1/realdelmonte-digital.git",
  "https://github.com/OsoPanda1/analiza-este-lovable-tamv.git",
  "https://github.com/OsoPanda1/oso-data-weaver.git",
  "https://github.com/OsoPanda1/tamv-orchestrator.git",
  "https://github.com/OsoPanda1/genesis-orchestrator.git",
  "https://github.com/OsoPanda1/v0-tamv-wiki-structure.git",
];

export default function AtlasCore() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [repoUrl, setRepoUrl] = useState(SEED_REPOS[0]);
  const [busy, setBusy] = useState<"ingest" | "assemble" | null>(null);
  const [artifact, setArtifact] = useState<string>("");
  const cyRef = useRef<Core | null>(null);

  const load = async () => {
    const [e, r, b] = await Promise.all([
      supabase.from("canon_entities").select("canonical_id,type,federation,title,description").limit(300),
      supabase.from("canon_relations").select("source_canonical_id,target_canonical_id,relation_type").limit(500),
      supabase.from("bookpi_events").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    setEntities((e.data ?? []) as Entity[]);
    setRelations((r.data ?? []) as Relation[]);
    setEvents((b.data ?? []) as BookEvent[]);
  };

  useEffect(() => {
    load();
  }, []);

  const elements = useMemo<ElementDefinition[]>(() => {
    const ids = new Set(entities.map((e) => e.canonical_id));
    const nodes: ElementDefinition[] = entities.map((e) => ({
      data: {
        id: e.canonical_id,
        label: e.title.length > 28 ? e.title.slice(0, 26) + "…" : e.title,
        federation: e.federation,
        type: e.type,
      },
    }));
    const edges: ElementDefinition[] = relations
      .filter((r) => ids.has(r.source_canonical_id) && ids.has(r.target_canonical_id))
      .map((r, i) => ({
        data: {
          id: `e${i}`,
          source: r.source_canonical_id,
          target: r.target_canonical_id,
          label: r.relation_type,
        },
      }));
    return [...nodes, ...edges];
  }, [entities, relations]);

  const ingest = async (urlOverride?: string) => {
    const url = urlOverride ?? repoUrl;
    if (!url) return;
    setBusy("ingest");
    const { data, error } = await supabase.functions.invoke("atlas-ingest", {
      body: { repo_url: url },
    });
    setBusy(null);
    if (error) {
      toast.error(`${url.split("/").slice(-1)[0]}: ${error.message}`);
      return null;
    }
    const d = data as { entities?: number; files_scanned?: number };
    toast.success(`✓ ${url.split("/").slice(-1)[0]}: ${d?.entities ?? 0} entities`);
    return d;
  };

  const ingestAll = async (concurrency = 3) => {
    setBusy("ingest");
    const { data, error } = await supabase.functions.invoke("atlas-ingest-batch", {
      body: { owner: "OsoPanda1", concurrency },
    });
    setBusy(null);
    if (error || !data?.ok) {
      return toast.error(error?.message ?? "No se pudo lanzar la ingesta masiva");
    }
    toast.success(
      `🚀 Batch ${String(data.batch_id).slice(0, 8)} lanzado: ${data.count} repos (concurrencia ${data.concurrency}). Ver historial.`,
    );
    load();
  };



  const assemble = async (target: string) => {
    setBusy("assemble");
    const { data, error } = await supabase.functions.invoke("atlas-assemble", {
      body: { target },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    const d = data as { compose?: string; services?: number };
    setArtifact(d?.compose ?? "");
    toast.success(`Assembled ${d?.services ?? 0} services`);
    load();
  };

  const stylesheet = [
    {
      selector: "node",
      style: {
        "background-color": (ele: cytoscape.NodeSingular) =>
          FED_COLORS[ele.data("federation") as string] ?? FED_COLORS.unknown,
        label: "data(label)",
        color: "#e2e8f0",
        "font-size": 9,
        "text-outline-width": 2,
        "text-outline-color": "#020617",
        "text-valign": "bottom",
        "text-margin-y": 6,
        width: 18,
        height: 18,
        "border-width": 1,
        "border-color": "#0f172a",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": "#334155",
        "target-arrow-color": "#334155",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(label)",
        "font-size": 7,
        color: "#64748b",
        "text-rotation": "autorotate",
        opacity: 0.6,
      },
    },
  ];

  return (
    <div className="px-6 py-8 space-y-6">
      <header className="rounded-xl border border-cyan-500/20 bg-slate-950/80 p-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-300">TAMV Atlas Core · CSP-α</p>
        <h1 className="text-2xl font-semibold text-slate-100 mt-1">Núcleo Proto-Cognitivo Federado</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl">
          Canon Registry · Ontological Graph · BookPI Ledger · Self-Assembly. Ingesta de repos GitHub
          OsoPanda1/* a entidades canónicas y topologías ejecutables.
        </p>
      </header>

      {/* Ingestion */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Network className="w-4 h-4 text-cyan-300" />
          <h2 className="text-sm uppercase tracking-[0.2em]">Capa 0 · Ingesta</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={repoUrl}
            onChange={(ev) => setRepoUrl(ev.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 min-w-[280px] bg-slate-900 border-slate-700 text-slate-100"
          />
          <Button onClick={() => ingest()} disabled={busy !== null}>
            <RefreshCw className={`w-4 h-4 mr-2 ${busy === "ingest" ? "animate-spin" : ""}`} />
            Ingestar repo
          </Button>
          <Button variant="outline" onClick={load}>Refrescar canon</Button>
          <Button
            onClick={() => ingestAll(3)}
            disabled={busy !== null}
            className="bg-gradient-to-r from-cyan-600 to-violet-600 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${busy === "ingest" ? "animate-spin" : ""}`} />
            Ingestar TODOS los repos OsoPanda1
          </Button>
          <Button asChild variant="ghost" className="text-cyan-300">
            <a href="/atlas-core/historial">📜 Historial</a>
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SEED_REPOS.map((r) => (
            <button
              key={r}
              onClick={() => setRepoUrl(r)}
              className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-900/60 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40"
            >
              {r.split("/").slice(-1)[0].replace(".git", "")}
            </button>
          ))}
        </div>
      </section>

      {/* Graph */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Boxes className="w-4 h-4 text-violet-300" />
            <h2 className="text-sm uppercase tracking-[0.2em]">
              Capa 2 · Ontological Graph ({entities.length} nodes · {relations.length} edges)
            </h2>
          </div>
          <div className="flex gap-1 flex-wrap">
            {Object.entries(FED_COLORS).map(([k, c]) => (
              <span key={k} className="text-[9px] text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="h-[480px] rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
          {elements.length > 0 ? (
            <CytoscapeComponent
              elements={elements}
              layout={{ name: "cose", animate: false, idealEdgeLength: () => 80 } as never}
              style={{ width: "100%", height: "100%" }}
              stylesheet={stylesheet as never}
              cy={(cy) => (cyRef.current = cy)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Canon vacío. Ingesta un repo para sembrar el grafo.
            </div>
          )}
        </div>
      </section>

      {/* Assembly */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <GitMerge className="w-4 h-4 text-emerald-300" />
          <h2 className="text-sm uppercase tracking-[0.2em]">Capa 4 · Self-Assembly</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => assemble("full")} disabled={busy !== null} variant="outline">
            Build full topology
          </Button>
          <Button onClick={() => assemble("federation:atlas")} disabled={busy !== null} variant="outline">
            Build atlas federation
          </Button>
          <Button onClick={() => assemble("federation:identity")} disabled={busy !== null} variant="outline">
            Build identity federation
          </Button>
          <Button onClick={() => assemble("rdm-node-zero")} disabled={busy !== null}>
            Build RDM Node Zero
          </Button>
        </div>
        {artifact && (
          <pre className="text-[11px] font-mono text-emerald-200 bg-slate-950 border border-emerald-900/40 rounded-lg p-4 overflow-auto max-h-72">
            {artifact}
          </pre>
        )}
      </section>

      {/* BookPI Ledger */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex items-center gap-2 text-slate-200 mb-3">
          <ScrollText className="w-4 h-4 text-amber-300" />
          <h2 className="text-sm uppercase tracking-[0.2em]">Capa 3 · BookPI Ledger (append-only)</h2>
        </div>
        <ul className="divide-y divide-slate-800 text-[11px] font-mono">
          {events.map((e) => (
            <li key={e.id} className="py-2 flex items-start gap-3">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 uppercase text-[9px]">
                {e.event_type}
              </span>
              <span className="text-slate-400">{new Date(e.created_at).toISOString().slice(0, 19)}</span>
              <span className="text-slate-200 flex-1 truncate">{e.source}</span>
              <span className="text-slate-600 truncate max-w-[160px]" title={e.hash}>{e.hash.slice(0, 12)}…</span>
            </li>
          ))}
          {events.length === 0 && (
            <li className="py-4 text-slate-500 text-center">Ledger vacío.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
