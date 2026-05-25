import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { homeForRole, useAuth } from "@/lib/auth";
import { verifyTotp } from "@/lib/mfa";

export const Route = createFileRoute("/mfa/verify")({
  head: () => ({ meta: [{ title: "Verificação MFA — Portal Magistério AGU" }] }),
  component: MfaVerifyPage,
});

function MfaVerifyPage() {
  const { pendingMfa, completeMfa, cancelMfa } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  useEffect(() => { if (!pendingMfa) navigate({ to: "/" }); }, [pendingMfa, navigate]);

  if (!pendingMfa) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMfa.mfaSecret || !verifyTotp(pendingMfa.mfaSecret, code)) {
      toast.error("Código incorreto.");
      return;
    }
    completeMfa();
    toast.success("Autenticação concluída.");
    navigate({ to: homeForRole(pendingMfa.role) });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-[0_10px_30px_-15px_rgba(19,81,180,0.25)]">
        <div className="flex items-center gap-2 text-gov-blue-dark">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="font-display text-xl">Verificação em 2 etapas</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Olá, <strong>{pendingMfa.nome}</strong>. Digite o código de 6 dígitos do seu aplicativo autenticador para concluir o acesso.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="w-full rounded-md border border-input bg-card px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-gov-blue"
          />
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
            Verificar e entrar
          </button>
          <button type="button" onClick={() => { cancelMfa(); navigate({ to: "/" }); }} className="block w-full text-center text-xs text-muted-foreground hover:underline">
            Cancelar e voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}
