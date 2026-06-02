import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, ExternalLink, AlertCircle } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { ENTRA_ENABLED } from "@/lib/feature-flags";

export const Route = createFileRoute("/admin/entra")({
  component: EntraPage,
});

type RoleKey = "SOLICITANTE" | "CHEFIA" | "COORDENADOR" | "SUPERADMIN";

type Cfg = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  exigirMfaPolicy: boolean;
  // Mapeamento de perfis (Entra → Portal)
  claimSource: "groups" | "roles" | "wids";
  defaultRole: RoleKey;
  autoProvision: boolean;
  groupMap: Record<RoleKey, string>;
};

const KEY = "agu_entra_config_v1";
const DEFAULT: Cfg = {
  tenantId: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "https://portal.agu.gov.br/api/auth/entra/callback",
  scopes: "openid profile email offline_access",
  exigirMfaPolicy: true,
  claimSource: "groups",
  defaultRole: "SOLICITANTE",
  autoProvision: true,
  groupMap: {
    SOLICITANTE: "",
    CHEFIA: "",
    COORDENADOR: "",
    SUPERADMIN: "",
  },
};

function EntraPage() {
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
    toast.success("Parâmetros salvos. Para ativar, replique no .env do servidor.");
  };

  const authority = form.tenantId
    ? `https://login.microsoftonline.com/${form.tenantId}`
    : "https://login.microsoftonline.com/<tenant_id>";

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Microsoft 365 / Entra ID" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-gov-blue" /> Microsoft 365 / Entra ID (OIDC + MFA)
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Delega a autenticação (senha + MFA) ao Microsoft Entra ID. O MFA é aplicado pelas <strong>Conditional Access Policies</strong> do tenant — não pelo portal. O botão "Entrar com Microsoft 365" só aparece quando <code className="text-xs">VITE_ENTRA_ENABLED=true</code> no servidor.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${ENTRA_ENABLED ? "bg-[oklch(0.94_0.08_145)] text-gov-success" : "bg-muted text-muted-foreground"}`}>
            {ENTRA_ENABLED ? "Botão visível no login" : "Botão oculto no login"}
          </span>
        </div>

        {!ENTRA_ENABLED && (
          <div className="mt-4 rounded-md border border-gov-yellow/40 bg-[oklch(0.97_0.07_90)] px-4 py-3 text-sm text-foreground/80 flex gap-2">
            <AlertCircle className="h-5 w-5 text-gov-yellow shrink-0" />
            <div>
              Para exibir o botão "Entrar com Microsoft 365" na tela de login, defina <code className="text-xs">VITE_ENTRA_ENABLED=true</code> no <code className="text-xs">.env</code> do servidor e refaça o build. As credenciais abaixo são lidas pelo backend a partir de <code className="text-xs">process.env</code>.
            </div>
          </div>
        )}

        <form onSubmit={save} className="mt-6 grid gap-6">
          <div className="gov-card">
            <h2 className="font-display text-lg mb-1">Aplicativo registrado no Entra ID</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Crie um App Registration em <a href="https://entra.microsoft.com" target="_blank" rel="noreferrer" className="text-gov-blue hover:underline inline-flex items-center gap-1">entra.microsoft.com <ExternalLink className="h-3 w-3" /></a> → Identity → Applications → App registrations.
            </p>
            <div className="grid gap-4">
              <Field label="ENTRA_TENANT_ID (Directory ID)" required>
                <input value={form.tenantId} onChange={(e) => set("tenantId", e.target.value)} className={inp} placeholder="00000000-0000-0000-0000-000000000000" />
              </Field>
              <Field label="ENTRA_CLIENT_ID (Application ID)" required>
                <input value={form.clientId} onChange={(e) => set("clientId", e.target.value)} className={inp} placeholder="00000000-0000-0000-0000-000000000000" />
              </Field>
              <Field label="ENTRA_CLIENT_SECRET" required>
                <input type="password" value={form.clientSecret} onChange={(e) => set("clientSecret", e.target.value)} className={inp} placeholder="••••••••••••••••" />
                <p className="text-xs text-muted-foreground mt-1">Gerado em "Certificates &amp; secrets" do App Registration.</p>
              </Field>
              <Field label="ENTRA_REDIRECT_URI" required>
                <input value={form.redirectUri} onChange={(e) => set("redirectUri", e.target.value)} className={inp} />
                <p className="text-xs text-muted-foreground mt-1">Cadastre o mesmo valor em "Authentication → Redirect URIs (Web)" no Entra ID.</p>
              </Field>
              <Field label="ENTRA_SCOPES">
                <input value={form.scopes} onChange={(e) => set("scopes", e.target.value)} className={inp} />
              </Field>
              <Field label="Authority (calculado)">
                <input value={authority} readOnly className={`${inp} bg-muted`} />
              </Field>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Política de MFA</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.exigirMfaPolicy} onChange={(e) => set("exigirMfaPolicy", e.target.checked)} className="mt-0.5 accent-gov-blue h-4 w-4" />
                <span>
                  <strong>Exigir Conditional Access com MFA</strong> no tenant para esta aplicação.
                  <span className="block text-xs text-muted-foreground mt-0.5">Configure em Entra ID → Protection → Conditional Access. O portal apenas confia no claim <code className="text-xs">amr</code> do token retornado pelo Entra ID.</span>
                </span>
              </label>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-1">Mapeamento de perfis (Entra ID → Portal)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Quando o usuário entra pelo 365, o portal lê os <strong>grupos/roles</strong> do token e atribui o perfil correspondente. A gestão de quem pertence a cada grupo é feita inteiramente no <strong>Entra ID</strong> (Identity → Groups ou App Roles), não neste portal.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Origem do claim">
                <select value={form.claimSource} onChange={(e) => set("claimSource", e.target.value as Cfg["claimSource"])} className={inp}>
                  <option value="groups">groups (Object IDs de Grupos de Segurança)</option>
                  <option value="roles">roles (App Roles do App Registration)</option>
                  <option value="wids">wids (Directory Roles bem conhecidos)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: <strong>App Roles</strong> (claim <code>roles</code>) — mais legível e independente de IDs de grupo.
                </p>
              </Field>
              <Field label="Perfil padrão (fallback)">
                <select value={form.defaultRole} onChange={(e) => set("defaultRole", e.target.value as RoleKey)} className={inp}>
                  <option value="SOLICITANTE">Solicitante</option>
                  <option value="CHEFIA">Chefia Imediata</option>
                  <option value="COORDENADOR">Coordenação CGAU</option>
                  <option value="SUPERADMIN">Superadministrador</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Aplicado quando o usuário não pertence a nenhum grupo mapeado.</p>
              </Field>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="text-sm font-semibold">Vínculos por perfil</div>
              {(Object.keys(form.groupMap) as RoleKey[]).map((role) => (
                <div key={role} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
                  <label className="text-sm">
                    {role === "SOLICITANTE" && "Solicitante"}
                    {role === "CHEFIA" && "Chefia Imediata"}
                    {role === "COORDENADOR" && "Coordenação CGAU"}
                    {role === "SUPERADMIN" && "Superadministrador"}
                  </label>
                  <input
                    value={form.groupMap[role]}
                    onChange={(e) => setForm({ ...form, groupMap: { ...form.groupMap, [role]: e.target.value } })}
                    className={inp}
                    placeholder={form.claimSource === "roles" ? "ex.: Portal.Coordenador" : "Object ID do grupo (GUID)"}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Para múltiplos grupos no mesmo perfil, separe por vírgula. Se o usuário pertencer a vários, o portal usa a <strong>maior precedência</strong>: SUPERADMIN &gt; COORDENADOR &gt; CHEFIA &gt; SOLICITANTE.
              </p>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.autoProvision} onChange={(e) => set("autoProvision", e.target.checked)} className="mt-0.5 accent-gov-blue h-4 w-4" />
                <span>
                  <strong>Provisionamento automático (Just-in-Time)</strong>
                  <span className="block text-xs text-muted-foreground mt-0.5">No 1º login, cria o usuário local com nome/e-mail/<code>oid</code> vindos do token e atribui o perfil conforme o mapeamento acima. Caso contrário, exige cadastro prévio em "Usuários e Grupos".</span>
                </span>
              </label>
            </div>

            <details className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-xs">
              <summary className="cursor-pointer font-semibold">Como configurar no Entra ID (passo a passo)</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li><strong>App Roles</strong> (recomendado): App registrations → seu app → <em>App roles</em> → crie 4 roles com <code>value</code>: <code>Portal.Solicitante</code>, <code>Portal.Chefia</code>, <code>Portal.Coordenador</code>, <code>Portal.Superadmin</code>.</li>
                <li>Em <em>Enterprise applications</em> → seu app → <em>Users and groups</em>, atribua usuários/grupos a cada role.</li>
                <li>Em <em>Token configuration</em>, adicione o claim opcional <code>groups</code> (se usar Grupos) ou habilite <code>roles</code> (já vem automático com App Roles).</li>
                <li>Cole os <code>value</code> das roles (ou os Object IDs dos grupos) nos campos acima e salve.</li>
                <li>O backend valida o <code>id_token</code>, lê o claim escolhido e atribui o perfil do portal — sem precisar de cadastro manual.</li>
              </ol>
            </details>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Como aplicar no servidor</h2>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto"><code>{`# .env
VITE_ENTRA_ENABLED=true
ENTRA_TENANT_ID=${form.tenantId || "<tenant_id>"}
ENTRA_CLIENT_ID=${form.clientId || "<client_id>"}
ENTRA_CLIENT_SECRET=${form.clientSecret ? "******" : "<client_secret>"}
ENTRA_REDIRECT_URI=${form.redirectUri}
ENTRA_SCOPES=${form.scopes}
ENTRA_CLAIM_SOURCE=${form.claimSource}
ENTRA_DEFAULT_ROLE=${form.defaultRole}
ENTRA_AUTO_PROVISION=${form.autoProvision}
ENTRA_ROLE_SOLICITANTE=${form.groupMap.SOLICITANTE || "<value|guid>"}
ENTRA_ROLE_CHEFIA=${form.groupMap.CHEFIA || "<value|guid>"}
ENTRA_ROLE_COORDENADOR=${form.groupMap.COORDENADOR || "<value|guid>"}
ENTRA_ROLE_SUPERADMIN=${form.groupMap.SUPERADMIN || "<value|guid>"}`}</code></pre>
            <p className="text-xs text-muted-foreground mt-3">
              No App Registration do Entra ID: defina o redirect URI acima, habilite <strong>ID tokens</strong> em "Authentication" e crie um client secret em "Certificates &amp; secrets".
            </p>
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
