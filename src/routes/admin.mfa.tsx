import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, KeyRound } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";

export const Route = createFileRoute("/admin/mfa")({
  component: MfaAdminPage,
});

type Cfg = {
  obrigatorioParaPerfis: { SOLICITANTE: boolean; CHEFIA: boolean; COORDENADOR: boolean; SUPERADMIN: boolean };
  permitirOptIn: boolean;
  issuer: string;
  janelaCodigo: number;
};

const KEY = "agu_mfa_config_v1";
const DEFAULT: Cfg = {
  obrigatorioParaPerfis: { SOLICITANTE: false, CHEFIA: false, COORDENADOR: true, SUPERADMIN: true },
  permitirOptIn: true,
  issuer: "Portal Magistério AGU",
  janelaCodigo: 1,
};

function MfaAdminPage() {
  const [form, setForm] = useState<Cfg>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setForm({ ...DEFAULT, ...JSON.parse(raw) });
    } catch { /* noop */ }
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(KEY, JSON.stringify(form));
    toast.success("Política de MFA salva.");
  };

  const togglePerfil = (k: keyof Cfg["obrigatorioParaPerfis"]) =>
    setForm({ ...form, obrigatorioParaPerfis: { ...form.obrigatorioParaPerfis, [k]: !form.obrigatorioParaPerfis[k] } });

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Autenticação em 2 fatores (MFA)" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-gov-blue" /> Autenticação em 2 fatores (TOTP)
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Define a política de MFA do portal para o login local/LDAP. O segundo fator usa códigos TOTP de 6 dígitos (Google Authenticator, Microsoft Authenticator, Authy).
            </p>
          </div>
          <Link to="/perfil/mfa" className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-gov-blue-light">
            <KeyRound className="h-4 w-4" /> Configurar meu MFA
          </Link>
        </div>

        <form onSubmit={save} className="mt-6 grid gap-6">
          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Obrigatoriedade por perfil</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Marque os perfis que <strong>devem</strong> ativar o MFA para acessar o portal.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {(["SOLICITANTE", "CHEFIA", "COORDENADOR", "SUPERADMIN"] as const).map((p) => (
                <label key={p} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.obrigatorioParaPerfis[p]}
                    onChange={() => togglePerfil(p)}
                    className="accent-gov-blue h-4 w-4"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Parâmetros TOTP</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Emissor (aparece no app autenticador)">
                <input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} className={inp} />
              </Field>
              <Field label="Janela de validação (períodos de 30s)">
                <input type="number" min={0} max={3} value={form.janelaCodigo} onChange={(e) => setForm({ ...form, janelaCodigo: Number(e.target.value) })} className={inp} />
              </Field>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.permitirOptIn}
                onChange={(e) => setForm({ ...form, permitirOptIn: e.target.checked })}
                className="accent-gov-blue h-4 w-4"
              />
              Permitir que usuários não obrigados habilitem MFA voluntariamente
            </label>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-2">Como funciona no login</h2>
            <ol className="list-decimal pl-5 text-sm space-y-1.5 text-foreground/80">
              <li>Usuário informa CPF/usuário + senha (validado contra o AD/LDAP).</li>
              <li>Se o usuário tem <code className="text-xs">mfa_enabled = true</code>, o portal não emite o JWT imediatamente.</li>
              <li>É exibida a tela <code className="text-xs">/mfa/verify</code> pedindo o código de 6 dígitos.</li>
              <li>O backend valida o código contra <code className="text-xs">mfa_secret</code> (lib TOTP padrão) e só então emite a sessão.</li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Em produção, armazene <code className="text-xs">mfa_secret</code> cifrado e mova <code className="text-xs">verifyTotp</code> para uma server function.
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gov-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
              Salvar política
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

const inp = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}
