/**
 * Server functions para o fluxo OIDC do Microsoft Entra ID (Azure AD / 365).
 *
 * ESTADO ATUAL: scaffolding pronto para parametrização. Variáveis lidas de
 * `process.env` no servidor:
 *   ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET,
 *   ENTRA_REDIRECT_URI, ENTRA_SCOPES
 *
 * O MFA é validado nativamente pelo Entra ID conforme as Conditional Access
 * Policies do tenant — o portal não pede um segundo fator local.
 *
 * FLUXO COMPLETO (a implementar no servidor):
 *  1) /api/auth/entra/authorize → redireciona para
 *     https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
 *     com client_id, redirect_uri, response_type=code, response_mode=query,
 *     scope (openid profile email offline_access), state, nonce.
 *  2) Usuário autentica no Entra ID (senha + MFA conforme a política).
 *  3) Entra ID chama ENTRA_REDIRECT_URI?code=...&state=...
 *  4) /api/auth/entra/callback → troca `code` por tokens em
 *     https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
 *  5) Validar id_token contra o JWKS do tenant (iss/aud/exp/nonce).
 *  6) Mapear o claim `oid` (ou `preferred_username`) para o usuário local e
 *     emitir o JWT de sessão do portal.
 */
import { createServerFn } from "@tanstack/react-start";

function readEnv() {
  return {
    tenantId: process.env.ENTRA_TENANT_ID ?? "",
    clientId: process.env.ENTRA_CLIENT_ID ?? "",
    clientSecret: process.env.ENTRA_CLIENT_SECRET ?? "",
    redirectUri: process.env.ENTRA_REDIRECT_URI ?? "",
    scopes: process.env.ENTRA_SCOPES ?? "openid profile email offline_access",
  };
}

export const getEntraAuthorizeUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    const env = readEnv();
    if (!env.tenantId || !env.clientId || !env.redirectUri) {
      return {
        ok: false as const,
        error:
          "Login Microsoft 365 não configurado. Defina ENTRA_TENANT_ID, ENTRA_CLIENT_ID e ENTRA_REDIRECT_URI no .env do servidor.",
      };
    }
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const url =
      `https://login.microsoftonline.com/${encodeURIComponent(env.tenantId)}/oauth2/v2.0/authorize` +
      `?client_id=${encodeURIComponent(env.clientId)}` +
      `&response_type=code` +
      `&response_mode=query` +
      `&redirect_uri=${encodeURIComponent(env.redirectUri)}` +
      `&scope=${encodeURIComponent(env.scopes)}` +
      `&state=${state}` +
      `&nonce=${nonce}`;
    return { ok: true as const, url, state, nonce };
  },
);
