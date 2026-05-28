import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, Github, KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/Panel";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Identity Layer · TAMV Core Kodex" },
      { name: "description", content: "Sovereign identity layer: ORCID, GitHub, Zenodo, Figshare and federated credentials." },
      { property: "og:title", content: "Identity Layer · TAMV" },
      { property: "og:description", content: "Federated identity for the sovereign runtime." },
    ],
  }),
  component: AuthPage,
});

const PROVIDERS = [
  { icon: KeyRound, name: "ORCID", meta: "Scientific identity · DOI scope" },
  { icon: Github, name: "GitHub", meta: "OsoPanda1 · canonical mirror" },
  { icon: ShieldCheck, name: "Zenodo", meta: "DOI batch · canon publishing" },
  { icon: Fingerprint, name: "Figshare", meta: "Open-science deposit" },
];

function AuthPage() {
  return (
    <div>
      <PageHeader
        eyebrow="IDENTITY · LAYER"
        title="Sovereign federated credentials"
        description="Capa de identidad soberana del Kodex: ORCID, GitHub, Zenodo y Figshare como credenciales canónicas, integradas al trust engine de EOCT."
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">
        <Panel eyebrow="PROVIDERS" title="Sign in with a sovereign provider" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.name} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-sm border border-border bg-secondary/40 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{p.name}</div>
                    <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.meta}</div>
                  </div>
                  <button className="mono text-[10px] uppercase tracking-wider rounded-sm border border-border bg-card px-3 py-1.5 hover:bg-secondary">
                    Connect →
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel eyebrow="CUSTODIAN" title="Canonical authority">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-sm border border-border bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-sm">
              <div className="font-medium">Edwin Oswaldo Castillo Trejo</div>
              <div className="text-muted-foreground">Anubis Villaseñor · Custodio canónico</div>
              <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                ORCID 0009-0008-5050-1539
              </div>
              <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                DOI 10.5281/zenodo.19436662
              </div>
            </div>
          </div>
          <hr className="my-5 border-border" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            La capa de identidad está preparada para integrarse a Lovable Cloud, Supabase o un
            ledger soberano externo. Toda credencial federada se valida bajo EOCT trust engine
            y queda registrada en BookPI Ledger.
          </p>
        </Panel>
      </div>
    </div>
  );
}