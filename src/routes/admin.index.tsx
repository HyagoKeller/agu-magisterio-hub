import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Users, KeyRound, Server } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { useADConfig, useAccessRequests, useManagedUsers } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const ad = useADConfig();
  const reqs = useAccessRequests();
  const users = useManagedUsers();

  const pend = reqs.filter((r) => r.status === "PENDENTE").length;
  const counts = {
    sol: users.filter((u) => u.role === "SOLICITANTE").length,
    chef: users.filter((u) => u.role === "CHEFIA").length,
    coord: users.filter((u) => u.role === "COORDENADOR").length,
    admin: users.filter((u) => u.role === "SUPERADMIN").length,
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Visão Geral" }]} />
      <section className="gov-container pb-12">
        <h1 className="font-display text-2xl mb-1">Painel do Superadministrador</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gerencie integração com Active Directory, usuários, grupos e solicitações de acesso ao Portal Magistério AGU.
        </p>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Status do AD" value={ad.habilitado ? "Conectado" : "Desativado"} icon={<Server className="h-5 w-5" />} tone={ad.habilitado ? "ok" : "warn"} sub={ad.habilitado ? ad.servidor : "Configure a integração"} />
          <Card title="Solicitações pendentes" value={String(pend)} icon={<KeyRound className="h-5 w-5" />} tone={pend > 0 ? "warn" : "ok"} sub="Validação RH/Coordenação" />
          <Card title="Usuários cadastrados" value={String(users.length)} icon={<Users className="h-5 w-5" />} sub={`${counts.sol} sol · ${counts.chef} chef · ${counts.coord} coord · ${counts.admin} admin`} />
          <Card title="Última sincronização" value={ad.ultimaSincronizacao ? new Date(ad.ultimaSincronizacao).toLocaleString("pt-BR") : "Nunca"} icon={<Database className="h-5 w-5" />} sub={`A cada ${ad.intervaloSincronizacao} min`} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Quick to="/admin/ad" title="Configurar Active Directory" desc="Servidor, grupos, sincronização e SSL." />
          <Quick to="/admin/mensageria" title="Configurar mensageria" desc="Google Workspace ou Microsoft 365 para alertas." />
          <Quick to="/admin/usuarios" title="Gerenciar usuários" desc="Vincular ao AD, alterar perfis e desativar contas." />
          <Quick to="/admin/acessos" title="Validar solicitações" desc="Aprovar ou recusar pedidos de acesso externo." />
        </div>
      </section>
    </>
  );
}

function Card({ title, value, sub, icon, tone }: { title: string; value: string; sub?: string; icon: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="gov-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${tone === "warn" ? "bg-[oklch(0.95_0.05_70)] text-gov-warning" : "bg-gov-blue-light text-gov-blue"}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-xl text-gov-blue-dark">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Quick({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="gov-card hover:border-gov-blue transition-colors">
      <div className="font-semibold text-gov-blue-dark">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}
