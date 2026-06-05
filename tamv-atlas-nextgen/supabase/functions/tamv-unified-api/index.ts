// TAMV Unified API — ISNI / UTAMV / MD-X kernel
// Single edge function dispatching by `action` to keep cold-starts low.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Lightweight signature using HMAC over a project-level secret.
const SIGN_SECRET = Deno.env.get("LOVABLE_API_KEY") ?? "tamv-dev-secret";
async function signPayload(payload: unknown): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SIGN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "";
    const payload: Record<string, unknown> = body.payload ?? {};

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await userClient.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    let result: unknown = null;

    switch (action) {
      // ─── ISNI ───
      case "identity.resolve": {
        const identifier = String(payload.identifier ?? "");
        if (!identifier) return json({ error: "identifier required" }, 400);
        const { data, error } = await userClient
          .from("isni_entities")
          .select("*")
          .or(`isni.eq.${identifier},identifiers.cs.[{"value":"${identifier}"}]`)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        result = data;
        break;
      }

      case "identity.list": {
        const limit = Math.min(Number(payload.limit ?? 50), 200);
        const { data, error } = await userClient
          .from("isni_entities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        result = data;
        break;
      }

      case "identity.register": {
        if (!userId) return json({ error: "Unauthorized" }, 401);
        const entity = {
          isni: String(payload.isni ?? `ISNI-${crypto.randomUUID()}`),
          entity_type: String(payload.entity_type ?? "person"),
          display_name: String(payload.display_name ?? "Unnamed"),
          identifiers: payload.identifiers ?? [],
          metadata: payload.metadata ?? {},
          is_public: Boolean(payload.is_public ?? true),
          owner_id: userId,
        };
        const { data, error } = await userClient
          .from("isni_entities")
          .insert(entity)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ─── Credentials (VC) ───
      case "credentials.issue": {
        if (!userId) return json({ error: "Unauthorized" }, 401);
        const holderId = String(payload.holder_entity_id ?? "");
        const vcType = String(payload.vc_type ?? "UTAMVCredential");
        const issuerDid = String(payload.issuer_did ?? "did:tamv:isni:root");
        const claims = payload.claims ?? {};
        if (!holderId) return json({ error: "holder_entity_id required" }, 400);

        const vcPayload = {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", vcType],
          issuer: issuerDid,
          issuanceDate: new Date().toISOString(),
          credentialSubject: { id: holderId, ...(claims as object) },
        };
        const signature = await signPayload(vcPayload);
        const vcId = `urn:vc:tamv:${crypto.randomUUID()}`;

        const { data, error } = await admin
          .from("isni_credentials")
          .insert({
            vc_id: vcId,
            holder_entity_id: holderId,
            issuer_did: issuerDid,
            vc_type: vcType,
            payload: vcPayload,
            signature,
            status: "active",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "credentials.verify": {
        const vcId = String(payload.vc_id ?? "");
        if (!vcId) return json({ error: "vc_id required" }, 400);
        const { data, error } = await userClient
          .from("isni_credentials")
          .select("*")
          .eq("vc_id", vcId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          result = { valid: false, reason: "not_found" };
          break;
        }
        const expected = await signPayload(data.payload);
        const valid = expected === data.signature && data.status === "active";
        result = { valid, status: data.status, vc: data };
        break;
      }

      // ─── MD-X kernel ───
      case "mdx.modules.list": {
        const { data, error } = await userClient
          .from("mdx_modules")
          .select("*")
          .order("module_code");
        if (error) throw error;
        result = data;
        break;
      }

      case "mdx.modules.heartbeat": {
        const code = String(payload.module_code ?? "");
        if (!code) return json({ error: "module_code required" }, 400);
        const { data, error } = await admin
          .from("mdx_modules")
          .update({
            last_heartbeat: new Date().toISOString(),
            status: String(payload.status ?? "healthy"),
            metrics: payload.metrics ?? {},
          })
          .eq("module_code", code)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "system.health": {
        const { data, error } = await userClient
          .from("mdx_modules")
          .select("module_code, federation, status, version, last_heartbeat");
        if (error) throw error;
        const summary = {
          total: data?.length ?? 0,
          healthy: data?.filter((m) => m.status === "healthy").length ?? 0,
          degraded: data?.filter((m) => m.status === "degraded").length ?? 0,
          down: data?.filter((m) => m.status === "down").length ?? 0,
          last_check: new Date().toISOString(),
          modules: data,
        };
        result = summary;
        break;
      }

      // ─── UTAMV ───
      case "utamv.courses.list": {
        const { data, error } = await userClient
          .from("utamv_courses")
          .select("*")
          .eq("is_published", true)
          .order("code");
        if (error) throw error;
        result = data;
        break;
      }

      case "utamv.enroll": {
        if (!userId) return json({ error: "Unauthorized" }, 401);
        const courseId = String(payload.course_id ?? "");
        if (!courseId) return json({ error: "course_id required" }, 400);
        const { data, error } = await userClient
          .from("utamv_enrollments")
          .upsert(
            { user_id: userId, course_id: courseId },
            { onConflict: "user_id,course_id" },
          )
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "utamv.progress": {
        if (!userId) return json({ error: "Unauthorized" }, 401);
        const { data, error } = await userClient
          .from("utamv_enrollments")
          .select("*, course:utamv_courses(*)")
          .eq("user_id", userId);
        if (error) throw error;
        result = data;
        break;
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }

    // Audit log (best-effort; ignore failures)
    const hash = await sha256Hex(JSON.stringify({ action, payload, result }));
    await admin.from("mdx_audit_log").insert({
      domain: action.split(".")[0] ?? "system",
      action,
      actor_id: userId,
      payload,
      result: { ok: true },
      hash,
    });

    return json({ ok: true, action, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("tamv-unified-api error:", message);
    return json({ ok: false, error: message }, 500);
  }
});
