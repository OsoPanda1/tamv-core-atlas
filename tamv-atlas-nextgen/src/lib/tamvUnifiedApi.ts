// TAMV Unified API client — dispatches to the `tamv-unified-api` edge function.
import { supabase } from "@/integrations/supabase/client";

export type TamvAction =
  | "identity.resolve"
  | "identity.list"
  | "identity.register"
  | "credentials.issue"
  | "credentials.verify"
  | "mdx.modules.list"
  | "mdx.modules.heartbeat"
  | "system.health"
  | "utamv.courses.list"
  | "utamv.enroll"
  | "utamv.progress";

export async function tamvCall<T = unknown>(
  action: TamvAction,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("tamv-unified-api", {
    body: { action, payload },
  });
  if (error) throw error;
  if (data && typeof data === "object" && "ok" in data && data.ok === false) {
    throw new Error((data as { error?: string }).error ?? "TAMV API error");
  }
  return (data as { data: T }).data;
}

// Convenience wrappers
export const tamv = {
  resolveIdentity: (identifier: string) =>
    tamvCall("identity.resolve", { identifier }),
  listIdentities: (limit = 50) => tamvCall("identity.list", { limit }),
  registerIdentity: (entity: {
    display_name: string;
    entity_type?: "person" | "organization" | "territory" | "project";
    isni?: string;
    identifiers?: Array<{ scheme: string; value: string }>;
    metadata?: Record<string, unknown>;
    is_public?: boolean;
  }) => tamvCall("identity.register", entity),

  issueCredential: (input: {
    holder_entity_id: string;
    vc_type?: string;
    issuer_did?: string;
    claims?: Record<string, unknown>;
  }) => tamvCall("credentials.issue", input),
  verifyCredential: (vc_id: string) =>
    tamvCall<{ valid: boolean; status: string; vc: unknown }>(
      "credentials.verify",
      { vc_id },
    ),

  listModules: () => tamvCall("mdx.modules.list"),
  systemHealth: () =>
    tamvCall<{
      total: number;
      healthy: number;
      degraded: number;
      down: number;
      last_check: string;
      modules: Array<{
        module_code: string;
        federation: string;
        status: string;
        version: string;
        last_heartbeat: string;
      }>;
    }>("system.health"),

  listCourses: () => tamvCall("utamv.courses.list"),
  enroll: (course_id: string) => tamvCall("utamv.enroll", { course_id }),
  myProgress: () => tamvCall("utamv.progress"),
};
