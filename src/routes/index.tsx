import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { homeForRole, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Portal Magistério AGU" },
      {
        name: "description",
        content: "Acesse o Portal Magistério AGU com seu usuário institucional.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Role>("SOLICITANTE");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (user) navigate({ to: homeForRole(user.role) });
  }, [user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      setErro("Informe usuário e senha.");
      return;
    }
    setErro("");
    login(perfil);
    navigate({ to: homeForRole(perfil) });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Faixa gov.br */}
      <div className="bg-gov-blue-dark text-white text-xs">
        <div className="gov-container flex h-7 items-center justify-between">
          <a href="https://www.gov.br" className="font-display font-semibold">gov.br</a>
          <span>Advocacia-Geral da União</span>
        </div>
      </div>

      <div className="gov-container flex min-h-[calc(100vh-28px)] items-center justify-center py-10">
        <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="hidden md:block">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gov-blue text-2xl font-display font-bold text-white">
                AGU
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gov-blue">
                  Advocacia-Geral da União
                </div>
                <h1 className="font-display text-3xl text-gov-blue-dark">Portal Magistério</h1>
              </div>
            </div>
            <p className="text-base text-foreground/80 leading-relaxed">
              Sistema institucional para registro, análise e gestão de solicitações de
              magistério dos membros da Advocacia-Geral da União, em conformidade com o
              Padrão Digital de Governo (DSGov).
            </p>
            <ul className="mt-6 space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2"><span className="text-gov-blue">•</span> Registro de solicitações em poucos passos</li>
              <li className="flex gap-2"><span className="text-gov-blue">•</span> Acompanhamento em tempo real</li>
              <li className="flex gap-2"><span className="text-gov-blue">•</span> Análise e decisão pela chefia imediata</li>
              <li className="flex gap-2"><span className="text-gov-blue">•</span> Visão consolidada para a Coordenação CGU/AGU</li>
            </ul>
          </div>

          <div className="gov-card shadow-sm">
            <h2 className="font-display text-xl text-gov-blue-dark">Login institucional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse com seu usuário AGU.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="usuario" className="block text-sm font-semibold mb-1">
                  Usuário AGU <span className="text-gov-red">*</span>
                </label>
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue"
                  placeholder="ex: joao.silva"
                />
              </div>
              <div>
                <label htmlFor="senha" className="block text-sm font-semibold mb-1">
                  Senha <span className="text-gov-red">*</span>
                </label>
                <input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue"
                  placeholder="••••••••"
                />
              </div>

              <fieldset>
                <legend className="block text-sm font-semibold mb-2">Perfil de acesso (demonstração)</legend>
                <div className="grid gap-2">
                  {(["SOLICITANTE", "CHEFIA", "COORDENADOR"] as Role[]).map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                        perfil === r ? "border-gov-blue bg-gov-blue-light" : "border-border hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="perfil"
                        value={r}
                        checked={perfil === r}
                        onChange={() => setPerfil(r)}
                        className="mt-0.5 accent-gov-blue"
                      />
                      <span>
                        <span className="block font-semibold text-gov-blue-dark">
                          {r === "SOLICITANTE" && "Solicitante (Membro AGU)"}
                          {r === "CHEFIA" && "Chefia Imediata"}
                          {r === "COORDENADOR" && "Coordenação CGU/AGU"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r === "SOLICITANTE" && "Cria solicitações de magistério"}
                          {r === "CHEFIA" && "Aprova ou recusa solicitações"}
                          {r === "COORDENADOR" && "Acompanha indicadores e relatórios"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {erro && (
                <p role="alert" className="rounded-md bg-[oklch(0.95_0.05_27)] px-3 py-2 text-sm text-gov-danger">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
