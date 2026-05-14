import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GovHeader } from "@/components/GovHeader";
import { useAuth } from "@/lib/auth";
import { useAccessRequests } from "@/lib/admin-store";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reqs = useAccessRequests();

  useEffect(() => {
    if (!user || user.role !== "SUPERADMIN") navigate({ to: "/" });
  }, [user, navigate]);

  if (!user || user.role !== "SUPERADMIN") return null;

  const pend = reqs.filter((r) => r.status === "PENDENTE").length;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader
        perfilLabel="Superadministrador"
        unread={pend}
        nav={[
          { to: "/admin", label: "Visão Geral" },
          { to: "/admin/ad", label: "Integração AD" },
          { to: "/admin/mensageria", label: "Mensageria" },
          { to: "/admin/usuarios", label: "Usuários e Grupos" },
          { to: "/admin/acessos", label: "Solicitações de Acesso", badge: pend || undefined },
        ]}
      />
      <main><Outlet /></main>
    </div>
  );
}
