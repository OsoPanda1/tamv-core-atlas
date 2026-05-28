import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe2, Landmark, Microscope, Network, Users } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/common/Panel";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas / Digital Twin · TAMV" },
      { name: "description", content: "Mapa vivo del ecosistema TAMV: assets, identidades, instituciones, nodos e infraestructura soberana." },
      { property: "og:title", content: "Atlas / Digital Twin · TAMV" },
      { property: "og:description", content: "Civilizational digital twin of sovereign territories." },
    ],
  }),
  component: AtlasPage,
});

const TERRITORIES = [
  { code: "RDM", name: "Real del Monte", country: "Hidalgo, México", status: "piloto", nodes: 14, citizens: 1820 },
  { code: "ALX", name: "Alamexa", country: "Hidalgo, México", status: "activa", nodes: 9, citizens: 612 },
  { code: "UTV", name: "UTAMV Campus", country: "México", status: "activa", nodes: 7, citizens: 380 },
  { code: "CIT", name: "CITEMESH Mesh", country: "Federada", status: "activa", nodes: 52, citizens: 0 },
];

const INSTITUTIONS = [
  { icon: Landmark, name: "Custodio Canónico", meta: "Edwin O. Castillo · ORCID" },
  { icon: Microscope, name: "Ciencia Abierta", meta: "Zenodo · Figshare · OpenAIRE" },
  { icon: Building2, name: "UTAMV", meta: "Universidad TAMV" },
  { icon: Users, name: "Cooperativas territoriales", meta: "Alamexa · RDM Digital" },
  { icon: Network, name: "CITEMESH", meta: "Topología Célula F2" },
  { icon: Globe2, name: "DreamSpaces", meta: "XR / VR / 3D / 4D" },
];

function AtlasPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ATLAS · DIGITAL TWIN"
        title="Mapa civilizatorio del ecosistema TAMV"
        description="Atlas vivo de assets, identidades soberanas, instituciones, nodos territoriales e infraestructura federada."
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Territorios" value={4} hint="2 piloto · 2 activas" />
          <Stat label="Nodos físicos" value={82} delta="+6 / 30d" />
          <Stat label="Ciudadanos federados" value={"2,812"} />
          <Stat label="Instituciones" value={6} />
        </div>

        <Panel eyebrow="MAP · CIVIC TWIN" title="Federated territories" bodyClassName="p-0">
          <div className="relative grid-bg" style={{ height: 360 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute" style={{ left: "22%", top: "34%" }}>
              <Pin label="RDM" sub="Real del Monte" />
            </div>
            <div className="absolute" style={{ left: "28%", top: "44%" }}>
              <Pin label="ALX" sub="Alamexa" />
            </div>
            <div className="absolute" style={{ left: "55%", top: "30%" }}>
              <Pin label="UTV" sub="UTAMV" />
            </div>
            <div className="absolute" style={{ left: "70%", top: "60%" }}>
              <Pin label="CIT" sub="CITEMESH" />
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel eyebrow="TERRITORIES" title="Federated cells" className="lg:col-span-2" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Code</th>
                  <th className="text-left px-4 py-2 font-normal">Name</th>
                  <th className="text-left px-4 py-2 font-normal">Region</th>
                  <th className="text-left px-4 py-2 font-normal">Status</th>
                  <th className="text-right px-4 py-2 font-normal">Nodes</th>
                  <th className="text-right px-4 py-2 font-normal">Citizens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TERRITORIES.map((t) => (
                  <tr key={t.code} className="hover:bg-secondary/40">
                    <td className="px-4 py-2.5 mono text-xs text-accent">{t.code}</td>
                    <td className="px-4 py-2.5">{t.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.country}</td>
                    <td className="px-4 py-2.5 mono text-[10px] uppercase tracking-wider text-success">{t.status}</td>
                    <td className="px-4 py-2.5 text-right tabular">{t.nodes}</td>
                    <td className="px-4 py-2.5 text-right tabular">{t.citizens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel eyebrow="INSTITUTIONS" title="Sovereign services">
            <ul className="space-y-3 text-sm">
              {INSTITUTIONS.map((i) => {
                const Icon = i.icon;
                return (
                  <li key={i.name} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-sm border border-border bg-secondary/40 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm truncate">{i.name}</div>
                      <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{i.meta}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Pin({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-background animate-pulse" />
      <div className="mt-1 rounded-sm border border-border bg-card/90 px-2 py-1 backdrop-blur">
        <div className="mono text-[10px] uppercase tracking-wider text-accent">{label}</div>
        <div className="text-[11px]">{sub}</div>
      </div>
    </div>
  );
}