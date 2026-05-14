import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
        ]}
        rightAction={
          <Link
            to="/solicitante/nova"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gov-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Link>
        }
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
