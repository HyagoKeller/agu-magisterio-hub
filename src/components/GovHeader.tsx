import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  badge?: number;
}

interface GovHeaderProps {
  perfilLabel: string;
  nav: NavItem[];
  unread?: number;
  rightAction?: React.ReactNode;
}

export function GovHeader({ perfilLabel, nav, unread = 0, rightAction }: GovHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="border-b border-border bg-card">
      {/* Faixa gov.br */}
      <div className="bg-gov-blue-dark text-white text-xs">
        <div className="gov-container flex h-7 items-center justify-between">
          <a href="https://www.gov.br" className="font-display font-semibold tracking-wide">
            gov.br
          </a>
          <span className="opacity-80">Advocacia-Geral da União</span>
        </div>
      </div>

      {/* Cabeçalho principal */}
      <div className="gov-container flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gov-blue text-white font-display font-bold">
            AGU
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold leading-tight text-gov-blue-dark truncate">
              Portal Magistério AGU
            </div>
            <div className="text-xs text-muted-foreground truncate">{perfilLabel}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {rightAction}
          <button
            type="button"
            aria-label={`Notificações: ${unread} não lidas`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gov-blue-dark hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gov-red px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </button>
          {user && (
            <div className="hidden md:flex items-center gap-3 border-l border-border pl-3">
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold text-gov-blue-dark">{user.nome}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                aria-label="Sair"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-gov-blue-dark hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-gov-blue-dark"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navegação */}
      <nav
        aria-label="Navegação principal"
        className={`border-t border-border bg-card ${open ? "block" : "hidden md:block"}`}
      >
        <div className="gov-container flex flex-col md:flex-row md:items-stretch">
          {nav.map((n) => {
            const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "text-gov-blue border-b-[3px] border-gov-blue"
                    : "text-foreground/80 hover:text-gov-blue border-b-[3px] border-transparent"
                }`}
              >
                {n.label}
                {n.badge ? (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gov-red px-1.5 text-[11px] font-semibold text-white">
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export function GovBreadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="gov-container py-3 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {it.to ? (
              <Link to={it.to} className="text-gov-blue hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-foreground">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
