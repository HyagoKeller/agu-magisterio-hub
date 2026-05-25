import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, ExternalLink, AlertCircle } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GOVBR_ENABLED } from "@/lib/feature-flags";

export const Route = createFileRoute("/admin/govbr")({
  component: GovbrPage,
});

type Cfg = {
  habilitado: boolean;
  ambiente: "homologacao" | "producao";
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
};

const KEY = "agu_govbr_config_v1";
const DEFAULT: Cfg = {
  habilitado: false,
  ambiente: "homologacao",
  clientId: "",
  clientSecret: "",
  redirectUri: "https://portal.agu.gov.br/api/auth/govbr/callback",
  scopes: "openid+email+profile+govbr_confiabilidades",
};

function GovbrPage() {
  const [form, setForm] = useState<Cfg>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setForm({ ...DEFAULT, ...JSON.parse(raw) });
    } catch { /* noop */ }
  }, []);

  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setForm({ ...form, [k]: v });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(KEY, JSON.stringify(form));
    toast.success("Parâmetros salvos. Para ativar definitivamente, replique no .env do servidor.");
  };

  const provider = form.ambiente === "producao"
    ? "https://sso.acesso.gov.br"
    : "https://sso.staging.acesso.gov.br";

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Login Único gov.br" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-gov-blue" /> Login Único gov.br (OAuth2 / OIDC)
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Parametrize aqui as credenciais OAuth2 do gov.br. O botão "Entrar com gov.br" na tela de login só aparece quando a integração está habilitada via variável de ambiente <code className="text-xs">VITE_GOVBR_ENABLED=true</code>.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${GOVBR_ENABLED ? "bg-[oklch(0.94_0.08_145)] text-gov-success" : "bg-muted text-muted-foreground"}`}>
            {GOVBR_ENABLED ? "Botão visível no login" : "Botão oculto no login"}
          </span>
        </div>

        {!GOVBR_ENABLED && (
          <div className="mt-4 rounded-md border border-gov-yellow/40 bg-[oklch(0.97_0.07_90)] px-4 py-3 text-sm text-foreground/80 flex gap-2">
            <AlertCircle className="h-5 w-5 text-gov-yellow shrink-0" />
            <div>
              Para exibir o botão "Entrar com gov.br" na tela de login, defina <code className="text-xs">VITE_GOVBR_ENABLED=true</code> no <code className="text-xs">.env</code> do servidor e refaça o build. Os campos abaixo são lidos pelo backend a partir de <code className="text-xs">process.env</code>.
            </div>
          </div>
        )}

        <form onSubmit={save} className="mt-6 grid gap-6">
          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Ambiente do Provider</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ambiente" required>
                <select value={form.ambiente} onChange={(e) => set("ambiente", e.target.value as Cfg["ambiente"])} className={inp}>
                  <option value="homologacao">Homologação (sso.staging.acesso.gov.br)</option>
                  <option value="producao">Produção (sso.acesso.gov.br)</option>
                </select>
              </Field>
              <Field label="GOVBR_URI_PROVIDER (calculado)">
                <input value={provider} readOnly className={`${inp} bg-muted`} />
              </Field>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-1">Credenciais OAuth2</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Obtidas em <a href="https://acesso.gov.br" target="_blank" rel="noreferrer" className="text-gov-blue hover:underline inline-flex items-center gap-1">acesso.gov.br <ExternalLink className="h-3 w-3" /></a> — área do desenvolvedor.
            </p>
            <div className="grid gap-4">
              <Field label="GOVBR_CLIENT_ID" required>
                <input value={form.clientId} onChange={(e) => set("clientId", e.target.value)} className={inp} placeholder="ex.: portal-magisterio-agu" />
              </Field>
              <Field label="GOVBR_CLIENT_SECRET" required>
                <input type="password" value={form.clientSecret} onChange={(e) => set("clientSecret", e.target.value)} className={inp} placeholder="••••••••••••••••" />
              </Field>
              <Field label="GOVBR_REDIRECT_URI" required>
                <input value={form.redirectUri} onChange={(e) => set("redirectUri", e.target.value)} className={inp} />
                <p className="text-xs text-muted-foreground mt-1">Deve bater <strong>exatamente</strong> com o redirect cadastrado no gov.br.</p>
              </Field>
              <Field label="GOVBR_SCOPES">
                <input value={form.scopes} onChange={(e) => set("scopes", e.target.value)} className={inp} />
              </Field>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Como aplicar no servidor</h2>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto"><code>{`# .env
VITE_GOVBR_ENABLED=true
GOVBR_URI_PROVIDER=${provider}
GOVBR_CLIENT_ID=${form.clientId || "<client_id>"}
GOVBR_CLIENT_SECRET=${form.clientSecret ? "******" : "<client_secret>"}
GOVBR_REDIRECT_URI=${form.redirectUri}
GOVBR_SCOPES=${form.scopes}`}</code></pre>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gov-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
              Salvar parâmetros
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

const inp = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {label} {required && <span className="text-gov-red">*</span>}
      </label>
      {children}
    </div>
  );
}
