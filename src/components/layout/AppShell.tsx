import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Boxes,
  CircleDot,
  Compass,
  FileText,
  Fingerprint,
  GitBranch,
  Globe2,
  LayoutDashboard,
  Network,
  Radar,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Atom, Database, Layers, PackageCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; badge?: string };

const PRIMARY: NavItem[] = [
  { to: "/", label: "Kodex Home", icon: LayoutDashboard },
  { to: "/console", label: "Heptafederated Console", icon: Network, badge: "7" },
  { to: "/nexus", label: "Nexus Graph", icon: GitBranch },
  { to: "/atlas", label: "Atlas / Digital Twin", icon: Globe2 },
];

const ATLAS_CORE: NavItem[] = [
  { to: "/csp", label: "Atlas Core · CSP-α", icon: Atom, badge: "α" },
  { to: "/csp/ingestion", label: "Ingestion Engine", icon: Layers },
  { to: "/csp/canon", label: "Canon Registry", icon: Database },
  { to: "/csp/ontology", label: "Ontological Graph", icon: GitBranch },
  { to: "/csp/assembly", label: "Self-Assembly", icon: PackageCheck },
];

const RUNTIME: NavItem[] = [
  { to: "/eoct", label: "EOCT Runtime", icon: ShieldCheck },
  { to: "/korima", label: "Korima Engine", icon: Compass },
  { to: "/mdx5", label: "MD-X5 Orchestration", icon: Workflow },
  { to: "/events", label: "Event Stream", icon: Activity, badge: "live" },
];

const KNOWLEDGE: NavItem[] = [
  { to: "/docs", label: "Documentation OS", icon: BookOpen },
  { to: "/wikis", label: "Wikis Canónicas", icon: BookOpen, badge: "5" },
  { to: "/auth", label: "Identity Layer", icon: Fingerprint },
];

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const { location } = useRouterState();
  return (
    <div className="mb-6">
      <div className="mono px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
        {title}
      </div>
      <nav className="flex flex-col gap-px">
        {items.map((item) => {
          const active =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                active && "bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100",
                  active && "opacity-100 text-primary",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="mono text-[10px] uppercase tracking-wider rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden md:flex w-[268px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur">
      <div className="px-5 pt-5 pb-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-start gap-3">
          <div className="relative h-9 w-9 rounded-sm border border-sidebar-border bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Boxes className="h-4 w-4 text-foreground" />
            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">TAMV Core Kodex</span>
            <span className="mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Heptafederated v1.0
            </span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup title="Sovereign Surface" items={PRIMARY} />
        <NavGroup title="Atlas Core™ · CSP-α" items={ATLAS_CORE} />
        <NavGroup title="Constitutional Runtime" items={RUNTIME} />
        <NavGroup title="Knowledge & Identity" items={KNOWLEDGE} />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <CircleDot className="h-3 w-3 text-success" />
          <span className="mono uppercase tracking-wider">All federations operational</span>
        </div>
        <div className="mono mt-1 text-[10px] text-muted-foreground/70">
          custodio · edwin o. castillo trejo
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { location } = useRouterState();
  const crumbs =
    location.pathname === "/"
      ? ["Kodex", "Home"]
      : ["Kodex", ...location.pathname.split("/").filter(Boolean)];
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur px-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span
              className={cn(
                "mono uppercase tracking-wider",
                i === crumbs.length - 1 && "text-foreground",
              )}
            >
              {c}
            </span>
            {i < crumbs.length - 1 && <span className="opacity-40">/</span>}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="hidden md:flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1 mono text-[11px] text-muted-foreground">
          <Radar className="h-3 w-3 text-success" />
          <span>HORUS · ANUBIS · OJO DE RA</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1 mono text-[11px] text-muted-foreground tabular">
          <FileText className="h-3 w-3" />
          DOI 10.5281/zenodo.19436662
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1 mono text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          LIVE
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
