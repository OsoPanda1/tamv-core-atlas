import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { marked } from "marked";
import { getWiki, WIKIS } from "@/lib/wikis";

export const Route = createFileRoute("/wikis/$slug")({
  head: ({ params }) => {
    const w = getWiki(params.slug);
    return {
      meta: [
        { title: `${w?.title ?? params.slug} · Wiki TAMV` },
        { name: "description", content: w?.description ?? "Wiki canónica TAMV." },
        { property: "og:title", content: w?.title ?? params.slug },
        { property: "og:description", content: w?.description ?? "Wiki canónica TAMV." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!getWiki(params.slug)) throw notFound();
    return null;
  },
  notFoundComponent: () => (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Wiki no encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Slugs disponibles: {WIKIS.map((w) => w.slug).join(", ")}
      </p>
      <Link to="/wikis" className="mono text-[10px] uppercase mt-4 inline-block">
        ← Volver
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Error renderizando wiki</h1>
      <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{String(error)}</pre>
    </div>
  ),
  component: WikiEntry,
});

marked.setOptions({ gfm: true, breaks: false });

function WikiEntry() {
  const { slug } = Route.useParams();
  const wiki = getWiki(slug)!;
  const html = marked.parse(wiki.body) as string;
  return (
    <article className="max-w-4xl">
      <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {wiki.repo}
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{wiki.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{wiki.description}</p>
      <div className="mono text-[10px] text-muted-foreground/70 mt-2">
        {wiki.lines.toLocaleString()} líneas · seed canónico offline
      </div>
      <div
        className="prose prose-invert prose-sm mt-8 max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base
          prose-a:text-foreground prose-a:underline-offset-4
          prose-code:text-foreground prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-secondary prose-pre:border prose-pre:border-border
          prose-table:text-xs prose-th:border prose-td:border prose-th:px-2 prose-td:px-2
          prose-blockquote:border-l-foreground/30"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-10">
        <Link
          to="/wikis"
          className="mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Wikis canónicas
        </Link>
      </div>
    </article>
  );
}
