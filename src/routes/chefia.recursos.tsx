import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { SolicitacaoDetalhe } from "@/components/SolicitacaoDetalhe";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes, store } from "@/lib/store";
import type { Solicitacao } from "@/lib/types";

export const Route = createFileRoute("/chefia/recursos")({
  head: () => ({ meta: [{ title: "Recursos — Chefia | Portal Magistério AGU" }] }),
  component: RecursosChefia,
});

type Aba = "PENDENTE" | "ACEITO" | "REJEITADO";

function RecursosChefia() {
  const { user } = useAuth();
  const all = useSolicitacoes();
  const [aba, setAba] = useState<Aba>("PENDENTE");
  const [analisando, setAnalisando] = useState<Solicitacao | null>(null);

  const recursos = useMemo(
    () =>
      all
        .filter((s) => s.chefiaId === user?.id && s.recurso)
        .filter((s) => s.recurso!.status === aba)
        .sort((a, b) => (b.recurso?.dataSolicitacao || "").localeCompare(a.recurso?.dataSolicitacao || "")),
    [all, user, aba]
  );

  const counts = useMemo(() => {
    const mine = all.filter((s) => s.chefiaId === user?.id && s.recurso);
    return {
      PENDENTE: mine.filter((s) => s.recurso!.status === "PENDENTE").length,
      ACEITO: mine.filter((s) => s.recurso!.status === "ACEITO").length,
      REJEITADO: mine.filter((s) => s.recurso!.status === "REJEITADO").length,
    };
  }, [all, user]);

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/chefia" }, { label: "Recursos" }]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Recursos de Recusa</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Recursos interpostos pelos solicitantes após recusa. O solicitante pode recorrer uma única vez, em até 5 dias úteis.
        </p>

        <div role="tablist" className="mb-4 flex flex-wrap gap-2 border-b border-border">
          {(["PENDENTE", "ACEITO", "REJEITADO"] as Aba[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={aba === k}
              onClick={() => setAba(k)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-[3px] -mb-px ${
                aba === k ? "border-gov-blue text-gov-blue" : "border-transparent text-muted-foreground hover:text-gov-blue"
              }`}
            >
              {k === "PENDENTE" && <Clock className="h-4 w-4" />}
              {k === "ACEITO" && <CheckCircle2 className="h-4 w-4 text-gov-success" />}
              {k === "REJEITADO" && <XCircle className="h-4 w-4 text-gov-danger" />}
              {k === "PENDENTE" ? "Pendentes" : k === "ACEITO" ? "Aceitos" : "Rejeitados"}
              <span className="rounded-full bg-muted px-2 text-[11px]">{counts[k]}</span>
            </button>
          ))}
        </div>

        <div className="gov-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <Th>Protocolo</Th>
                <Th>Solicitante</Th>
                <Th>Recusada em</Th>
                <Th>Recurso em</Th>
                {aba !== "PENDENTE" && <Th>Decisão em</Th>}
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {recursos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhum recurso {aba.toLowerCase()}.
                  </td>
                </tr>
              )}
              {recursos.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                  <Td>{s.solicitanteNome}</Td>
                  <Td className="text-xs">{s.dataDecisao ? new Date(s.dataDecisao).toLocaleDateString("pt-BR") : "—"}</Td>
                  <Td className="text-xs">{new Date(s.recurso!.dataSolicitacao).toLocaleDateString("pt-BR")}</Td>
                  {aba !== "PENDENTE" && (
                    <Td className="text-xs">{s.recurso?.decisaoData ? new Date(s.recurso.decisaoData).toLocaleDateString("pt-BR") : "—"}</Td>
                  )}
                  <Td className="text-right">
                    <button
                      onClick={() => setAnalisando(s)}
                      className="inline-flex rounded-full bg-gov-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-gov-blue-dark"
                    >
                      {aba === "PENDENTE" ? "Analisar Recurso" : "Ver detalhes"}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {analisando && (
        <AnaliseRecursoDrawer
          s={analisando}
          onClose={() => setAnalisando(null)}
        />
      )}
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

function AnaliseRecursoDrawer({ s, onClose }: { s: Solicitacao; onClose: () => void }) {
  const { user } = useAuth();
  const [comentario, setComentario] = useState("");
  const navigate = useNavigate();
  const isPendente = s.recurso?.status === "PENDENTE";

  const decidir = (decisao: "ACEITO" | "REJEITADO") => {
    if (!user) return;
    if (decisao === "REJEITADO" && comentario.trim().length < 10) {
      toast.error("Informe um comentário (mín. 10 caracteres) para rejeitar o recurso.");
      return;
    }
    store.decidirRecurso(s.id, decisao, user.nome, comentario.trim() || undefined);
    toast.success(decisao === "ACEITO" ? "Recurso aceito — solicitação reaprovada." : "Recurso rejeitado.");
    onClose();
    navigate({ to: "/chefia/recursos" });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside className="h-full w-full max-w-3xl overflow-y-auto bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs text-muted-foreground">Recurso ao protocolo</div>
            <div className="font-display text-lg text-gov-blue-dark">{s.protocolo}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gov-blue-dark hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-5 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Solicitante</div>
            <div className="text-sm">{s.solicitanteNome} • {s.unidade}</div>
          </div>

          <GovMessage tone="danger" title="Justificativa da recusa original">
            {s.justificativaRecusa || "—"}
          </GovMessage>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Recurso apresentado pelo solicitante
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {s.recurso?.texto}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Protocolado em {new Date(s.recurso!.dataSolicitacao).toLocaleString("pt-BR")}
            </div>
          </div>

          {isPendente ? (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Comentário da decisão {`(obrigatório se rejeitar)`}
                </label>
                <textarea
                  rows={4}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
                  placeholder="Justifique a aceitação ou rejeição do recurso."
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                <button
                  onClick={() => decidir("REJEITADO")}
                  className="rounded-full bg-gov-danger px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Rejeitar recurso
                </button>
                <button
                  onClick={() => decidir("ACEITO")}
                  className="rounded-full bg-gov-success px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Aceitar recurso
                </button>
              </div>
            </>
          ) : (
            <GovMessage tone={s.recurso?.status === "ACEITO" ? "success" : "danger"} title={`Recurso ${s.recurso?.status === "ACEITO" ? "ACEITO" : "REJEITADO"}`}>
              <div className="text-xs">
                Decidido por {s.recurso?.decididoPor} em {s.recurso?.decisaoData ? new Date(s.recurso.decisaoData).toLocaleString("pt-BR") : "—"}.
              </div>
              {s.recurso?.decisaoComentario && (
                <div className="mt-1">{s.recurso.decisaoComentario}</div>
              )}
            </GovMessage>
          )}

          <Link to="/chefia/analise/$id" params={{ id: s.id }} className="block text-center text-xs font-semibold text-gov-blue hover:underline">
            Ver dados completos da solicitação →
          </Link>
        </div>
      </aside>
    </div>
  );
}
