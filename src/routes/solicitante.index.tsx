import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FileText, Gavel, Plus, XCircle } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { StatusTag } from "@/components/StatusTag";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";
import { addBusinessDays, dentroPrazoRecurso } from "@/lib/types";

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

  const recursaveis = minhas.filter(
    (s) => s.status === "RECUSADA" && !s.recurso && dentroPrazoRecurso(s.dataDecisao)
  );
  const recursosEmAndamento = minhas.filter((s) => s.recurso);

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
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h1 className="font-display text-2xl">Olá, {user?.nome.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas solicitações de magistério.
            </p>
          </div>
          <Link
            to="/solicitante/nova"
            title="Use para registrar uma nova atividade de magistério no semestre ou para corrigir dados de uma solicitação já aprovada."
            className="sm:hidden inline-flex items-center gap-2 rounded-full bg-gov-red px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Link>
        </div>

        <div className="mb-6 rounded-md border border-gov-blue/20 bg-gov-blue-light/50 px-4 py-3 text-sm text-gov-blue-dark">
          <strong>Quando usar “Nova Solicitação”?</strong> Clique no botão vermelho{" "}
          <span className="font-semibold">Nova Solicitação</span> para{" "}
          <strong>registrar uma nova atividade de magistério no semestre</strong> ou para{" "}
          <strong>corrigir dados de uma solicitação já aprovada</strong>.
        </div>

        {recursaveis.length > 0 && (
          <div className="mb-6">
            <GovMessage tone="warning" title="Você pode entrar com Recurso">
              <p className="mb-2 text-sm">
                {recursaveis.length === 1
                  ? "Uma solicitação sua foi recusada e ainda está dentro do prazo de recurso (5 dias úteis)."
                  : `${recursaveis.length} solicitações suas foram recusadas e ainda estão dentro do prazo de recurso (5 dias úteis).`}
                {" "}O recurso pode ser interposto <strong>uma única vez</strong>.
              </p>
              <ul className="mb-3 space-y-1 text-sm">
                {recursaveis.map((s) => {
                  const prazo = s.dataDecisao ? addBusinessDays(new Date(s.dataDecisao), 5) : null;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gov-blue-dark">{s.protocolo}</span>
                      <span className="text-xs text-muted-foreground">
                        prazo final: {prazo?.toLocaleDateString("pt-BR")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link
                to="/solicitante/minhas"
                className="inline-flex items-center gap-2 rounded-full bg-gov-red px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <Gavel className="h-3.5 w-3.5" /> Entrar com Recurso
              </Link>
            </GovMessage>
          </div>
        )}

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

        {recursosEmAndamento.length > 0 && (
          <div className="gov-card mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg flex items-center gap-2">
                <Gavel className="h-5 w-5 text-gov-blue" /> Meus Recursos
              </h2>
              <Link to="/solicitante/minhas" className="text-sm font-semibold text-gov-blue hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recursosEmAndamento.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-semibold text-gov-blue-dark">{s.protocolo}</div>
                    <div className="text-xs text-muted-foreground">
                      Recurso protocolado em {new Date(s.recurso!.dataSolicitacao).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    s.recurso!.status === "PENDENTE" ? "bg-[oklch(0.95_0.06_75)] text-[oklch(0.45_0.15_60)]" :
                    s.recurso!.status === "ACEITO" ? "bg-[oklch(0.94_0.08_145)] text-gov-success" :
                    "bg-[oklch(0.95_0.05_27)] text-gov-danger"
                  }`}>
                    Recurso {s.recurso!.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
