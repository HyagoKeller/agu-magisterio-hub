import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, Server } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { adStore, useADConfig } from "@/lib/admin-store";
import type { ADConfig } from "@/lib/types";

export const Route = createFileRoute("/admin/ad")({
  component: ADPage,
});

function ADPage() {
  const current = useADConfig();
  const [form, setForm] = useState<ADConfig>(current);
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof ADConfig>(k: K, v: ADConfig[K]) => setForm({ ...form, [k]: v });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.servidor.trim() || !form.baseDN.trim() || !form.bindDN.trim()) {
      toast.error("Preencha servidor, Base DN e Bind DN.");
      return;
    }
    adStore.set(form);
    toast.success("Configuração do AD salva com sucesso.");
  };

  const testar = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success("Conexão com o AD validada (simulação).");
    }, 1200);
  };

  const sincronizar = () => {
    adStore.set({ ...form, ultimaSincronizacao: new Date().toISOString() });
    toast.success("Sincronização iniciada. Usuários dos grupos AGU foram atualizados (simulação).");
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Integração AD" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1">Integração com Active Directory</h1>
            <p className="text-sm text-muted-foreground">
              Configure o vínculo com o AD da AGU. Os perfis do portal são derivados dos grupos abaixo.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${current.habilitado ? "bg-[oklch(0.94_0.08_145)] text-gov-success" : "bg-muted text-muted-foreground"}`}>
            <Server className="h-4 w-4" /> {current.habilitado ? "Habilitado" : "Desativado"}
          </span>
        </div>

        <form onSubmit={save} className="mt-6 grid gap-6">
          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Conexão</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Servidor LDAP" required>
                <input value={form.servidor} onChange={(e) => set("servidor", e.target.value)} className={inp} placeholder="ldaps://ad.agu.gov.br" />
              </Field>
              <Field label="Porta" required>
                <input type="number" value={form.porta} onChange={(e) => set("porta", Number(e.target.value))} className={inp} />
              </Field>
              <Field label="Base DN" required>
                <input value={form.baseDN} onChange={(e) => set("baseDN", e.target.value)} className={inp} placeholder="DC=agu,DC=gov,DC=br" />
              </Field>
              <Field label="Domínio" required>
                <input value={form.dominio} onChange={(e) => set("dominio", e.target.value)} className={inp} placeholder="agu.gov.br" />
              </Field>
              <Field label="Bind DN (conta de serviço)" required>
                <input value={form.bindDN} onChange={(e) => set("bindDN", e.target.value)} className={inp} />
              </Field>
              <Field label="Senha do Bind">
                <input type="password" value={form.bindPassword} onChange={(e) => set("bindPassword", e.target.value)} className={inp} placeholder="••••••••" />
              </Field>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.usarSSL} onChange={(e) => set("usarSSL", e.target.checked)} className="accent-gov-blue h-4 w-4" />
              Usar SSL/TLS (LDAPS) — recomendado
            </label>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-1">Mapeamento de Grupos AD → Perfis</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Informe o nome (CN) do grupo de segurança no AD da AGU para cada perfil do portal.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Grupo Solicitantes" required>
                <input value={form.grupoSolicitantes} onChange={(e) => set("grupoSolicitantes", e.target.value)} className={inp} />
              </Field>
              <Field label="Grupo Chefia">
                <input value={form.grupoChefia} onChange={(e) => set("grupoChefia", e.target.value)} className={inp} />
              </Field>
              <Field label="Grupo Coordenação">
                <input value={form.grupoCoordenacao} onChange={(e) => set("grupoCoordenacao", e.target.value)} className={inp} />
              </Field>
              <Field label="Grupo Superadministrador">
                <input value={form.grupoSuperadmin} onChange={(e) => set("grupoSuperadmin", e.target.value)} className={inp} />
              </Field>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Sincronização</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.sincronizacaoAutomatica} onChange={(e) => set("sincronizacaoAutomatica", e.target.checked)} className="accent-gov-blue h-4 w-4" />
                Sincronização automática
              </label>
              <Field label="Intervalo (minutos)">
                <input type="number" min={5} value={form.intervaloSincronizacao} onChange={(e) => set("intervaloSincronizacao", Number(e.target.value))} className={inp} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 text-sm font-semibold mr-3">
                <input type="checkbox" checked={form.habilitado} onChange={(e) => set("habilitado", e.target.checked)} className="accent-gov-blue h-4 w-4" />
                Integração ativa
              </label>
              <button type="button" onClick={testar} disabled={testing} className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-gov-blue-light disabled:opacity-60">
                {testing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Testando…</> : <><CheckCircle2 className="h-4 w-4" /> Testar conexão</>}
              </button>
              <button type="button" onClick={sincronizar} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">
                <RefreshCw className="h-4 w-4" /> Sincronizar agora
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gov-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
              Salvar configurações
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
