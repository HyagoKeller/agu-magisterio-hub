import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GovHeader } from "@/components/GovHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/coordenador")({
  component: CoordLayout,
});

function CoordLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "COORDENADOR") navigate({ to: "/" });
  }, [user, navigate]);

  if (!user || user.role !== "COORDENADOR") return null;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader
        perfilLabel="Coordenação CGU/AGU"
        nav={[
          { to: "/coordenador", label: "Dashboard" },
          { to: "/coordenador/todas", label: "Todas as Solicitações" },
          { to: "/coordenador/relatorios", label: "Relatórios" },
        ]}
      />
      <main><Outlet /></main>
    </div>
  );
}
