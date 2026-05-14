import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { StatusTag } from "@/components/StatusTag";
import { GovMessage } from "@/components/GovMessage";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";
import type { Solicitacao, SolicitacaoStatus } from "@/lib/types";

export const Route = createFileRoute("/solicitante/minhas")({
  head: () => ({
    meta: [{ title: "Minhas Solicitações — Portal Magistério AGU" }],
  }),
  component: MinhasSolicitacoes,
});

function MinhasSolicitacoes() {
  const { user } = useAuth();
  const all = useSolicitacoes();
  const [filtro, setFiltro] = useState<"TODAS" | SolicitacaoStatus>("TODAS");
  const [detalhe, setDetalhe] = useState<Solicitacao | null>(null);

  const minhas = useMemo(
    () =>
      all
        .filter((s) => s.solicitanteId === user?.id)
        .filter((s) => filtro === "TODAS" || s.status === filtro)
        .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura)),
    [all, user, filtro]
  );

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Início", to: "/solicitante" },
        { label: "Minhas Solicitações" },
      ]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Minhas Solicitações</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Acompanhe o andamento e o histórico de cada solicitação.
        </p>

        <div className="gov-card">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold" htmlFor="filtro-status">Filtrar por status</label>
            <select
              id="filtro-status"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as typeof filtro)}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
            >
              <option value="TODAS">Todas</option>
              <option value="PENDENTE">Em andamento</option>
              <option value="APROVADA">Aprovadas</option>
              <option value="RECUSADA">Recusadas</option>
            </select>
            <span className="ml-auto text-sm text-muted-foreground">
              {minhas.length} {minhas.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de solicitações de magistério</caption>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <Th>Protocolo</Th>
                  <Th>Semestre</Th>
                  <Th>Data de Abertura</Th>
                  <Th>Chefia Indicada</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {minhas.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma solicitação encontrada.</td></tr>
                )}
                {minhas.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                    <Td>{s.semestre}</Td>
                    <Td>{new Date(s.dataAbertura).toLocaleDateString("pt-BR")}</Td>
                    <Td>{s.chefiaNome}</Td>
                    <Td><StatusTag status={s.status} /></Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => setDetalhe(s)}
                        className="inline-flex items-center gap-1 rounded-md border border-gov-blue px-3 py-1.5 text-xs font-semibold text-gov-blue hover:bg-accent"
                      >
                        Detalhes <ChevronRight className="h-3 w-3" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {detalhe && <DetalheDrawer s={detalhe} onClose={() => setDetalhe(null)} />}
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

export function DetalheDrawer({ s, onClose }: { s: Solicitacao; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="h-full w-full max-w-lg overflow-y-auto bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs text-muted-foreground">Protocolo</div>
            <div className="font-display text-lg text-gov-blue-dark">{s.protocolo}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gov-blue-dark hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <StatusTag status={s.status} />
            <span className="text-xs text-muted-foreground">
              Aberta em {new Date(s.dataAbertura).toLocaleString("pt-BR")}
            </span>
          </div>

          {s.status === "RECUSADA" && s.justificativaRecusa && (
            <GovMessage tone="danger" title="Justificativa da recusa">
              {s.justificativaRecusa}
            </GovMessage>
          )}
          {s.status === "APROVADA" && (
            <GovMessage tone="success" title="Solicitação aprovada">
              Sua solicitação foi aprovada pela chefia imediata.
            </GovMessage>
          )}

          <dl className="grid grid-cols-2 gap-4">
            <Info label="Solicitante" value={s.solicitanteNome} full />
            <Info label="CPF" value={s.cpf} />
            <Info label="SIAPE" value={s.siape} />
            <Info label="Cargo" value={s.cargo} full />
            <Info label="UF" value={s.uf} />
            <Info label="Unidade" value={s.unidade} />
            <Info label="Chefia" value={s.chefiaNome} full />
            <Info label="Formação" value={s.formacao || "—"} />
            <Info label="Tipo" value={s.tipoSolicitacao} />
          </dl>

          <div>
            <h3 className="mb-2 font-display text-base">Histórico de movimentações</h3>
            <ol className="space-y-3 border-l-2 border-gov-blue/30 pl-4">
              {s.historico.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-gov-blue" />
                  <div className="text-sm font-semibold text-gov-blue-dark">{h.evento}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.data).toLocaleString("pt-BR")} • {h.autor}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
