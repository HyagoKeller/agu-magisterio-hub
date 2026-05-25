# Parametrização — Login gov.br + MFA TOTP

Este projeto deixa toda a estrutura **pronta para ser parametrizada** no
servidor da AGU. Nenhuma credencial é necessária para o protótipo rodar.

## 1. Variáveis de ambiente

Copie `.env.example` para `.env` no servidor e preencha:

```bash
cp .env.example .env
```

| Variável | Onde obter | Obrigatório |
|---|---|---|
| `VITE_GOVBR_ENABLED` | `true` para exibir o botão "Entrar com gov.br" | sim |
| `GOVBR_CLIENT_ID` | Portal de serviços gov.br → área do desenvolvedor | sim |
| `GOVBR_CLIENT_SECRET` | idem (tratar como senha) | sim |
| `GOVBR_URI_PROVIDER` | `https://sso.staging.acesso.gov.br` (hom.) ou `https://sso.acesso.gov.br` (prod.) | sim |
| `GOVBR_REDIRECT_URI` | URL pública que receberá o callback. Deve **bater exatamente** com o cadastrado no gov.br. Ex.: `https://portal.agu.gov.br/api/auth/govbr/callback` | sim |
| `GOVBR_SCOPES` | `openid+email+profile+govbr_confiabilidades` | recomendado |
| `MFA_ISSUER` | Nome exibido no Google Authenticator/Authy | recomendado |
| `SESSION_JWT_SECRET` | String aleatória de 64+ caracteres (`openssl rand -hex 32`) | sim em prod |

## 2. Comportamento do botão "Entrar com gov.br"

- `VITE_GOVBR_ENABLED=false` (padrão) → botão **oculto** na tela de login.
- `VITE_GOVBR_ENABLED=true` → botão **visível**. Ao clicar, chama
  `getGovbrAuthorizeUrl` (server function) que monta a URL e redireciona.
  Se as variáveis do servidor estiverem incompletas, mostra mensagem de erro.

## 3. Fluxo OAuth2 / OIDC

1. **Authorize** — `src/lib/govbr.functions.ts` → `getGovbrAuthorizeUrl()`
   monta `${GOVBR_URI_PROVIDER}/authorize?...` com `state` e `nonce`.
2. **Callback** — `src/routes/api/auth.govbr.callback.tsx` recebe o `code`.
   O esqueleto está comentado (descomentar em produção):
   - Troca `code` por `access_token` + `id_token` em `/token` (Basic Auth).
   - Valida assinatura do `id_token` contra o JWKS (`/jwk`).
   - Verifica `iss`, `aud`, `exp`, `nonce`.
   - Extrai CPF do claim `sub` e mapeia para o usuário local (LDAP/AD).
   - Emite cookie de sessão (JWT assinado com `SESSION_JWT_SECRET`).

> Recomendação: use `jose` (ESM, edge-compatible) para validar JWKS.
> Instalar quando for ativar: `bun add jose`.

## 4. MFA TOTP (login local/LDAP)

Banco de dados — adicionar à tabela de usuários:

```sql
ALTER TABLE usuarios ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN mfa_secret  TEXT;
```

Telas já implementadas no protótipo:

- **Habilitar MFA** — `/perfil/mfa`: gera segredo, exibe QR Code e valida o
  primeiro código antes de marcar `mfa_enabled=true`.
- **Verificação intermediária** — `/mfa/verify`: após a senha local ser
  validada, se `mfa_enabled=true` o usuário é redirecionado para esta tela
  e só recebe a sessão depois de digitar o código de 6 dígitos.

Arquivo de utilitários TOTP: `src/lib/mfa.ts` (lib `otpauth`).

> Em **produção**, mover `generateMfaSecret` e `verifyTotp` para server
> functions e armazenar `mfa_secret` cifrado no banco. No protótipo atual
> o segredo é mantido em `localStorage` apenas para demonstração.

## 5. Subindo no servidor

```bash
git pull
cp .env.example .env   # se ainda não existir
nano .env              # preencher credenciais gov.br
bun install
bun run build
# inicie via PM2 / systemd / docker conforme infra
```
