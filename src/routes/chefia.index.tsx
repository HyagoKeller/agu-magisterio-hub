import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/chefia/")({
  head: () => ({ meta: [{ title: "Início — Chefia | Portal Magistério AGU" }] }),
  component: DashboardChefia,
});

function DashboardChefia() {
  const { user } = useAuth();
  const all = useSolicitacoes().filter((s) => s.chefiaId === user?.id);
  const pendentes = all.filter((s) => s.status === "PENDENTE").length;
  const aprovadas = all.filter((s) => s.status === "APROVADA").length;
  const recusadas = all.filter((s) => s.status === "RECUSADA").length;

  const cards = [
    { label: "Pendentes", value: pendentes, Icon: Clock, tone: "text-gov-blue" },
    { label: "Aprovadas", value: aprovadas, Icon: CheckCircle2, tone: "text-gov-success" },
    { label: "Recusadas", value: recusadas, Icon: XCircle, tone: "text-gov-danger" },
    { label: "Total", value: all.length, Icon: FileText, tone: "text-gov-blue-dark" },
  ];

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/chefia" }]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-2">Dashboard de Aprovações</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Acompanhe e analise as solicitações de magistério da sua equipe.
        </p>

        {pendentes > 0 && (
          <div className="mb-6">
            <GovMessage tone="warning" title={`${pendentes} ${pendentes === 1 ? "solicitação aguarda" : "solicitações aguardam"} sua análise`}>
              <Link to="/chefia/pendentes" className="font-semibold underline">
                Ir para fila de aprovações →
              </Link>
            </GovMessage>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>
    </>
  );
}
