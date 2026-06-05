// Lists all public repos for a given GitHub owner (default: OsoPanda1)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const owner: string = body.owner ?? "OsoPanda1";
    const token = Deno.env.get("GITHUB_API_TOKEN");

    const repos: Array<Record<string, unknown>> = [];
    for (let page = 1; page <= 10; page++) {
      const r = await fetch(
        `https://api.github.com/users/${owner}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
        {
          headers: {
            "User-Agent": "tamv-atlas-list",
            Accept: "application/vnd.github+json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
      const batch = await r.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch);
      if (batch.length < 100) break;
    }

    const normalized = repos
      .filter((r) => !r.fork && !r.archived && !r.disabled)
      .map((r) => ({
        name: r.name,
        full_name: r.full_name,
        clone_url: r.clone_url,
        html_url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        pushed_at: r.pushed_at,
        topics: r.topics ?? [],
      }));

    return new Response(JSON.stringify({ ok: true, owner, count: normalized.length, repos: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
