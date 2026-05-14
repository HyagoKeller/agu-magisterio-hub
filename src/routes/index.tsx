import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { homeForRole, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { CARGOS } from "@/lib/types";
import { AguLogo } from "@/components/AguLogo";
import { newRequestId, requestsStore } from "@/lib/admin-store";

type Tab = "login" | "solicitar" | "recuperar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Portal Magistério AGU" },
      { name: "description", content: "Acesse o Portal Magistério AGU com seu usuário institucional do Active Directory da AGU." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  useEffect(() => {
    if (user) navigate({ to: homeForRole(user.role) });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Faixa gov.br superior */}
      <div className="bg-gov-blue-dark text-white text-xs">
        <div className="gov-container grid h-8 grid-cols-3 items-center">
          <a href="https://www.gov.br" className="font-display font-semibold justify-self-start hover:opacity-90">gov.br</a>
          <a href="https://aguservicos.agu.gov.br" target="_blank" rel="noreferrer" className="justify-self-center font-semibold hover:underline">
            Acesse já: aguservicos.agu.gov.br
          </a>
          <span className="justify-self-end hidden sm:block opacity-90">Advocacia-Geral da União</span>
        </div>
      </div>

      {/* Faixa decorativa verde/amarela gov.br */}
      <div className="h-1 w-full bg-gradient-to-r from-gov-success via-gov-yellow to-gov-success" aria-hidden="true" />

      <div className="relative">
        {/* Fundo institucional sutil — dentro do padrão gov.br */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 10%, color-mix(in oklab, var(--gov-blue) 12%, transparent), transparent 55%), radial-gradient(circle at 85% 90%, color-mix(in oklab, var(--gov-blue-dark) 10%, transparent), transparent 50%)",
          }}
        />

        <div className="gov-container flex min-h-[calc(100vh-36px)] items-center justify-center py-12">
          <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_1fr]">
            {/* Painel institucional — claro, dentro do padrão gov.br */}
            <aside className="hidden md:flex flex-col">
              <div className="flex items-center gap-5">
                <AguLogo size={92} />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gov-blue">
                    Advocacia-Geral da União
                  </div>
                  <h1 className="font-display text-[2.25rem] leading-tight text-gov-blue-dark mt-1">
                    Portal Magistério
                  </h1>
                  <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-gov-success via-gov-yellow to-gov-success" />
                </div>
              </div>

              <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/80">
                Ambiente institucional para registro, análise e gestão de
                solicitações de magistério dos membros da AGU, integrado ao
                Active Directory institucional.
              </p>

              <ul className="mt-8 grid gap-2.5 max-w-md">
                {[
                  "Login único com credenciais do AD da AGU",
                  "Perfis derivados de grupos institucionais",
                  "Acesso externo validado por RH ou Coordenação",
                  "Recuperação por e-mail institucional ou pessoal",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gov-blue" />
                    <span className="text-foreground/85">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-display font-semibold tracking-wide text-gov-blue-dark">gov.br</span>
                <span aria-hidden="true">·</span>
                <span>Padrão Digital de Governo (DSGov)</span>
              </div>
            </aside>

            {/* Cartão de autenticação */}
            <section className="rounded-2xl border border-border bg-card p-7 shadow-[0_10px_30px_-15px_rgba(19,81,180,0.25)] md:p-8 relative overflow-hidden">
              {/* Detalhe superior gov.br */}
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gov-success via-gov-yellow to-gov-success" />

              <div className="md:hidden mb-5 flex items-center gap-3">
                <AguLogo size={52} />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gov-blue">Advocacia-Geral da União</div>
                  <h1 className="font-display text-xl text-gov-blue-dark">Portal Magistério</h1>
                </div>
              </div>

              <nav aria-label="Modos de acesso" className="flex gap-1 border-b border-border mb-5">
                <TabBtn active={tab === "login"} onClick={() => setTab("login")} icon={<LogIn className="h-4 w-4" />}>Entrar</TabBtn>
                <TabBtn active={tab === "solicitar"} onClick={() => setTab("solicitar")} icon={<UserPlus className="h-4 w-4" />}>Solicitar acesso</TabBtn>
                <TabBtn active={tab === "recuperar"} onClick={() => setTab("recuperar")} icon={<KeyRound className="h-4 w-4" />}>Esqueci a senha</TabBtn>
              </nav>

              {tab === "login" && <LoginForm onLogin={(r) => { login(r); navigate({ to: homeForRole(r) }); }} />}
              {tab === "solicitar" && <SolicitarForm onDone={() => setTab("login")} />}
              {tab === "recuperar" && <RecuperarForm />}
            </section>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card/50">
        <div className="gov-container flex h-9 items-center justify-end text-[11px] text-muted-foreground">
          Desenvolvido por Keller
        </div>
      </footer>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-[3px] -mb-px ${active ? "border-gov-blue text-gov-blue" : "border-transparent text-muted-foreground hover:text-gov-blue"}`}
    >
      {icon} {children}
    </button>
  );
}

function LoginForm({ onLogin }: { onLogin: (r: Role) => void }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Role>("SOLICITANTE");
  const [erro, setErro] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) { setErro("Informe usuário e senha."); return; }
    setErro("");
    onLogin(perfil);
  };

  return (
    <>
      <h2 className="font-display text-xl text-gov-blue-dark">Login institucional</h2>
      <p className="mt-1 text-sm text-muted-foreground">Acesse com seu usuário do AD da AGU.</p>

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div>
          <label htmlFor="usuario" className="block text-sm font-semibold mb-1">Usuário AGU <span className="text-gov-red">*</span></label>
          <input id="usuario" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} className={inp} placeholder="ex: joao.silva" />
        </div>
        <div>
          <label htmlFor="senha" className="block text-sm font-semibold mb-1">Senha <span className="text-gov-red">*</span></label>
          <input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inp} placeholder="••••••••" />
        </div>

        <fieldset>
          <legend className="block text-sm font-semibold mb-2">Perfil de acesso (demonstração — em produção vem do AD)</legend>
          <div className="grid gap-2">
            {(["SOLICITANTE", "CHEFIA"] as Role[]).map((r) => (
              <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${perfil === r ? "border-gov-blue bg-gov-blue-light" : "border-border hover:bg-accent"}`}>
                <input type="radio" name="perfil" value={r} checked={perfil === r} onChange={() => setPerfil(r)} className="mt-0.5 accent-gov-blue" />
                <span>
                  <span className="block font-semibold text-gov-blue-dark">
                    {r === "SOLICITANTE" ? "Solicitante (Membro AGU)" : "Chefia Imediata"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r === "SOLICITANTE" ? "Cria solicitações de magistério" : "Aprova ou recusa solicitações"}
                  </span>
                </span>
              </label>
            ))}

            {/* Gestão do Portal — agrupa Coordenação e Superadmin em select */}
            {(() => {
              const isGestao = perfil === "COORDENADOR" || perfil === "SUPERADMIN";
              return (
                <label className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${isGestao ? "border-gov-blue bg-gov-blue-light" : "border-border hover:bg-accent"}`}>
                  <input
                    type="radio"
                    name="perfil"
                    checked={isGestao}
                    onChange={() => setPerfil("COORDENADOR")}
                    className="mt-0.5 accent-gov-blue"
                  />
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="block font-semibold text-gov-blue-dark">Gestão do Portal</span>
                      <span className="text-[11px] uppercase tracking-wide text-gov-blue font-semibold">Acesso restrito</span>
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Coordenação CGU/AGU e Superadministrador (TI).
                    </span>
                    {isGestao && (
                      <select
                        value={perfil}
                        onChange={(e) => setPerfil(e.target.value as Role)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Selecione o perfil de gestão"
                        className="mt-2 w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground focus:border-gov-blue"
                      >
                        <option value="COORDENADOR">Coordenação CGU/AGU — indicadores e validações</option>
                        <option value="SUPERADMIN">Superadministrador (TI) — AD, usuários e grupos</option>
                      </select>
                    )}
                  </span>
                </label>
              );
            })()}
          </div>
        </fieldset>

        {erro && <p role="alert" className="rounded-md bg-[oklch(0.95_0.05_27)] px-3 py-2 text-sm text-gov-danger">{erro}</p>}

        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
          <LogIn className="h-4 w-4" /> Entrar
        </button>
      </form>
    </>
  );
}

function SolicitarForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ nome: "", cpf: "", emailPessoal: "", emailInstitucional: "", cargoPretendido: CARGOS[0] as string, unidade: "", justificativa: "" });
  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome || !f.cpf || !f.emailPessoal || f.justificativa.length < 20) {
      toast.error("Preencha nome, CPF, e-mail pessoal e justificativa (mín. 20 caracteres).");
      return;
    }
    requestsStore.add({
      id: newRequestId(),
      nome: f.nome, cpf: f.cpf, emailPessoal: f.emailPessoal,
      emailInstitucional: f.emailInstitucional || undefined,
      cargoPretendido: f.cargoPretendido, perfilSolicitado: "SOLICITANTE",
      unidade: f.unidade || undefined, justificativa: f.justificativa,
      dataSolicitacao: new Date().toISOString(), status: "PENDENTE",
    });
    toast.success("Solicitação enviada. O RH/Coordenação irá validar e você receberá retorno por e-mail.");
    onDone();
  };

  return (
    <>
      <h2 className="font-display text-xl text-gov-blue-dark">Solicitar acesso ao portal</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Para quem ainda não está cadastrado no AD da AGU. A validação é feita pelo RH ou pela Coordenação.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input className={inp} placeholder="Nome completo *" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className={inp} placeholder="CPF *" value={f.cpf} onChange={(e) => set("cpf", e.target.value)} />
          <input className={inp} placeholder="Unidade (opcional)" value={f.unidade} onChange={(e) => set("unidade", e.target.value)} />
        </div>
        <input className={inp} placeholder="E-mail pessoal *" value={f.emailPessoal} onChange={(e) => set("emailPessoal", e.target.value)} />
        <input className={inp} placeholder="E-mail institucional AGU (se houver)" value={f.emailInstitucional} onChange={(e) => set("emailInstitucional", e.target.value)} />
        <select className={inp} value={f.cargoPretendido} onChange={(e) => set("cargoPretendido", e.target.value)}>
          {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea className={`${inp} min-h-24`} placeholder="Justificativa do acesso (mín. 20 caracteres) *" value={f.justificativa} onChange={(e) => set("justificativa", e.target.value)} />
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
          <UserPlus className="h-4 w-4" /> Enviar solicitação
        </button>
      </form>
    </>
  );
}

function RecuperarForm() {
  const [tipo, setTipo] = useState<"institucional" | "pessoal">("institucional");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Informe um e-mail válido."); return; }
    setEnviado(true);
    toast.success(`Link de recuperação enviado para ${email}.`);
  };

  return (
    <>
      <h2 className="font-display text-xl text-gov-blue-dark">Recuperar senha</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Você pode receber o link de redefinição no e-mail institucional (AGU) ou no e-mail pessoal cadastrado.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <fieldset>
          <legend className="block text-sm font-semibold mb-2">Onde deseja receber?</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${tipo === "institucional" ? "border-gov-blue bg-gov-blue-light" : "border-border"}`}>
              <input type="radio" name="tipo" checked={tipo === "institucional"} onChange={() => setTipo("institucional")} className="accent-gov-blue" />
              E-mail institucional
            </label>
            <label className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${tipo === "pessoal" ? "border-gov-blue bg-gov-blue-light" : "border-border"}`}>
              <input type="radio" name="tipo" checked={tipo === "pessoal"} onChange={() => setTipo("pessoal")} className="accent-gov-blue" />
              E-mail pessoal
            </label>
          </div>
        </fieldset>
        <input
          className={inp}
          type="email"
          placeholder={tipo === "institucional" ? "seu.nome@agu.gov.br" : "seunome@gmail.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
          <KeyRound className="h-4 w-4" /> Enviar link de recuperação
        </button>
        {enviado && (
          <p className="rounded-md bg-[oklch(0.94_0.08_145)] px-3 py-2 text-sm text-gov-success">
            Se o e-mail estiver cadastrado, você receberá as instruções em instantes.
          </p>
        )}
      </form>
    </>
  );
}

const inp = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue";
