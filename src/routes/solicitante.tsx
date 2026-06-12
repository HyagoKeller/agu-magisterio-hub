import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, ArrowUp } from "lucide-react";
import { GovHeader } from "@/components/GovHeader";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/solicitante")({
  component: SolicitanteLayout,
});

function SolicitanteLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const all = useSolicitacoes();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
    else if (user.role !== "SOLICITANTE") navigate({ to: "/" });
  }, [user, navigate]);

  if (!user || user.role !== "SOLICITANTE") return null;

  const minhas = all.filter((s) => s.solicitanteId === user.id);
  const pendentes = minhas.filter((s) => s.status === "PENDENTE").length;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader
        perfilLabel="Solicitante — Membro AGU"
        unread={pendentes}
        nav={[
          { to: "/solicitante", label: "Início" },
          { to: "/solicitante/minhas", label: "Minhas Solicitações" },
          { to: "/faq", label: "Dúvidas? FAQ" },
        ]}
        rightAction={
          <div className="hidden sm:flex flex-col items-end gap-1.5">
            <Link
              to="/solicitante/nova"
              title="Use para registrar uma nova atividade de magistério no semestre ou para corrigir dados de uma solicitação já aprovada."
              aria-label="Nova Solicitação — registrar nova atividade de magistério ou corrigir dados de uma solicitação já aprovada"
              className="inline-flex items-center gap-2 rounded-full bg-gov-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-md ring-2 ring-gov-yellow/60 ring-offset-2 ring-offset-background animate-pulse-soft"
            >
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Link>
            <div className="flex items-start gap-1.5 max-w-[260px]">
              <ArrowUp className="h-4 w-4 text-gov-red shrink-0 mt-0.5 animate-bounce-soft" aria-hidden />
              <span className="rounded-md bg-[oklch(0.97_0.09_95)] border border-gov-yellow px-2 py-1 text-[11px] leading-tight text-gov-blue-dark font-semibold shadow-sm">
                Clique aqui para <u>registrar nova atividade</u> no semestre ou <u>corrigir solicitação aprovada</u>
              </span>
            </div>
          </div>
        }
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
