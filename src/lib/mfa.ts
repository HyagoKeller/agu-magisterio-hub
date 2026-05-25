/**
 * Utilitários TOTP (Time-based One-Time Password) — RFC 6238.
 *
 * Usa a lib `otpauth` (compatível com Google Authenticator, Authy, Microsoft
 * Authenticator). O segredo é gerado no cliente apenas para a DEMONSTRAÇÃO
 * (persistido em localStorage). Em produção, o segredo DEVE ser gerado e
 * armazenado no backend (coluna `mfa_secret` da tabela de usuários) e a
 * validação do código de 6 dígitos deve ocorrer server-side.
 */
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "Portal Magistério AGU";

export function generateMfaSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildTotpUri(secretBase32: string, accountLabel: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  return totp.toString();
}

export async function buildQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, { margin: 1, width: 240 });
}

/** Valida um código de 6 dígitos contra o segredo. Janela de ±1 (30s antes/depois). */
export function verifyTotp(secretBase32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
