import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FileText, Plus, XCircle } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { StatusTag } from "@/components/StatusTag";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/solicitante/")({
  head: () => ({
    meta: [{ title: "Início — Solicitante | Portal Magistério AGU" }],
  }),
  component: DashboardSolicitante,
});

function DashboardSolicitante() {
  const { user } = useAuth();
  const all = useSolicitacoes();
  const minhas = all.filter((s) => s.solicitanteId === user?.id);
  const total = minhas.length;
  const pendentes = minhas.filter((s) => s.status === "PENDENTE").length;
  const aprovadas = minhas.filter((s) => s.status === "APROVADA").length;
  const recusadas = minhas.filter((s) => s.status === "RECUSADA").length;
  const recentes = [...minhas]
    .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura))
    .slice(0, 5);

  const cards = [
    { label: "Total de solicitações", value: total, Icon: FileText, tone: "text-gov-blue" },
    { label: "Aguardando aprovação", value: pendentes, Icon: Clock, tone: "text-gov-blue" },
    { label: "Aprovadas", value: aprovadas, Icon: CheckCircle2, tone: "text-gov-success" },
    { label: "Recusadas", value: recusadas, Icon: XCircle, tone: "text-gov-danger" },
  ];

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/solicitante" }]} />
      <section className="gov-container pb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl">Olá, {user?.nome.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas solicitações de magistério.
            </p>
          </div>
          <Link
            to="/solicitante/nova"
            className="sm:hidden inline-flex items-center gap-2 rounded-full bg-gov-red px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="gov-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.Icon className={`h-5 w-5 ${c.tone}`} />
              </div>
              <div className="mt-2 font-display text-3xl text-gov-blue-dark">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="gov-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Últimas solicitações</h2>
            <Link to="/solicitante/minhas" className="text-sm font-semibold text-gov-blue hover:underline">
              Ver todas
            </Link>
          </div>
          {recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não enviou nenhuma solicitação.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentes.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-semibold text-gov-blue-dark">{s.protocolo}</div>
                    <div className="text-xs text-muted-foreground">
                      Aberta em {new Date(s.dataAbertura).toLocaleDateString("pt-BR")} • {s.unidade}
                    </div>
                  </div>
                  <StatusTag status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
