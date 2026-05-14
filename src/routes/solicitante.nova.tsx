import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { useAuth } from "@/lib/auth";
import { gerarProtocolo, semestreAtual, store, useSolicitacoes } from "@/lib/store";
import { CARGOS, CHEFIAS, FORMACOES, UFS } from "@/lib/types";

export const Route = createFileRoute("/solicitante/nova")({
  head: () => ({
    meta: [{ title: "Nova Solicitação — Portal Magistério AGU" }],
  }),
  component: NovaSolicitacao,
});

interface FormData {
  tipo: "Solicitação" | "Correção";
  protocoloOriginal: string;
  descricaoCorrecao: string;
  cpf: string;
  siape: string;
  oabNumero: string;
  oabUf: string;
  cargo: string;
  uf: string;
  unidade: string;
  chefiaId: string;
  formacao: string;
}

const empty: FormData = {
  tipo: "Solicitação", protocoloOriginal: "", descricaoCorrecao: "",
  cpf: "", siape: "", oabNumero: "", oabUf: "", cargo: "",
  uf: "", unidade: "", chefiaId: "", formacao: "",
};

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validateCPF(cpf: string) {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = (s * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = (s * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

function NovaSolicitacao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [chefiaQuery, setChefiaQuery] = useState("");
  const [showChefiaList, setShowChefiaList] = useState(false);
  const [submitted, setSubmitted] = useState<{ protocolo: string; tipo: "Solicitação" | "Correção" } | null>(null);

  const all = useSolicitacoes();
  const aprovadasDoUsuario = useMemo(
    () => all.filter((s) => s.solicitanteId === user?.id && s.status === "APROVADA" && s.tipoSolicitacao === "Solicitação"),
    [all, user]
  );

  const chefiasFiltradas = useMemo(
    () => CHEFIAS.filter((c) => c.nome.toLowerCase().includes(chefiaQuery.toLowerCase())),
    [chefiaQuery]
  );
  const chefiaSelecionada = CHEFIAS.find((c) => c.id === data.chefiaId);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (data.tipo === "Correção") {
      if (!data.protocoloOriginal) e.protocoloOriginal = "Selecione o protocolo a ser corrigido.";
      if (data.descricaoCorrecao.trim().length < 20)
        e.descricaoCorrecao = "Descreva a correção solicitada (mínimo 20 caracteres).";
    }
    if (!data.cpf) e.cpf = "Informe o CPF.";
    else if (!validateCPF(data.cpf)) e.cpf = "CPF inválido.";
    if (!data.siape.trim()) e.siape = "Informe a matrícula SIAPE.";
    else if (!/^\d+$/.test(data.siape)) e.siape = "SIAPE deve conter apenas números.";
    if (!data.cargo) e.cargo = "Selecione o cargo.";
    if (!data.uf) e.uf = "Selecione a UF.";
    if (!data.unidade.trim()) e.unidade = "Informe a unidade/equipe.";
    if (!data.chefiaId) e.chefiaId = "Selecione a chefia imediata.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const aplicarOriginal = (protocolo: string) => {
    const orig = aprovadasDoUsuario.find((s) => s.protocolo === protocolo);
    if (!orig) return;
    setData((d) => ({
      ...d,
      protocoloOriginal: protocolo,
      cpf: orig.cpf,
      siape: orig.siape,
      oabNumero: orig.oabNumero || "",
      oabUf: orig.oabUf || "",
      cargo: orig.cargo,
      uf: orig.uf,
      unidade: orig.unidade,
      chefiaId: orig.chefiaId,
      formacao: orig.formacao || "",
    }));
    setChefiaQuery(orig.chefiaNome);
  };

  const submit = () => {
    if (!user) return;
    const id = crypto.randomUUID();
    const protocolo = gerarProtocolo();
    const now = new Date().toISOString();
    const chefia = CHEFIAS.find((c) => c.id === data.chefiaId)!;
    store.add({
      id,
      protocolo,
      semestre: semestreAtual(),
      dataAbertura: now,
      solicitanteId: user.id,
      solicitanteNome: user.nome,
      cpf: data.cpf,
      siape: data.siape,
      oabNumero: data.oabNumero || undefined,
      oabUf: data.oabUf || undefined,
      cargo: data.cargo,
      uf: data.uf,
      unidade: data.unidade,
      chefiaId: chefia.id,
      chefiaNome: chefia.nome,
      formacao: data.formacao || undefined,
      tipoSolicitacao: data.tipo,
      protocoloOriginal: data.tipo === "Correção" ? data.protocoloOriginal : undefined,
      descricaoCorrecao: data.tipo === "Correção" ? data.descricaoCorrecao : undefined,
      status: "PENDENTE",
      historico: [{
        data: now,
        evento: data.tipo === "Correção"
          ? `Correção solicitada (referência: ${data.protocoloOriginal})`
          : "Solicitação criada",
        autor: user.nome,
      }],
    });
    toast.success(
      data.tipo === "Correção" ? "Correção enviada" : "Solicitação enviada",
      { description: `Protocolo ${protocolo}` }
    );
    setSubmitted({ protocolo, tipo: data.tipo });
  };

  return (
    <>
      <GovBreadcrumb
        items={[
          { label: "Início", to: "/solicitante" },
          { label: "Nova Solicitação" },
        ]}
      />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-2">Nova Solicitação de Magistério</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Preencha as informações abaixo. Sua chefia imediata será notificada para análise.
        </p>

        {/* Wizard Stepper */}
        <ol className="mb-8 flex items-center gap-3">
          {[
            { n: 1, label: "Dados do Servidor" },
            { n: 2, label: "Revisão e Envio" },
          ].map((s, i) => {
            const active = step === s.n;
            const done = step > s.n;
            return (
              <li key={s.n} className="flex items-center gap-3">
                <div
                  aria-current={active ? "step" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? "bg-gov-success text-white"
                      : active
                      ? "bg-gov-blue text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span className={`text-sm font-semibold ${active ? "text-gov-blue-dark" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i === 0 && <div className="hidden sm:block h-px w-16 bg-border" />}
              </li>
            );
          })}
        </ol>

        <div className="gov-card">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validateStep1()) setStep(2);
              }}
              noValidate
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field label="CPF" required error={errors.cpf} htmlFor="cpf">
                <input
                  id="cpf"
                  value={data.cpf}
                  onChange={(e) => set("cpf", maskCPF(e.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className={inputCls(!!errors.cpf)}
                  aria-invalid={!!errors.cpf}
                  aria-describedby={errors.cpf ? "cpf-err" : undefined}
                />
              </Field>
              <Field label="Matrícula SIAPE" required error={errors.siape} htmlFor="siape">
                <input
                  id="siape"
                  value={data.siape}
                  onChange={(e) => set("siape", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="0000000"
                  className={inputCls(!!errors.siape)}
                />
              </Field>

              <Field label="OAB Nº" htmlFor="oabnum">
                <input
                  id="oabnum"
                  value={data.oabNumero}
                  onChange={(e) => set("oabNumero", e.target.value)}
                  className={inputCls(false)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="OAB UF" htmlFor="oabuf">
                <select
                  id="oabuf"
                  value={data.oabUf}
                  onChange={(e) => set("oabUf", e.target.value)}
                  className={inputCls(false)}
                >
                  <option value="">—</option>
                  {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>

              <Field label="Membro Titular de Cargo" required error={errors.cargo} htmlFor="cargo" full>
                <select
                  id="cargo"
                  value={data.cargo}
                  onChange={(e) => set("cargo", e.target.value)}
                  className={inputCls(!!errors.cargo)}
                >
                  <option value="">Selecione…</option>
                  {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="UF da Unidade/Equipe" required error={errors.uf} htmlFor="uf">
                <select
                  id="uf"
                  value={data.uf}
                  onChange={(e) => set("uf", e.target.value)}
                  className={inputCls(!!errors.uf)}
                >
                  <option value="">Selecione…</option>
                  {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Unidade/Equipe em que atua" required error={errors.unidade} htmlFor="unidade">
                <input
                  id="unidade"
                  value={data.unidade}
                  onChange={(e) => set("unidade", e.target.value)}
                  className={inputCls(!!errors.unidade)}
                  placeholder="ex: PGU/DF - Núcleo Tributário"
                />
              </Field>

              <Field
                label="Chefia Imediata"
                required
                error={errors.chefiaId}
                htmlFor="chefia"
                full
                hint="Caso não localize sua chefia, ligue 0800 608 4650"
              >
                <div className="relative">
                  <input
                    id="chefia"
                    value={chefiaSelecionada ? chefiaSelecionada.nome : chefiaQuery}
                    onChange={(e) => {
                      set("chefiaId", "");
                      setChefiaQuery(e.target.value);
                      setShowChefiaList(true);
                    }}
                    onFocus={() => setShowChefiaList(true)}
                    onBlur={() => setTimeout(() => setShowChefiaList(false), 150)}
                    className={inputCls(!!errors.chefiaId)}
                    placeholder="Buscar chefia…"
                    autoComplete="off"
                  />
                  {showChefiaList && chefiasFiltradas.length > 0 && (
                    <ul
                      role="listbox"
                      className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-md"
                    >
                      {chefiasFiltradas.map((c) => (
                        <li
                          key={c.id}
                          role="option"
                          aria-selected={data.chefiaId === c.id}
                          onMouseDown={() => {
                            set("chefiaId", c.id);
                            setChefiaQuery(c.nome);
                            setShowChefiaList(false);
                          }}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                        >
                          {c.nome}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>

              <Field label="Formação Acadêmica mais elevada" htmlFor="formacao" full>
                <select
                  id="formacao"
                  value={data.formacao}
                  onChange={(e) => set("formacao", e.target.value)}
                  className={inputCls(false)}
                >
                  <option value="">Selecione (opcional)…</option>
                  {FORMACOES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/solicitante" })}
                  className="rounded-full border border-gov-blue px-5 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gov-blue px-5 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark"
                >
                  Avançar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-lg mb-4">Revise os dados antes de enviar</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Resumo label="CPF" value={data.cpf} />
                <Resumo label="Matrícula SIAPE" value={data.siape} />
                <Resumo label="OAB" value={[data.oabNumero, data.oabUf].filter(Boolean).join(" / ") || "—"} />
                <Resumo label="Tipo de Solicitação" value="Solicitação" />
                <Resumo label="Cargo" value={data.cargo} full />
                <Resumo label="UF" value={data.uf} />
                <Resumo label="Unidade" value={data.unidade} />
                <Resumo label="Chefia Imediata" value={chefiaSelecionada?.nome ?? "—"} full />
                <Resumo label="Formação" value={data.formacao || "—"} />
              </dl>

              <div className="mt-8 flex justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-5 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-full bg-gov-blue px-5 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark"
                >
                  Criar Solicitação
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {submitted && (
        <Modal onClose={() => navigate({ to: "/solicitante/minhas" })}>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.06_145)]">
              <Check className="h-6 w-6 text-gov-success" />
            </div>
            <h2 className="font-display text-xl">Solicitação enviada com sucesso!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua chefia imediata foi notificada para análise.
            </p>
            <div className="mt-4 rounded-md bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Protocolo: </span>
              <span className="font-semibold text-gov-blue-dark">{submitted.protocolo}</span>
            </div>
            <GovMessage tone="info" >
              Você receberá um e-mail assim que a decisão for registrada.
            </GovMessage>
            <button
              type="button"
              onClick={() => navigate({ to: "/solicitante/minhas" })}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gov-blue px-5 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark"
            >
              Ver minhas solicitações
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:border-gov-blue ${
    hasError ? "border-gov-danger" : "border-input"
  }`;
}

function Field({
  label, required, error, htmlFor, hint, full, children,
}: {
  label: string; required?: boolean; error?: string; htmlFor: string;
  hint?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold mb-1">
        {label} {required && <span className="text-gov-red">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-err`} className="mt-1 text-xs font-semibold text-gov-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Resumo({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
