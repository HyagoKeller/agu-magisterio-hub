import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GovHeader } from "@/components/GovHeader";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/chefia")({
  component: ChefiaLayout,
});

function ChefiaLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const all = useSolicitacoes();

  useEffect(() => {
    if (!user || user.role !== "CHEFIA") navigate({ to: "/" });
  }, [user, navigate]);

  if (!user || user.role !== "CHEFIA") return null;

  const pendentes = all.filter((s) => s.chefiaId === user.id && s.status === "PENDENTE").length;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader
        perfilLabel="Chefia Imediata"
        unread={pendentes}
        nav={[
          { to: "/chefia", label: "Início" },
          { to: "/chefia/pendentes", label: "Aprovações Pendentes", badge: pendentes || undefined },
          { to: "/chefia/historico", label: "Histórico" },
        ]}
      />
      <main><Outlet /></main>
    </div>
  );
}
