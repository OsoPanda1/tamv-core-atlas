import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Search, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";

interface Run {
  id: string;
  repo_url: string;
  status: "pending" | "running" | "completed" | "error" | string;
  trace_id: string;
  files_scanned: number;
  entities_created: number;
  relations_created: number;
  skipped: number | null;
  error: string | null;
  batch_id: string | null;
  retries: number | null;
  started_at: string;
  finished_at: string | null;
  last_error_at: string | null;
}

const PAGE_SIZE = 25;

const STATUS_STYLE: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending:   { label: "Pendiente",    cls: "bg-slate-700/30 text-slate-300 border-slate-600",  Icon: Clock },
  running:   { label: "En progreso",  cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",  Icon: Loader2 },
  completed: { label: "Completado",   cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", Icon: CheckCircle2 },
  error:     { label: "Error",        cls: "bg-rose-500/15 text-rose-300 border-rose-500/40",  Icon: AlertTriangle },
};

export default function IngestionHistory() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("ingestion_runs")
      .select("*", { count: "exact" })
      .order("started_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) q = q.ilike("repo_url", `%${search.trim()}%`);

    const { data, count } = await q;
    setRuns((data ?? []) as Run[]);
    setTotal(count ?? 0);

    // status totals (separate light query)
    const { data: agg } = await supabase
      .from("ingestion_runs")
      .select("status")
      .limit(2000);
    const c: Record<string, number> = {};
    (agg ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter, search]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [autoRefresh, page, statusFilter, search]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-8 space-y-6 min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/atlas-core" className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Atlas Core
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Historial de Ingestas</h1>
          <p className="text-sm text-slate-400 mt-1">Auditoría completa de cada ejecución por repositorio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setAutoRefresh((v) => !v); }}>
            {autoRefresh ? "⏸ Pausar auto-refresh" : "▶ Auto-refresh"}
          </Button>
          <Button onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {["all", "pending", "running", "completed", "error"].map((s) => {
          const active = statusFilter === s;
          const n = s === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[s] ?? 0;
          const meta = STATUS_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`rounded-lg border p-3 text-left transition ${
                active ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {s === "all" ? "Total" : meta?.label ?? s}
              </div>
              <div className="text-xl font-semibold text-slate-100">{n}</div>
            </button>
          );
        })}
      </section>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Filtrar por URL de repo…"
            className="pl-9 bg-slate-900 border-slate-700"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-[0.15em] text-[10px]">
            <tr>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Repositorio</th>
              <th className="px-3 py-2 text-right">Archivos</th>
              <th className="px-3 py-2 text-right">Entidades</th>
              <th className="px-3 py-2 text-right">Relaciones</th>
              <th className="px-3 py-2 text-right">Sin cambios</th>
              <th className="px-3 py-2 text-left">Iniciado</th>
              <th className="px-3 py-2 text-left">Trace / Batch</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => {
              const meta = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
              const repoName = r.repo_url.split("/").slice(-2).join("/").replace(".git", "");
              return (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`${meta.cls} font-mono text-[10px]`}>
                      <meta.Icon className={`w-3 h-3 mr-1 ${r.status === "running" ? "animate-spin" : ""}`} />
                      {meta.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-200">
                    <a href={r.repo_url} target="_blank" rel="noreferrer" className="hover:text-cyan-300">
                      {repoName}
                    </a>
                    {r.error && (
                      <div className="text-[10px] text-rose-300 mt-1 truncate max-w-xl" title={r.error}>
                        ⚠ {r.error}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{r.files_scanned}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-300">{r.entities_created}</td>
                  <td className="px-3 py-2 text-right font-mono text-violet-300">{r.relations_created}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500">{r.skipped ?? 0}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {new Date(r.started_at).toLocaleString("es-MX", { hour12: false })}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                    <div title={r.trace_id} className="truncate max-w-[140px]">{r.trace_id.slice(0, 22)}…</div>
                    {r.batch_id && (
                      <div title={r.batch_id} className="text-cyan-500/70">batch:{r.batch_id.slice(0, 8)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
            {runs.length === 0 && !loading && (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">Sin ejecuciones.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>{total} ejecuciones · página {page + 1} de {pages}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Anterior</Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Siguiente →</Button>
        </div>
      </div>
    </div>
  );
}
