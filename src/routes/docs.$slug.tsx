import { createFileRoute, Link } from "@tanstack/react-router";

function prettify(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Route = createFileRoute("/docs/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} · Kodex Docs` },
      { name: "description", content: `Entrada canónica del Kodex TAMV: ${prettify(params.slug)}.` },
      { property: "og:title", content: `${prettify(params.slug)} · Kodex Docs` },
      { property: "og:description", content: "Sovereign documentation entry." },
    ],
  }),
  component: DocsEntry,
});

function DocsEntry() {
  const { slug } = Route.useParams();
  const title = prettify(slug);
  return (
    <article className="max-w-3xl">
      <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">KODEX · DOCS</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        Entrada documental canónica del Kodex TAMV. Este nodo se sincroniza con el BookPI Ledger
        y publica sus revisiones en Zenodo bajo el DOI del canon científico.
      </p>
      <h2 className="mt-8 text-base font-medium tracking-tight">Resumen</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Sección reservada. El contenido completo se carga desde el repositorio canónico
        <code className="mono mx-1">docs/canon</code> y se renderiza con backlinks
        bidireccionales hacia el Nexus Graph.
      </p>
      <h2 className="mt-8 text-base font-medium tracking-tight">Referencias</h2>
      <ul className="mt-2 text-sm text-muted-foreground space-y-1.5">
        <li>· ORCID 0009-0008-5050-1539</li>
        <li>· DOI 10.5281/zenodo.19436662</li>
        <li>· Custodio canónico · Edwin O. Castillo Trejo</li>
      </ul>
      <div className="mt-8">
        <Link to="/docs" className="mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
          ← Back to Documentation OS
        </Link>
      </div>
    </article>
  );
}