import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, CheckCircle2, Send } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { messagingStore, useMessagingConfig, dispatchNotification } from "@/lib/messaging-store";
import type { MessagingConfig, MessagingProvider } from "@/lib/types";

export const Route = createFileRoute("/admin/mensageria")({
  head: () => ({ meta: [{ title: "Mensageria — Portal Magistério AGU" }] }),
  component: MensageriaPage,
});

function MensageriaPage() {
  const current = useMessagingConfig();
  const [form, setForm] = useState<MessagingConfig>(current);
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof MessagingConfig>(k: K, v: MessagingConfig[K]) =>
    setForm({ ...form, [k]: v });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.habilitado && form.provider === "NONE") {
      toast.error("Selecione um provedor (Google ou Microsoft) para habilitar a mensageria.");
      return;
    }
    if (form.habilitado && !form.remetente.trim()) {
      toast.error("Informe o e-mail remetente.");
      return;
    }
    messagingStore.set(form);
    toast.success("Configuração de mensageria salva.");
  };

  const testar = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      dispatchNotification({
        evento: "NOVA_SOLICITACAO",
        destinatarios: [{ nome: "Teste", email: form.remetente || "teste@agu.gov.br" }],
        protocolo: "AGU-TESTE",
        resumo: "Mensagem de teste do canal de mensageria.",
      });
      toast.success(`Mensagem de teste enviada via ${labelProvider(form.provider)} (simulação).`);
    }, 1000);
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Mensageria" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1">Serviço de Mensageria</h1>
            <p className="text-sm text-muted-foreground">
              Configure o provedor de e-mail usado para notificar solicitantes e chefias sobre novas solicitações
              e decisões.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              current.habilitado
                ? "bg-[oklch(0.94_0.08_145)] text-gov-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Mail className="h-4 w-4" /> {current.habilitado ? `Ativo · ${labelProvider(current.provider)}` : "Desativado"}
          </span>
        </div>

        <form onSubmit={save} className="mt-6 grid gap-6">
          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Provedor</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  { v: "GOOGLE", title: "Google Workspace", desc: "Gmail API · OAuth 2.0" },
                  { v: "MICROSOFT", title: "Microsoft 365", desc: "Microsoft Graph · sendMail" },
                  { v: "NONE", title: "Nenhum", desc: "Apenas registro interno (log)" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.v}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border-2 px-4 py-3 text-sm transition ${
                    form.provider === opt.v
                      ? "border-gov-blue bg-card text-gov-blue-dark"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    checked={form.provider === opt.v}
                    onChange={() => set("provider", opt.v as MessagingProvider)}
                    className="mt-0.5 accent-gov-blue"
                  />
                  <span>
                    <span className="block font-semibold">{opt.title}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="E-mail remetente" required>
                <input
                  value={form.remetente}
                  onChange={(e) => set("remetente", e.target.value)}
                  className={inp}
                  placeholder="magisterio@agu.gov.br"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Deve ser uma <strong>caixa de correio real</strong> existente no tenant
                  (usuário com Exchange Online ou <em>shared mailbox</em>). Endereços fictícios
                  como <code>no-reply@agu.gov.br</code> só funcionam se a caixa tiver sido
                  criada no Microsoft 365 e a aplicação tiver permissão <code>Mail.Send</code>
                  sobre ela.
                </p>
              </Field>
              <label className="inline-flex items-center gap-2 text-sm font-semibold mt-7">
                <input
                  type="checkbox"
                  checked={form.habilitado}
                  onChange={(e) => set("habilitado", e.target.checked)}
                  className="accent-gov-blue h-4 w-4"
                />
                Mensageria ativa
              </label>
            </div>
          </div>

          {form.provider === "GOOGLE" && (
            <div className="gov-card">
              <h2 className="font-display text-lg mb-1">Credenciais Google Workspace</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um projeto no Google Cloud, ative a API do Gmail e gere credenciais OAuth 2.0 com escopo
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">gmail.send</code>.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Client ID" required>
                  <input
                    value={form.googleClientId}
                    onChange={(e) => set("googleClientId", e.target.value)}
                    className={inp}
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                  />
                </Field>
                <Field label="Client Secret" required>
                  <input
                    type="password"
                    value={form.googleClientSecret}
                    onChange={(e) => set("googleClientSecret", e.target.value)}
                    className={inp}
                    placeholder="••••••••"
                  />
                </Field>
                <Field label="Refresh Token" required full>
                  <input
                    type="password"
                    value={form.googleRefreshToken}
                    onChange={(e) => set("googleRefreshToken", e.target.value)}
                    className={inp}
                    placeholder="1//0g..."
                  />
                </Field>
              </div>
            </div>
          )}

          {form.provider === "MICROSOFT" && (
            <div className="gov-card">
              <h2 className="font-display text-lg mb-1">Credenciais Microsoft 365 / Azure AD</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Registre uma aplicação no Azure AD com a permissão
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">Mail.Send</code> (Application) e
                conceda o consentimento do administrador. <strong>Importante:</strong> o e-mail
                remetente acima precisa ser uma <em>mailbox real</em> existente no tenant —
                caso contrário o Graph retorna <code>404 ErrorInvalidUser</code>. Para "no-reply",
                crie uma <em>shared mailbox</em> no Exchange Online e restrinja o acesso da app
                via <a className="underline" target="_blank" rel="noreferrer" href="https://learn.microsoft.com/exchange/permissions-exo/application-rbac">Application Access Policy</a>.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Tenant ID" required>
                  <input
                    value={form.msTenantId}
                    onChange={(e) => set("msTenantId", e.target.value)}
                    className={inp}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </Field>
                <Field label="Client ID (Application ID)" required>
                  <input
                    value={form.msClientId}
                    onChange={(e) => set("msClientId", e.target.value)}
                    className={inp}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </Field>
                <Field label="Client Secret" required full>
                  <input
                    type="password"
                    value={form.msClientSecret}
                    onChange={(e) => set("msClientSecret", e.target.value)}
                    className={inp}
                    placeholder="••••••••"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="gov-card">
            <h2 className="font-display text-lg mb-4">Eventos e destinatários</h2>
            <div className="grid gap-3">
              <Toggle
                label="Notificar abertura de solicitação"
                desc="Disparar e-mail quando uma nova solicitação for criada."
                checked={form.notificarNovaSolicitacao}
                onChange={(v) => set("notificarNovaSolicitacao", v)}
              />
              <Toggle
                label="Notificar decisão da chefia"
                desc="Disparar e-mail quando a chefia aprovar ou recusar a solicitação."
                checked={form.notificarDecisao}
                onChange={(v) => set("notificarDecisao", v)}
              />
              <div className="border-t border-border pt-3 mt-2 grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Enviar cópia ao solicitante"
                  desc="Inclui o autor da solicitação nos destinatários."
                  checked={form.copiaSolicitante}
                  onChange={(v) => set("copiaSolicitante", v)}
                />
                <Toggle
                  label="Enviar cópia à chefia imediata"
                  desc="Inclui a chefia apontada na solicitação."
                  checked={form.copiaChefia}
                  onChange={(v) => set("copiaChefia", v)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={testar}
              disabled={testing || form.provider === "NONE"}
              className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-gov-blue-light disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Send className="h-4 w-4 animate-pulse" /> Enviando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Enviar mensagem de teste
                </>
              )}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-gov-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark"
            >
              Salvar configurações
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

const inp = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue";

function Field({
  label,
  required,
  children,
  full,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-semibold mb-1">
        {label} {required && <span className="text-gov-red">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 hover:bg-accent">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-gov-blue h-4 w-4"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}

function labelProvider(p: MessagingProvider) {
  if (p === "GOOGLE") return "Google Workspace";
  if (p === "MICROSOFT") return "Microsoft 365";
  return "Nenhum";
}
