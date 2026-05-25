import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { buildQrDataUrl, buildTotpUri, generateMfaSecret, verifyTotp } from "@/lib/mfa";

export const Route = createFileRoute("/perfil/mfa")({
  head: () => ({ meta: [{ title: "Habilitar MFA — Portal Magistério AGU" }] }),
  component: MfaSetupPage,
});

function MfaSetupPage() {
  const { user, enableMfa, disableMfa } = useAuth();
  const navigate = useNavigate();
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => { if (!user) navigate({ to: "/" }); }, [user, navigate]);

  const startSetup = async () => {
    const s = generateMfaSecret();
    const uri = buildTotpUri(s, user?.email ?? "usuario@agu.gov.br");
    setSecret(s);
    setQr(await buildQrDataUrl(uri));
    setCode("");
  };

  const confirm = () => {
    if (!secret) return;
    if (!verifyTotp(secret, code)) {
      toast.error("Código inválido. Verifique o relógio do dispositivo e tente novamente.");
      return;
    }
    enableMfa(secret);
    toast.success("MFA habilitado com sucesso.");
    setSecret(null); setQr(null); setCode("");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full bg-gradient-to-r from-gov-success via-gov-yellow to-gov-success" />
      <div className="gov-container max-w-2xl py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gov-blue hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="font-display text-2xl text-gov-blue-dark mt-4 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Autenticação em 2 fatores (MFA)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logado como <strong>{user.nome}</strong> ({user.email}).
        </p>

        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          {user.mfaEnabled && !secret ? (
            <>
              <div className="rounded-md bg-[oklch(0.94_0.08_145)] px-3 py-2 text-sm text-gov-success">
                MFA está <strong>habilitado</strong> para esta conta. No próximo login será solicitado o código do app autenticador.
              </div>
              <button
                onClick={() => { disableMfa(); toast.success("MFA desabilitado."); }}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-gov-danger px-4 py-2 text-sm font-semibold text-gov-danger hover:bg-[oklch(0.97_0.04_27)]"
              >
                Desabilitar MFA
              </button>
            </>
          ) : !secret ? (
            <>
              <h2 className="font-display text-lg text-gov-blue-dark">Habilitar MFA</h2>
              <ol className="mt-3 list-decimal pl-5 text-sm space-y-1.5 text-foreground/80">
                <li>Instale o <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong>.</li>
                <li>Clique em "Gerar QR Code" abaixo.</li>
                <li>Escaneie o QR no aplicativo.</li>
                <li>Digite o código de 6 dígitos exibido para confirmar.</li>
              </ol>
              <button
                onClick={startSetup}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark"
              >
                <ShieldCheck className="h-4 w-4" /> Gerar QR Code
              </button>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg text-gov-blue-dark">Escaneie o QR Code</h2>
              <div className="mt-4 flex flex-col items-center gap-3">
                {qr && <img src={qr} alt="QR Code para MFA" className="rounded-md border border-border bg-white p-2" />}
                <div className="w-full">
                  <p className="text-xs text-muted-foreground text-center">
                    Não consegue escanear? Digite manualmente no app este segredo:
                  </p>
                  <p className="mt-1 text-center font-mono text-xs break-all bg-muted rounded px-2 py-1.5">{secret}</p>
                </div>
              </div>

              <label className="block mt-5 text-sm font-semibold">Código de 6 dígitos do aplicativo *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-center text-lg font-mono tracking-[0.4em] focus:border-gov-blue"
              />
              <div className="mt-4 flex gap-2">
                <button onClick={confirm} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark">
                  Confirmar e habilitar
                </button>
                <button onClick={() => { setSecret(null); setQr(null); setCode(""); }} className="rounded-full border border-border px-4 py-2 text-sm">
                  Cancelar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
