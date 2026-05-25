/**
 * Server functions para o fluxo OAuth2 / OIDC do Login Único gov.br.
 *
 * ESTADO ATUAL: scaffolding pronto para parametrização. As variáveis
 * (GOVBR_CLIENT_ID, GOVBR_CLIENT_SECRET, GOVBR_URI_PROVIDER, GOVBR_REDIRECT_URI)
 * são lidas de `process.env` dentro dos handlers. Quando não estiverem
 * definidas, as funções respondem com um erro explicativo — assim a UI pode
 * ocultar o botão e administradores conseguem testar o pipeline.
 *
 * FLUXO COMPLETO (a implementar no servidor):
 *  1) /api/auth/govbr/authorize  → redireciona para `${GOVBR_URI_PROVIDER}/authorize`
 *     com client_id, redirect_uri, response_type=code, scope, state, nonce.
 *  2) Usuário autentica no gov.br (MFA nativo do gov.br se exigido pelo nível).
 *  3) gov.br chama GOVBR_REDIRECT_URI?code=...&state=...
 *  4) /api/auth/govbr/callback   → troca `code` por `access_token` + `id_token`
 *     em `${GOVBR_URI_PROVIDER}/token` (Basic Auth: client_id:client_secret).
 *  5) Validar a assinatura do id_token contra o JWKS:
 *        `${GOVBR_URI_PROVIDER}/jwk`
 *     (verificar iss, aud, exp, nonce).
 *  6) Extrair CPF do claim `sub` (no gov.br o `sub` é o CPF de 11 dígitos),
 *     procurar o usuário local pelo CPF e emitir o JWT de sessão do portal.
 */
import { createServerFn } from "@tanstack/react-start";

function readEnv() {
  return {
    clientId: process.env.GOVBR_CLIENT_ID ?? "",
    clientSecret: process.env.GOVBR_CLIENT_SECRET ?? "",
    provider: process.env.GOVBR_URI_PROVIDER ?? "",
    redirectUri: process.env.GOVBR_REDIRECT_URI ?? "",
    scopes: process.env.GOVBR_SCOPES ?? "openid+email+profile",
  };
}

/** Retorna a URL de autorização do gov.br para o frontend redirecionar. */
export const getGovbrAuthorizeUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    const env = readEnv();
    if (!env.clientId || !env.provider || !env.redirectUri) {
      return {
        ok: false as const,
        error:
          "Login gov.br não configurado. Defina GOVBR_CLIENT_ID, GOVBR_URI_PROVIDER e GOVBR_REDIRECT_URI no .env do servidor.",
      };
    }
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const url =
      `${env.provider}/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(env.clientId)}` +
      `&redirect_uri=${encodeURIComponent(env.redirectUri)}` +
      `&scope=${env.scopes}` +
      `&state=${state}` +
      `&nonce=${nonce}`;
    return { ok: true as const, url, state, nonce };
  },
);
