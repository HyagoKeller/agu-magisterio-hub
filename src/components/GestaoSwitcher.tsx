import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ChevronDown, BarChart3, Server } from "lucide-react";
import { useAuth, homeForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

/**
 * Atalho visível no topo do Portal apenas quando o usuário autenticado pertence
 * aos grupos de gestão no AD (ex.: GP_CGAU_Coordenacao, GP_TI_Superadmin).
 * Permite alternar para Coordenação ou Superadmin sem novo login (SSO multi-grupo).
 */
export function GestaoSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user || !user.gruposGestao || user.gruposGestao.length === 0) return null;

  const go = (role: Role) => {
    setOpen(false);
    switchRole(role);
    navigate({ to: homeForRole(role) });
  };

  const hasCoord = user.gruposGestao.includes("COORDENADOR");
  const hasAdmin = user.gruposGestao.includes("SUPERADMIN");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-gov-blue/30 bg-gov-blue-light px-3 py-1.5 text-xs font-semibold text-gov-blue-dark hover:bg-gov-blue hover:text-white transition-colors"
        title="Acesso de gestão liberado pelos seus grupos no AD"
      >
        <ShieldCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Gestão do Portal</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-md border border-border bg-card p-1.5 shadow-lg"
        >
          <div className="px-2.5 py-2 border-b border-border mb-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Acesso liberado por</div>
            <div className="text-[11px] font-mono text-gov-blue-dark mt-0.5 break-all">
              {hasCoord && <span className="block">CN=GP_CGAU_Coordenacao</span>}
              {hasAdmin && <span className="block">CN=GP_TI_Superadmin</span>}
            </div>
          </div>

          {hasCoord && (
            <button
              role="menuitem"
              onClick={() => go("COORDENADOR")}
              className="flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left hover:bg-accent"
            >
              <BarChart3 className="mt-0.5 h-4 w-4 text-gov-blue" />
              <span>
                <span className="block text-sm font-semibold text-gov-blue-dark">Coordenação CGAU/AGU</span>
                <span className="block text-[11px] text-muted-foreground">Indicadores, validações e relatórios</span>
              </span>
            </button>
          )}

          {hasAdmin && (
            <button
              role="menuitem"
              onClick={() => go("SUPERADMIN")}
              className="flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left hover:bg-accent"
            >
              <Server className="mt-0.5 h-4 w-4 text-gov-blue" />
              <span>
                <span className="block text-sm font-semibold text-gov-blue-dark">Superadministrador (TI)</span>
                <span className="block text-[11px] text-muted-foreground">AD, usuários, grupos e mensageria</span>
              </span>
            </button>
          )}

          <div className="border-t border-border mt-1 pt-1">
            <button
              role="menuitem"
              onClick={() => go("CHEFIA")}
              className="w-full rounded px-2.5 py-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-gov-blue-dark"
            >
              Voltar para Chefia Imediata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
