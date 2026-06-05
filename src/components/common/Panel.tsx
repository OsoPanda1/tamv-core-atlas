import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /**
   * Cambia el wrapper semántico (section por defecto).
   */
  as?: "section" | "div" | "article";
  /**
   * id opcional para asociar aria-labelledby.
   */
  id?: string;
};

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
  as: As = "section",
  id,
}: PanelProps) {
  const hasHeader = Boolean(title || eyebrow || action);
  const headingId = title && id ? `${id}-heading` : undefined;

  return (
    <As
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "rounded-sm border border-border bg-card/60 backdrop-blur-sm",
        "shadow-[0_1px_0_0_oklch(1_0_0/0.03)_inset]",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3
                id={headingId}
                className="mt-0.5 truncate text-sm font-medium tracking-tight text-foreground"
              >
                {title}
              </h3>
            )}
          </div>
          {action && (
            <div className="shrink-0 text-xs" aria-label="panel-actions">
              {action}
            </div>
          )}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </As>
  );
}

type StatProps = {
  label: string;
  value: ReactNode;
  /**
   * Delta en formato ya human-readable (ej. "+12%", "-3.4").
   */
  delta?: string;
  /**
   * Texto secundario explicativo.
   */
  hint?: string;
  /**
   * Marca el estado del delta; permite colorear según dirección.
   */
  deltaTone?: "positive" | "negative" | "neutral";
  className?: string;
};

export function Stat({
  label,
  value,
  delta,
  hint,
  deltaTone = "positive",
  className,
}: StatProps) {
  const deltaColor =
    deltaTone === "positive"
      ? "text-success"
      : deltaTone === "negative"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-sm border border-border bg-card/60 p-4",
        className,
      )}
    >
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="tabular text-2xl font-medium tracking-tight">
          {value}
        </div>
        {delta && (
          <span
            className={cn(
              "mono text-[10px] uppercase tracking-wider",
              deltaColor,
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {hint && (
        <div className="text-[11px] leading-snug text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-6 border-b border-border px-6 py-6",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2" aria-label="page-actions">
          {children}
        </div>
      )}
    </header>
  );
}
