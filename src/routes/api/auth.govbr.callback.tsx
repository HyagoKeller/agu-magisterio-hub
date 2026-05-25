/**
 * Server route — Callback do Login Único gov.br.
 *
 * TODO em produção:
 *  - Validar `state` (CSRF) contra cookie httpOnly setado em /authorize.
 *  - POST em `${GOVBR_URI_PROVIDER}/token` (grant_type=authorization_code).
 *  - Buscar JWKS em `${GOVBR_URI_PROVIDER}/jwk` e validar assinatura do id_token.
 *  - Verificar nonce, iss, aud, exp.
 *  - Extrair CPF (claim `sub`) e mapear para o usuário local.
 *  - Emitir cookie de sessão (JWT assinado com SESSION_JWT_SECRET).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/govbr/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return new Response(`gov.br retornou erro: ${error}`, { status: 400 });
        }
        if (!code) {
          return new Response("Parâmetro 'code' ausente.", { status: 400 });
        }

        const provider = process.env.GOVBR_URI_PROVIDER;
        const clientId = process.env.GOVBR_CLIENT_ID;
        const clientSecret = process.env.GOVBR_CLIENT_SECRET;
        const redirectUri = process.env.GOVBR_REDIRECT_URI;

        if (!provider || !clientId || !clientSecret || !redirectUri) {
          return new Response(
            "Integração gov.br não configurada no servidor. Veja .env.example.",
            { status: 501 },
          );
        }

        // ---- Esqueleto da troca code → token (descomentar em produção) ----
        // const basic = btoa(`${clientId}:${clientSecret}`);
        // const tokenRes = await fetch(`${provider}/token`, {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/x-www-form-urlencoded",
        //     Authorization: `Basic ${basic}`,
        //   },
        //   body: new URLSearchParams({
        //     grant_type: "authorization_code",
        //     code,
        //     redirect_uri: redirectUri,
        //   }),
        // });
        // const tokens = await tokenRes.json(); // { access_token, id_token, ... }
        // const idTokenClaims = await verifyIdTokenWithJwks(tokens.id_token, `${provider}/jwk`);
        // const cpf = idTokenClaims.sub;
        // const user = await findOrLinkUserByCpf(cpf);
        // setSessionCookie(user);

        return new Response(
          `Callback gov.br recebido (code=${code.slice(0, 8)}…, state=${state}). ` +
            `Implementação pendente: troca de code por token, validação JWKS e emissão de sessão.`,
          { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      },
    },
  },
});
