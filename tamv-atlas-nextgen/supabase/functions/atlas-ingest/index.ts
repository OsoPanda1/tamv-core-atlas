// Atlas Core CSP-α — Repo Ingestion Edge Function
// Hash-based dedup + content versioning + retries on GitHub failures.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GH_TOKEN = Deno.env.get("GITHUB_API_TOKEN");

const FILE_PATTERNS =
  /(README\.md|\.mdx?$|package\.json$|tsconfig\.json$|docker-compose\.ya?ml$|manifest\.ya?ml$|\.prisma$)/i;

const MAX_FILES = 80;
const RAW_MAX_BYTES = 80_000;
const MAX_RETRIES = 4;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function newTraceId(ctx: string) {
  return `${ctx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

function inferFederation(path: string, content: string): string {
  const t = (path + " " + content).toLowerCase();
  if (/isni|identity|orcid|did/.test(t)) return "identity";
  if (/utamv|university|course|academ/.test(t)) return "academia";
  if (/odoo|economy|wallet|tcep/.test(t)) return "economy";
  if (/isabella|ai|cogniti|reasoning/.test(t)) return "ai";
  if (/governance|policy|anubis|audit/.test(t)) return "governance";
  if (/atlas|kernel|mdx|md-x/.test(t)) return "atlas";
  if (/wiki|book|docs/.test(t)) return "knowledge";
  return "core";
}

function inferType(path: string): string {
  if (/package\.json$/i.test(path)) return "manifest";
  if (/tsconfig\.json$/i.test(path)) return "config";
  if (/docker-compose/i.test(path)) return "topology";
  if (/\.prisma$/i.test(path)) return "schema";
  if (/README/i.test(path)) return "readme";
  if (/\.mdx?$/i.test(path)) return "document";
  if (/\.ya?ml$/i.test(path)) return "manifest";
  return "artifact";
}

function extractTitle(path: string, content: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 200);
  return (path.split("/").pop() ?? path).slice(0, 200);
}

function extractDescription(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s.*$/gm, "")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

function extractDependencies(content: string): string[] {
  const deps = new Set<string>();
  try {
    const pkg = JSON.parse(content);
    if (pkg && typeof pkg === "object") {
      for (const block of ["dependencies", "peerDependencies"]) {
        if (pkg[block] && typeof pkg[block] === "object") {
          for (const k of Object.keys(pkg[block])) deps.add(`npm:${k}`);
        }
      }
    }
  } catch { /* ignore */ }
  const linkRe = /\[\[([^\]|#]+)/g;
  let m;
  while ((m = linkRe.exec(content)) !== null) deps.add(`wiki:${m[1].trim()}`);
  return Array.from(deps).slice(0, 20);
}

async function fetchWithRetry(url: string, init?: RequestInit, label = "fetch"): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const r = await fetch(url, init);
      // Rate limit / transient errors → retry with backoff
      if (r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) {
        const ra = Number(r.headers.get("retry-after"));
        const wait = Number.isFinite(ra) && ra > 0
          ? ra * 1000
          : Math.min(15_000, 800 * 2 ** attempt) + Math.random() * 400;
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      // Primary GH rate-limit signal
      const remaining = r.headers.get("x-ratelimit-remaining");
      if (r.status === 403 && remaining === "0") {
        const reset = Number(r.headers.get("x-ratelimit-reset"));
        const waitMs = reset ? Math.max(0, reset * 1000 - Date.now()) : 30_000;
        await new Promise((res) => setTimeout(res, Math.min(waitMs, 60_000)));
        continue;
      }
      return r;
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} retries: ${(lastErr as Error)?.message ?? "unknown"}`);
}

const ghHeaders = (): HeadersInit => ({
  "User-Agent": "tamv-atlas-ingest",
  Accept: "application/vnd.github+json",
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
});

async function githubTree(owner: string, repo: string) {
  for (const br of ["main", "master"]) {
    const r = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${br}?recursive=1`,
      { headers: ghHeaders() },
      `tree:${owner}/${repo}@${br}`,
    );
    if (r.ok) return { branch: br, json: await r.json() };
  }
  throw new Error(`Repo tree not accessible: ${owner}/${repo} (main/master)`);
}

async function githubRaw(owner: string, repo: string, branch: string, path: string) {
  const r = await fetchWithRetry(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    GH_TOKEN ? { headers: { Authorization: `Bearer ${GH_TOKEN}` } } : undefined,
    `raw:${path}`,
  );
  if (!r.ok) return null;
  const text = await r.text();
  return text.slice(0, RAW_MAX_BYTES);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const repo_url: string = body.repo_url;
    const federation_hint: string | undefined = body.federation;
    const batch_id: string | undefined = body.batch_id;
    if (!repo_url) throw new Error("repo_url required");

    const parsed = parseRepoUrl(repo_url);
    if (!parsed) throw new Error("Invalid GitHub URL");

    const trace_id = newTraceId("repo.ingestion");

    const { data: runRow } = await supabase
      .from("ingestion_runs")
      .insert({
        repo_url,
        federation: federation_hint ?? null,
        status: "running",
        trace_id,
        batch_id: batch_id ?? null,
      })
      .select("id")
      .single();
    const run_id = runRow?.id as string;

    const { branch, json: tree } = await githubTree(parsed.owner, parsed.repo);
    const files = (tree.tree as Array<{ path: string; type: string }>)
      .filter((n) => n.type === "blob" && FILE_PATTERNS.test(n.path))
      .slice(0, MAX_FILES);

    const entitiesChanged: string[] = [];
    let skipped = 0;
    const relationsRows: Array<{
      source_canonical_id: string;
      target_canonical_id: string;
      relation_type: string;
    }> = [];

    for (const f of files) {
      const content = await githubRaw(parsed.owner, parsed.repo, branch, f.path);
      if (!content) continue;

      const canonical_id = `tamv://github/${parsed.owner}/${parsed.repo}#${f.path}`;
      const hash = await sha256(content);

      // Dedup: skip if existing entity has same hash
      const { data: existing } = await supabase
        .from("canon_entities")
        .select("hash, version")
        .eq("canonical_id", canonical_id)
        .maybeSingle();

      if (existing && existing.hash === hash) {
        skipped++;
        continue;
      }

      const federation = federation_hint ?? inferFederation(f.path, content);
      const type = inferType(f.path);
      const title = extractTitle(f.path, content);
      const description = extractDescription(content);
      const dependencies = extractDependencies(content);
      const nextVersion = existing ? (existing.version ?? 1) + 1 : 1;

      const { error: upErr } = await supabase
        .from("canon_entities")
        .upsert(
          {
            canonical_id,
            type,
            federation,
            title,
            description,
            dependencies,
            source_refs: [`github://${parsed.owner}/${parsed.repo}/${f.path}`],
            metadata: { branch, path: f.path, repo: `${parsed.owner}/${parsed.repo}` },
            hash,
            previous_hash: existing?.hash ?? null,
            version: nextVersion,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "canonical_id" },
        );

      if (upErr) {
        console.error("upsert entity error", upErr);
        continue;
      }

      // Historical snapshot
      await supabase.from("entity_versions").insert({
        canonical_id,
        version: nextVersion,
        hash,
        previous_hash: existing?.hash ?? null,
        title,
        description,
        metadata: { branch, path: f.path },
      });

      entitiesChanged.push(canonical_id);

      const repoCanon = `tamv://github/${parsed.owner}/${parsed.repo}`;
      relationsRows.push({
        source_canonical_id: repoCanon,
        target_canonical_id: canonical_id,
        relation_type: "CONTAINS",
      });
      for (const dep of dependencies) {
        relationsRows.push({
          source_canonical_id: canonical_id,
          target_canonical_id: dep,
          relation_type: "DEPENDS_ON",
        });
      }
    }

    // Repo container entity
    const repoCanon = `tamv://github/${parsed.owner}/${parsed.repo}`;
    await supabase.from("canon_entities").upsert(
      {
        canonical_id: repoCanon,
        type: "repository",
        federation: federation_hint ?? "core",
        title: `${parsed.owner}/${parsed.repo}`,
        description: `GitHub repository ${parsed.owner}/${parsed.repo}`,
        dependencies: [],
        source_refs: [repo_url],
        metadata: { owner: parsed.owner, repo: parsed.repo, branch },
        hash: await sha256(repoCanon),
      },
      { onConflict: "canonical_id" },
    );

    if (relationsRows.length) {
      // Dedup in-batch
      const seen = new Set<string>();
      const uniq = relationsRows.filter((r) => {
        const k = `${r.source_canonical_id}|${r.target_canonical_id}|${r.relation_type}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      await supabase.from("canon_relations").upsert(uniq, {
        onConflict: "source_canonical_id,target_canonical_id,relation_type",
      });
    }

    const batchHash = await sha256(entitiesChanged.sort().join("|") + ":" + skipped);
    await supabase.from("bookpi_events").insert({
      event_type: entitiesChanged.length ? "INGESTION" : "INGESTION_NOOP",
      entity_canonical_ids: entitiesChanged,
      source: repo_url,
      trace_id,
      hash: batchHash,
      payload: {
        files_scanned: files.length,
        entities_changed: entitiesChanged.length,
        skipped_unchanged: skipped,
        relations: relationsRows.length,
        batch_id: batch_id ?? null,
      },
    });

    await supabase
      .from("ingestion_runs")
      .update({
        status: "completed",
        files_scanned: files.length,
        entities_created: entitiesChanged.length,
        relations_created: relationsRows.length,
        skipped,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run_id);

    return new Response(
      JSON.stringify({
        ok: true,
        trace_id,
        files_scanned: files.length,
        entities: entitiesChanged.length,
        skipped,
        relations: relationsRows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("atlas-ingest error", e);
    // Best-effort: mark the most recent running run for this URL as error
    try {
      const url = (await req.clone().json().catch(() => ({})))?.repo_url as string | undefined;
      if (url) {
        await supabase
          .from("ingestion_runs")
          .update({
            status: "error",
            error: (e as Error).message.slice(0, 500),
            last_error_at: new Date().toISOString(),
            finished_at: new Date().toISOString(),
          })
          .eq("repo_url", url)
          .eq("status", "running");
      }
    } catch { /* ignore */ }
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
