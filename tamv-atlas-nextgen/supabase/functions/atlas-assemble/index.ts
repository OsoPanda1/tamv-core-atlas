// Atlas Core CSP-α — Self-Assembly Engine
// Takes a target (e.g. "rdm-node-zero" | "full" | "federation:identity")
// and compiles a docker-compose topology from canon entities.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(text: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function newTraceId(ctx: string) {
  return `${ctx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function resolveImage(federation: string, type: string) {
  if (type === "schema") return "tamv/prisma:latest";
  if (federation === "identity") return "tamv/isni-core:latest";
  if (federation === "academia") return "tamv/utamv:latest";
  if (federation === "ai") return "tamv/isabella:latest";
  if (federation === "governance") return "tamv/anubis:latest";
  if (federation === "economy") return "tamv/odoo-bridge:latest";
  if (federation === "atlas") return "tamv/atlas-core:latest";
  return "tamv/generic-module:latest";
}

interface Entity {
  canonical_id: string;
  title: string;
  type: string;
  federation: string;
  dependencies: string[];
  hash: string;
}

function compileCompose(entities: Entity[]) {
  const services: Record<string, unknown> = {};
  for (const e of entities) {
    const sid = slugify(e.title || e.canonical_id);
    services[sid] = {
      image: resolveImage(e.federation, e.type),
      environment: {
        TAMV_ENTITY_ID: e.canonical_id,
        TAMV_FEDERATION: e.federation,
        TAMV_HASH: e.hash,
      },
      labels: {
        "tamv.federation": e.federation,
        "tamv.type": e.type,
      },
    };
  }
  // simple YAML serializer (no external deps)
  let yaml = `version: "3.9"\nservices:\n`;
  for (const [k, v] of Object.entries(services)) {
    const svc = v as Record<string, unknown>;
    yaml += `  ${k}:\n    image: ${svc.image}\n    environment:\n`;
    for (const [ek, ev] of Object.entries(svc.environment as Record<string, string>)) {
      yaml += `      ${ek}: "${ev}"\n`;
    }
    yaml += `    labels:\n`;
    for (const [lk, lv] of Object.entries(svc.labels as Record<string, string>)) {
      yaml += `      ${lk}: "${lv}"\n`;
    }
  }
  return yaml;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { target = "full" } = await req.json().catch(() => ({}));
    const trace_id = newTraceId("assembly");

    let query = supabase.from("canon_entities").select("*").limit(150);
    if (target.startsWith("federation:")) {
      query = query.eq("federation", target.split(":")[1]);
    } else if (target !== "full") {
      query = query.ilike("title", `%${target}%`);
    }
    const { data, error } = await query;
    if (error) throw error;

    const entities = (data ?? []) as Entity[];
    const compose = compileCompose(entities);
    const hash = await sha256(compose);

    const { data: art } = await supabase
      .from("assembly_artifacts")
      .insert({
        target,
        format: "docker-compose",
        content: compose,
        hash,
        trace_id,
        entity_canonical_ids: entities.map((e) => e.canonical_id),
      })
      .select("id")
      .single();

    await supabase.from("bookpi_events").insert({
      event_type: "ASSEMBLY",
      entity_canonical_ids: entities.map((e) => e.canonical_id),
      source: `self-assembly:${target}`,
      trace_id,
      hash,
      payload: { artifact_id: art?.id, services: entities.length },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        trace_id,
        artifact_id: art?.id,
        services: entities.length,
        compose,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
