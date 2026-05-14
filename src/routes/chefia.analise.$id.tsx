import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { Modal } from "@/routes/solicitante.nova";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes, store } from "@/lib/store";

export const Route = createFileRoute("/chefia/analise/$id")({
  head: () => ({ meta: [{ title: "Analisar Solicitação — Portal Magistério AGU" }] }),
  component: Analise,
});

function Analise() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const s = useSolicitacoes().find((x) => x.id === id);

  const [decisao, setDecisao] = useState<"APROVAR" | "RECUSAR" | "">("");
  const [comentario, setComentario] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  if (!s) {
    return (
      <section className="gov-container py-10">
        <GovMessage tone="warning" title="Solicitação não encontrada">
          O registro pode ter sido removido ou o link é inválido.
        </GovMessage>
      </section>
    );
  }

  const validar = () => {
    if (!decisao) { setError("Selecione Aprovar ou Recusar."); return false; }
    if (decisao === "RECUSAR" && justificativa.trim().length < 20) {
      setError("Justificativa obrigatória com no mínimo 20 caracteres.");
      return false;
    }
    setError("");
    return true;
  };

  const confirmar = () => {
    if (!user) return;
    if (decisao === "APROVAR") {
      store.decide(s.id, "APROVADA", user.nome, comentario || undefined);
      toast.success("Solicitação aprovada", {
        description: "O solicitante será notificado por e-mail.",
        icon: <Mail className="h-4 w-4" />,
      });
    } else {
      store.decide(s.id, "RECUSADA", user.nome, undefined, justificativa);
      toast.success("Solicitação recusada", {
        description: "O processo foi encerrado e o solicitante notificado.",
      });
    }
    setConfirm(false);
    navigate({ to: "/chefia/pendentes" });
  };

  const readonly = s.status !== "PENDENTE";

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Início", to: "/chefia" },
        { label: "Aprovações Pendentes", to: "/chefia/pendentes" },
        { label: s.protocolo },
      ]} />
      <section className="gov-container pb-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/chefia/pendentes" })}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gov-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <h1 className="font-display text-2xl mb-1">Análise da Solicitação</h1>
        <p className="text-sm text-muted-foreground mb-6">Protocolo {s.protocolo} • {s.solicitanteNome}</p>

        <div className="gov-card mb-6">
          <h2 className="font-display text-lg mb-4">Dados do solicitante</h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Info label="Nome" value={s.solicitanteNome} full />
            <Info label="CPF" value={s.cpf} />
            <Info label="SIAPE" value={s.siape} />
            <Info label="OAB" value={[s.oabNumero, s.oabUf].filter(Boolean).join(" / ") || "—"} />
            <Info label="Cargo" value={s.cargo} full />
            <Info label="UF" value={s.uf} />
            <Info label="Unidade" value={s.unidade} />
            <Info label="Formação" value={s.formacao || "—"} />
            <Info label="Tipo" value={s.tipoSolicitacao} />
            <Info label="Aberta em" value={new Date(s.dataAbertura).toLocaleString("pt-BR")} />
          </dl>
        </div>

        {readonly ? (
          <GovMessage tone="info" title="Esta solicitação já foi decidida">
            Status atual: {s.status === "APROVADA" ? "Aprovada" : "Recusada"}.
          </GovMessage>
        ) : (
          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Decisão</h2>

            <fieldset className="mb-4">
              <legend className="sr-only">Selecione sua decisão</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { v: "APROVAR", label: "Aprovar", tone: "border-gov-success/40 bg-[oklch(0.98_0.03_145)] text-gov-success" },
                  { v: "RECUSAR", label: "Recusar", tone: "border-gov-danger/40 bg-[oklch(0.98_0.02_27)] text-gov-danger" },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border-2 px-4 py-3 text-sm font-semibold transition ${
                      decisao === opt.v ? opt.tone : "border-border hover:bg-accent text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisao"
                      value={opt.v}
                      checked={decisao === opt.v}
                      onChange={() => setDecisao(opt.v as "APROVAR" | "RECUSAR")}
                      className="accent-gov-blue"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {decisao === "APROVAR" && (
              <div>
                <label htmlFor="coment" className="block text-sm font-semibold mb-1">
                  Comentário (opcional)
                </label>
                <textarea
                  id="coment"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
                  placeholder="Observações sobre a aprovação…"
                />
              </div>
            )}

            {decisao === "RECUSAR" && (
              <div>
                <label htmlFor="just" className="block text-sm font-semibold mb-1">
                  Justificativa <span className="text-gov-red">*</span>
                </label>
                <textarea
                  id="just"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={4}
                  minLength={20}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
                  placeholder="Mínimo de 20 caracteres."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {justificativa.trim().length}/20 caracteres mínimos
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-3 rounded-md bg-[oklch(0.95_0.05_27)] px-3 py-2 text-sm text-gov-danger">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => navigate({ to: "/chefia/pendentes" })}
                className="rounded-full border border-gov-blue px-5 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { if (validar()) setConfirm(true); }}
                className="rounded-full bg-gov-blue px-5 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark"
              >
                Confirmar Decisão
              </button>
            </div>
          </div>
        )}
      </section>

      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <h2 className="font-display text-lg">
            {decisao === "APROVAR" ? "Confirmar aprovação?" : "Confirmar recusa?"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {decisao === "APROVAR"
              ? "O solicitante será notificado por e-mail e a solicitação será encaminhada ao fluxo."
              : "A recusa encerra o processo e o solicitante será notificado por e-mail."}
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="rounded-full border border-gov-blue px-5 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white ${
                decisao === "APROVAR" ? "bg-gov-success hover:opacity-90" : "bg-gov-danger hover:opacity-90"
              }`}
            >
              Sim, confirmar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-3" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
