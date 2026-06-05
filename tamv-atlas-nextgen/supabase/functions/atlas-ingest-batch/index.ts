// Atlas mass-ingest: invokes atlas-ingest for many repos with bounded concurrency,
// returns a batch_id immediately, and lets the client poll ingestion_runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_CONCURRENCY = 3;
const MAX_CONCURRENCY = 6;

async function invokeIngest(repo_url: string, batch_id: string, federation?: string) {
  const url = `${SUPABASE_URL}/functions/v1/atlas-ingest`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({ repo_url, batch_id, federation }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T, i: number) => Promise<void>) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try { await worker(items[i], i); } catch (e) { console.error("worker error", e); }
    }
  });
  await Promise.all(workers);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    let repos: string[] = Array.isArray(body.repos) ? body.repos.filter((x: unknown) => typeof x === "string") : [];
    const owner: string | undefined = body.owner;
    const concurrency = Math.max(1, Math.min(MAX_CONCURRENCY, Number(body.concurrency) || DEFAULT_CONCURRENCY));

    // If owner provided, list public repos
    if (owner && repos.length === 0) {
      const token = Deno.env.get("GITHUB_API_TOKEN");
      const all: Array<Record<string, unknown>> = [];
      for (let page = 1; page <= 10; page++) {
        const r = await fetch(
          `https://api.github.com/users/${owner}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
          {
            headers: {
              "User-Agent": "tamv-atlas-batch",
              Accept: "application/vnd.github+json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        if (!r.ok) throw new Error(`GitHub list ${r.status}`);
        const batch = await r.json();
        if (!Array.isArray(batch) || batch.length === 0) break;
        all.push(...batch);
        if (batch.length < 100) break;
      }
      repos = all
        .filter((r) => !r.fork && !r.archived && !r.disabled)
        .map((r) => r.clone_url as string);
    }

    if (repos.length === 0) throw new Error("No repos to ingest (pass 'repos' array or 'owner')");

    const batch_id = crypto.randomUUID();

    // Pre-create pending runs so the UI can show them immediately
    await supabase.from("ingestion_runs").insert(
      repos.map((repo_url) => ({
        repo_url,
        status: "pending",
        trace_id: `batch-${batch_id.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
        batch_id,
      })),
    );

    // Fire-and-forget pool: respond now, process in background
    const task = (async () => {
      await runPool(repos, concurrency, async (repo_url) => {
        // Remove the pending placeholder so atlas-ingest's "running" row stays clean
        await supabase
          .from("ingestion_runs")
          .delete()
          .eq("batch_id", batch_id)
          .eq("repo_url", repo_url)
          .eq("status", "pending");
        await invokeIngest(repo_url, batch_id);
      });
    })();
    // @ts-ignore EdgeRuntime is provided by Supabase
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(task);
    }

    return new Response(
      JSON.stringify({ ok: true, batch_id, count: repos.length, concurrency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
