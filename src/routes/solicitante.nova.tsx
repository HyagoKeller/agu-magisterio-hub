import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { HorariosGrid, ResumoGrade, boundsForSemestre } from "@/components/HorariosGrid";
import { useAuth } from "@/lib/auth";
import { gerarProtocolo, semestreAtual, store, useSolicitacoes } from "@/lib/store";
import { dispatchNotification } from "@/lib/messaging-store";
import { CARGOS, FORMACOES, UFS, type AtividadesEnsino } from "@/lib/types";

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
  chefiaNome: string;
  chefiaEmail: string;
  formacao: string;
  atividades: AtividadesEnsino;
}

const anoCorrente = new Date().getFullYear();
const semestreCorrente: 1 | 2 = new Date().getMonth() < 6 ? 1 : 2;

const emptyAtividades: AtividadesEnsino = {
  grade: {},
  semestreReferencia: semestreCorrente,
  anoReferencia: anoCorrente,
  disciplinas: "",
  projetoPedagogico: "",
  material: "",
  avaliacoes: "",
  declaracaoLeu: true,
  declaracaoVerdade: false,
  declaracaoCiente: false,
};

const empty: FormData = {
  tipo: "Solicitação", protocoloOriginal: "", descricaoCorrecao: "",
  cpf: "", siape: "", oabNumero: "", oabUf: "", cargo: "",
  uf: "", unidade: "", chefiaNome: "", chefiaEmail: "", formacao: "",
  atividades: emptyAtividades,
};

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

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
  const [submitted, setSubmitted] = useState<{ protocolo: string; tipo: "Solicitação" | "Correção" } | null>(null);

  const all = useSolicitacoes();
  const aprovadasDoUsuario = useMemo(
    () => all.filter((s) => s.solicitanteId === user?.id && s.status === "APROVADA" && s.tipoSolicitacao === "Solicitação"),
    [all, user]
  );

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
    if (!data.chefiaNome.trim() || data.chefiaNome.trim().length < 3)
      e.chefiaNome = "Informe o nome completo da chefia imediata.";
    if (!data.chefiaEmail.trim()) e.chefiaEmail = "Informe o e-mail da chefia imediata.";
    else if (!isValidEmail(data.chefiaEmail)) e.chefiaEmail = "E-mail inválido.";
    {
      const a = data.atividades;
      const algumPreenchido = a.disciplinas.trim() || a.projetoPedagogico.trim() || a.material.trim() || a.avaliacoes.trim();
      if (!algumPreenchido) (e as Record<string, string>).atividades = "Informe ao menos uma atividade de ensino.";
      if (!a.declaracaoVerdade || !a.declaracaoCiente) (e as Record<string, string>).declaracoes = "Confirme as declarações obrigatórias de boa-fé.";
    }
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
      chefiaNome: orig.chefiaNome,
      chefiaEmail: orig.chefiaEmail || "",
      formacao: orig.formacao || "",
      atividades: orig.atividades ? { ...orig.atividades } : d.atividades,
    }));
  };

  const submit = () => {
    if (!user) return;
    const id = crypto.randomUUID();
    const protocolo = gerarProtocolo();
    const now = new Date().toISOString();
    const chefiaNome = data.chefiaNome.trim();
    const chefiaEmail = data.chefiaEmail.trim().toLowerCase();
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
      chefiaId: chefiaEmail,
      chefiaNome,
      chefiaEmail,
      formacao: data.formacao || undefined,
      tipoSolicitacao: data.tipo,
      protocoloOriginal: data.tipo === "Correção" ? data.protocoloOriginal : undefined,
      descricaoCorrecao: data.tipo === "Correção" ? data.descricaoCorrecao : undefined,
      atividades: data.atividades,
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
    dispatchNotification({
      evento: "NOVA_SOLICITACAO",
      destinatarios: [
        { nome: user.nome, email: user.email },
        { nome: chefiaNome, email: chefiaEmail },
      ],
      protocolo,
      resumo: `${data.tipo} aberta por ${user.nome} (${data.unidade}) — chefia: ${chefiaNome}`,
    });
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
              <div className="sm:col-span-2 rounded-md border border-gov-blue/30 bg-[oklch(0.98_0.02_250)] p-4">
                <div className="block text-sm font-semibold mb-2">
                  Informe o tipo de Solicitação <span className="text-gov-red">*</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Solicitação", "Correção"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border-2 px-4 py-3 text-sm transition ${
                        data.tipo === opt
                          ? "border-gov-blue bg-card text-gov-blue-dark"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        checked={data.tipo === opt}
                        onChange={() => {
                          set("tipo", opt);
                          if (opt === "Solicitação") {
                            set("protocoloOriginal", "");
                            set("descricaoCorrecao", "");
                          }
                        }}
                        className="mt-0.5 accent-gov-blue"
                      />
                      <span>
                        <span className="block font-semibold">{opt}</span>
                        <span className="block text-xs text-muted-foreground">
                          {opt === "Solicitação"
                            ? "Registrar nova atividade de magistério no semestre."
                            : "Corrigir dados de uma solicitação já aprovada."}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {data.tipo === "Correção" && (
                <>
                  <Field
                    label="Protocolo a corrigir"
                    required
                    error={errors.protocoloOriginal}
                    htmlFor="protorig"
                    full
                    hint="Apenas solicitações já aprovadas podem ser corrigidas."
                  >
                    <select
                      id="protorig"
                      value={data.protocoloOriginal}
                      onChange={(e) => aplicarOriginal(e.target.value)}
                      className={inputCls(!!errors.protocoloOriginal)}
                    >
                      <option value="">Selecione o protocolo original…</option>
                      {aprovadasDoUsuario.map((s) => (
                        <option key={s.id} value={s.protocolo}>
                          {s.protocolo} — {s.semestre} — {s.unidade}
                        </option>
                      ))}
                    </select>
                    {aprovadasDoUsuario.length === 0 && (
                      <p className="mt-1 text-xs text-gov-danger">
                        Você ainda não possui solicitações aprovadas para corrigir.
                      </p>
                    )}
                  </Field>
                  <Field
                    label="Descrição da correção"
                    required
                    error={errors.descricaoCorrecao}
                    htmlFor="desccorr"
                    full
                    hint="Indique claramente o(s) campo(s) a corrigir e o valor correto."
                  >
                    <textarea
                      id="desccorr"
                      value={data.descricaoCorrecao}
                      onChange={(e) => set("descricaoCorrecao", e.target.value)}
                      rows={3}
                      className={inputCls(!!errors.descricaoCorrecao)}
                      placeholder="Ex.: Corrigir Unidade/Equipe para PGU/DF — Núcleo Cível."
                    />
                  </Field>
                </>
              )}

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
                label="Nome da Chefia atual"
                required
                error={errors.chefiaNome}
                htmlFor="chefiaNome"
              >
                <input
                  id="chefiaNome"
                  value={data.chefiaNome}
                  onChange={(e) => set("chefiaNome", e.target.value)}
                  className={inputCls(!!errors.chefiaNome)}
                  placeholder="Ex.: Dra. Maria Helena Souza"
                  maxLength={120}
                  autoComplete="off"
                />
              </Field>
              <Field
                label="E-mail da Chefia atual"
                required
                error={errors.chefiaEmail}
                htmlFor="chefiaEmail"
                hint="A notificação de análise será enviada para este endereço."
              >
                <input
                  id="chefiaEmail"
                  type="email"
                  value={data.chefiaEmail}
                  onChange={(e) => set("chefiaEmail", e.target.value)}
                  className={inputCls(!!errors.chefiaEmail)}
                  placeholder="nome.sobrenome@agu.gov.br"
                  maxLength={150}
                  autoComplete="off"
                  inputMode="email"
                />
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

              <div className="sm:col-span-2 space-y-4">
                  <div className="rounded-md bg-gov-blue-dark px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white">
                    Atividades de Ensino
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.tipo === "Correção"
                      ? "Os dados abaixo foram pré-preenchidos com a solicitação original. Ajuste qualquer campo que precise ser corrigido."
                      : "As informações abaixo serão encaminhadas à sua chefia imediata."}
                  </p>

                  <fieldset className="rounded-md border border-border p-4">
                    <legend className="px-2 text-sm font-semibold">Período do Registro</legend>
                    <p className="text-xs text-muted-foreground mb-3">
                      Informe o semestre e o ano referente a este formulário — usado para futura emissão de certidões.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Semestre</label>
                        <select
                          value={data.atividades.semestreReferencia ?? semestreCorrente}
                          onChange={(e) => set("atividades", { ...data.atividades, semestreReferencia: Number(e.target.value) as 1 | 2 })}
                          className={inputCls(false)}
                        >
                          <option value={1}>1º Semestre</option>
                          <option value={2}>2º Semestre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Ano</label>
                        <select
                          value={data.atividades.anoReferencia ?? anoCorrente}
                          onChange={(e) => set("atividades", { ...data.atividades, anoReferencia: Number(e.target.value) })}
                          className={inputCls(false)}
                        >
                          {[anoCorrente, anoCorrente + 1, anoCorrente + 2].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="rounded-md border border-border p-4">
                    <legend className="px-2 text-sm font-semibold">Grade Semanal de Atividades</legend>
                    <p className="text-xs text-muted-foreground mb-3">
                      Clique em uma célula para informar a carga horária e a frequência da atividade.
                    </p>
                    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                      {(() => {
                        const b = boundsForSemestre(
                          data.atividades.anoReferencia ?? anoCorrente,
                          (data.atividades.semestreReferencia ?? semestreCorrente) as 1 | 2,
                        );
                        return (
                          <HorariosGrid
                            value={data.atividades.grade ?? {}}
                            onChange={(g) => set("atividades", { ...data.atividades, grade: g })}
                            semestreInicio={b.inicio}
                            semestreFim={b.fim}
                          />
                        );
                      })()}
                      <ResumoGrade grade={data.atividades.grade ?? {}} />
                    </div>
                  </fieldset>

                  <Field label="Disciplinas Ministradas (Art. 2°; I, V, VI) e Projetos de Extensão" htmlFor="ativ-disc" full hint="Por linha: NOME DA INSTITUIÇÃO, CIDADE/UF, NOME DA DISCIPLINA, DIAS, HORÁRIO.">
                    <textarea
                      id="ativ-disc"
                      rows={4}
                      value={data.atividades.disciplinas}
                      onChange={(e) => set("atividades", { ...data.atividades, disciplinas: e.target.value })}
                      className={inputCls(false)}
                      placeholder="Ex.: Universidade de Brasília-UnB, Brasília/DF, Direito Empresarial, Segundas e Quartas, 19:00 às 22:00;"
                    />
                  </Field>

                  <Field label="Elaboração de Projeto Pedagógico (Art. 2°, II)" htmlFor="ativ-proj" full hint="Por linha: INSTITUIÇÃO, CIDADE/UF, DEPARTAMENTO, TÍTULO DO PROJETO, DIAS, HORÁRIO.">
                    <textarea
                      id="ativ-proj"
                      rows={3}
                      value={data.atividades.projetoPedagogico}
                      onChange={(e) => set("atividades", { ...data.atividades, projetoPedagogico: e.target.value })}
                      className={inputCls(false)}
                    />
                  </Field>

                  <Field label="Material Didático/Programa de Ensino (Art. 2°, III) e Projetos de Pesquisa" htmlFor="ativ-mat" full hint="Por linha: INSTITUIÇÃO, CIDADE/UF, DEPARTAMENTO, TÍTULO DO MATERIAL/PROGRAMA, DIAS, HORÁRIO.">
                    <textarea
                      id="ativ-mat"
                      rows={3}
                      value={data.atividades.material}
                      onChange={(e) => set("atividades", { ...data.atividades, material: e.target.value })}
                      className={inputCls(false)}
                    />
                  </Field>

                  <Field label="Elaboração de Avaliações, Provas, Simulados e Afins (Art. 2°, IV)" htmlFor="ativ-aval" full hint="Por linha: INSTITUIÇÃO, CIDADE/UF, DEPARTAMENTO, TÍTULO, DIAS, HORÁRIO.">
                    <textarea
                      id="ativ-aval"
                      rows={3}
                      value={data.atividades.avaliacoes}
                      onChange={(e) => set("atividades", { ...data.atividades, avaliacoes: e.target.value })}
                      className={inputCls(false)}
                    />
                  </Field>

                  {(errors as Record<string, string>).atividades && (
                    <p role="alert" className="text-xs font-semibold text-gov-danger">
                      {(errors as Record<string, string>).atividades}
                    </p>
                  )}

                  <fieldset className="rounded-md border-2 border-gov-blue/30 p-4">
                    <legend className="px-2 text-sm font-semibold text-gov-blue-dark">DECLARAÇÃO DE BOA-FÉ <span className="text-gov-red">*</span></legend>
                    <p className="text-xs text-muted-foreground mb-3">
                      Eu, advogado público acima identificado, em conformidade com a PORTARIA INTERMINISTERIAL AGU/MF/BACEN Nº 1, de 26 de maio de 2020, DECLARO QUE:
                    </p>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={data.atividades.declaracaoLeu}
                          onChange={(e) => set("atividades", { ...data.atividades, declaracaoLeu: e.target.checked })}
                          className="mt-1 h-4 w-4 accent-gov-blue"
                        />
                        <span>Li a Portaria Interministerial AGU/MF/BACEN Nº 1, de 26 de maio de 2020;</span>
                      </label>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={data.atividades.declaracaoVerdade}
                          onChange={(e) => set("atividades", { ...data.atividades, declaracaoVerdade: e.target.checked })}
                          className="mt-1 h-4 w-4 accent-gov-blue"
                        />
                        <span>As declarações de carga-horária aqui relatadas são expressão da verdade e, caso ocorram alterações definitivas na grade horária, comunicá-las-ei à chefia imediata;</span>
                      </label>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={data.atividades.declaracaoCiente}
                          onChange={(e) => set("atividades", { ...data.atividades, declaracaoCiente: e.target.checked })}
                          className="mt-1 h-4 w-4 accent-gov-blue"
                        />
                        <span>Estou ciente que a presente autorização será válida apenas para o atual semestre letivo, sendo necessária a apresentação de novo requerimento para os semestres subsequentes.</span>
                      </label>
                    </div>
                    {(errors as Record<string, string>).declaracoes && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-gov-danger">
                        {(errors as Record<string, string>).declaracoes}
                      </p>
                    )}
                  </fieldset>
                </div>
              )}


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
                <Resumo label="Tipo de Solicitação" value={data.tipo} />
                {data.tipo === "Correção" && (
                  <>
                    <Resumo label="Protocolo a corrigir" value={data.protocoloOriginal} />
                    <Resumo label="Descrição da correção" value={data.descricaoCorrecao} full />
                  </>
                )}
                <Resumo label="Cargo" value={data.cargo} full />
                <Resumo label="UF" value={data.uf} />
                <Resumo label="Unidade" value={data.unidade} />
                <Resumo label="Chefia Imediata" value={`${data.chefiaNome}${data.chefiaEmail ? ` — ${data.chefiaEmail}` : ""}`} full />
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
