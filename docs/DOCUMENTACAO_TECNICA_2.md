# Portal Magistério AGU — Documentação Técnica de Implantação

**Destinatários:** Coordenadoria de Sistemas / CGAU — Advocacia-Geral da União
**Versão:** 2.0
**Data:** Maio/2026

**Equipe envolvida:**
- **Hyago Keller** — Gerente de Projetos / Especialista Técnico
- **Yan Basílio** — Analista de Automações

---

## 1. Visão Geral

O **Portal Magistério AGU** é a aplicação institucional para registro, análise e gestão das solicitações de atividade de magistério dos membros da AGU (Advogados da União, Procuradores da Fazenda Nacional, Procuradores Federais, Procuradores do Banco Central e Quadro Suplementar).

### 1.1 Perfis de acesso

| Perfil | Função |
|---|---|
| **Solicitante** | Membro AGU que cria/edita suas solicitações e recursos. |
| **Chefia Imediata** | Aprova/recusa solicitações da sua unidade. |
| **Coordenador (CGAU)** | Visão consolidada, FAQ, relatórios, gestão de acessos. |
| **Superadministrador** | Configura AD, gov.br, Microsoft 365, MFA, mensageria, usuários. |

### 1.2 Fluxo macro

```
Solicitante  →  Chefia  →  Coordenação (CGAU)  →  Histórico/Recurso
```

---

## 2. Arquitetura Técnica

### 2.1 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript |
| Roteamento/SSR | TanStack Start v1 (file-based routing) |
| Build/Bundler | Vite 7 |
| Estilos | Tailwind CSS v4 + Design Tokens (`oklch`) padrão gov.br |
| Backend API | Node.js HTTP server customizado (`node-server.mjs`) |
| Persistência | PostgreSQL 16+ (pool via `pg`) |
| Containerização | Docker multi-stage (Dockerfile incluso) |
| Runtime | Node.js 20 LTS + tsx (TypeScript server-side) |

### 2.2 Repositório — estrutura relevante

```
src/
├── routes/                    # Páginas (file-based routing TanStack)
│   ├── index.tsx              # Tela de login (SSO buttons)
│   ├── admin.tsx              # Layout admin
│   ├── admin.ad.tsx           # Config Integração AD
│   ├── admin.govbr.tsx        # Config Login gov.br
│   ├── admin.entra.tsx        # Config Microsoft 365 / Entra ID
│   ├── admin.mfa.tsx          # Config política MFA
│   ├── admin.mensageria.tsx   # Config notificações
│   ├── admin.usuarios.tsx     # Gestão de usuários
│   ├── admin.acessos.tsx      # Solicitações de acesso
│   ├── auth.entra.callback.tsx  # Callback OIDC Entra ID
│   ├── auth.govbr.callback.tsx  # Callback OIDC gov.br
│   ├── perfil.mfa.tsx         # Config MFA pessoal (TOTP)
│   ├── solicitante.*          # Área do membro
│   ├── chefia.*               # Aprovação
│   └── coordenador.*          # CGAU
├── lib/
│   ├── auth.tsx               # Contexto de sessão (React Context)
│   ├── api-client.ts          # Cliente HTTP (fetch + JWT)
│   ├── feature-flags.ts       # Flags VITE_*_ENABLED
│   └── server/
│       ├── api.ts             # Router HTTP — todos os endpoints
│       ├── db.ts              # Pool PostgreSQL (pg)
│       ├── jwt.ts             # Geração/validação JWT (HS256)
│       ├── entra.ts           # OIDC Microsoft Entra ID
│       ├── govbr.ts           # OIDC Login Único gov.br
│       ├── ldap.ts            # Autenticação AD/LDAP (desabilitado)
│       ├── mfa.ts             # TOTP (otpauth + qrcode)
│       ├── mail.ts            # Microsoft Graph sendMail
│       ├── error-logger.ts    # Logs de erro (PostgreSQL)
│       └── repositories/
│           ├── usuarios.ts    # CRUD usuários
│           ├── solicitacoes.ts # CRUD solicitações
│           ├── access-requests.ts # Solicitações de acesso
│           ├── mfa.ts         # MFA status/secret
│           └── audit.ts       # Logs de auditoria
├── components/                # Componentes reutilizáveis (shadcn/ui)
└── assets/
database/
├── schema.sql                 # Schema completo (DDL)
├── seed.sql                   # Dados iniciais
├── migrations/
│   ├── 001_add_mfa_columns.sql
│   └── 002_add_entra_origin_and_audit.sql
└── README.md
```

---

## 3. Autenticação e Identidade

O portal suporta **três caminhos de autenticação**, ativáveis individualmente por feature-flag.

**Estado atual da implementação:**

| Método | Feature Flag | Status |
|---|---|---|
| Microsoft 365 / Entra ID | `VITE_ENTRA_ENABLED=true` | Implementado (login principal) |
| Login Único gov.br | `VITE_GOVBR_ENABLED=true` | Implementado (opcional) |
| AD/LDAP local | — | ⏸ Desabilitado (código mantido para reativação) |

### 3.1 Microsoft 365 / Entra ID (OIDC) — **Login principal**

- Botão "Entrar com Microsoft 365" exibido quando `VITE_ENTRA_ENABLED=true`.
- Fluxo OIDC Authorization Code implementado em `src/lib/server/entra.ts`:
  1. Frontend chama `GET /api/auth/entra/authorize` → recebe `url`, `state`, `nonce`.
  2. Frontend salva `state` e `nonce` em `sessionStorage` e redireciona para o Entra ID.
  3. Usuário autentica no tenant da AGU (senha + **MFA via Conditional Access Policy**).
  4. Entra ID redireciona para `/auth/entra/callback?code=...&state=...`.
  5. Frontend valida `state`, envia `code` + `nonce` para `POST /api/auth/entra/callback`.
  6. Backend troca `code` por tokens em `/oauth2/v2.0/token`.
  7. `id_token` é validado contra JWKS do Entra ID (`iss`, `aud`, `exp`, `nonce`).
  8. Busca dados adicionais via Microsoft Graph `/me` (displayName, mail).
  9. Upsert do usuário no banco local (busca por email).
  10. Registra evento de auditoria (`LOGIN_ENTRA`).
  11. Emite JWT de sessão do portal.
- **O MFA é responsabilidade exclusiva do tenant** — não há TOTP local para login via Entra.

### 3.2 Login Único gov.br (OIDC) — opcional

- Botão "Entrar com gov.br" exibido quando `VITE_GOVBR_ENABLED=true`.
- Fluxo implementado em `src/lib/server/govbr.ts`:
  1. `GET /api/auth/govbr/authorize` → gera URL com state/nonce.
  2. Callback em `POST /api/auth/govbr/callback` → troca code, valida id_token via JWKS.
  3. Extrai CPF do campo `sub`, busca/cria usuário local.
  4. Emite JWT de sessão.
- MFA aplicado nativamente pelo gov.br conforme nível de confiabilidade.

### 3.3 Login local (AD/LDAP) — desabilitado

- Código mantido em `src/lib/server/ldap.ts` para reativação futura.
- Endpoint `POST /api/auth/login` retorna HTTP 403 com mensagem orientando usar Microsoft 365.
- Quando reativado, valida usuário/senha contra o AD e resolve perfil pelos grupos:
  - `G-DF-DTI-INFRAESTRUTURA-MAGISTERIO` → SUPERADMIN
  - `G-DF-CGAU-COORDENACAO-MAGISTERIO` → COORDENADOR
  - Grupo chefia (configurável) → CHEFIA
  - Demais → SOLICITANTE

---

## 4. MFA — Política Adotada

> **Decisão arquitetural:** o portal **não opera MFA próprio (TOTP)** para o login principal.
> O 2º fator é delegado **exclusivamente ao Microsoft Entra ID** (Conditional Access).

### 4.1 Justificativa

| Critério | TOTP local | Entra ID (escolhido) |
|---|---|---|
| Gestão centralizada | ❌ | ✅ (já existe no tenant AGU) |
| Conformidade institucional | parcial | ✅ |
| Recuperação de fator | manual | ✅ Self-service do tenant |
| Métodos suportados | só TOTP | Microsoft Authenticator, SMS, FIDO2, etc. |
| Auditoria | local | ✅ Logs do Entra ID |
| Custo operacional | alto | baixo |

### 4.2 Infraestrutura TOTP mantida

O código de MFA TOTP local (`src/lib/server/mfa.ts`, `src/routes/perfil.mfa.tsx`, `src/routes/admin.mfa.tsx`) permanece no repositório para cenários futuros onde o login AD/LDAP seja reativado sem Entra ID. Nesse caso, o MFA TOTP local seria o 2º fator.

### 4.3 Como configurar Conditional Access no tenant

1. **Entra ID → Identity → Applications → App registrations** → localizar ou criar:
   - Nome: `Portal Magistério AGU`
   - Supported account types: *Accounts in this organizational directory only*.
   - Redirect URI (Web): `https://portal.agu.gov.br/api/auth/entra/callback`.
2. Em **Authentication**: marcar **ID tokens** (Implicit and hybrid flows).
3. Em **Certificates & secrets**: criar um *client secret* (validade ≤ 24 meses).
4. Em **API permissions** (Delegated): `openid`, `profile`, `email`, `offline_access`. Clicar *Grant admin consent*.
5. **Protection → Conditional Access** → criar policy:
   - Users/groups: grupos do magistério.
   - Cloud apps: o app registrado.
   - Grant: **Require multifactor authentication**.

### 4.4 Variáveis Entra ID

```env
VITE_ENTRA_ENABLED=true
ENTRA_TENANT_ID=<Directory (tenant) ID>
ENTRA_CLIENT_ID=<Application (client) ID>
ENTRA_CLIENT_SECRET=<valor do client secret>
ENTRA_REDIRECT_URI=https://portal.agu.gov.br/api/auth/entra/callback
ENTRA_SCOPES=openid profile email offline_access
```

---

## 5. Banco de Dados

### 5.1 PostgreSQL

| Item | Especificação |
|---|---|
| SGBD | PostgreSQL 16+ |
| Schema | público (tabelas no schema `public`) |
| Backup | Diário (full) + WAL contínuo |
| Charset | UTF-8 |
| Pool | `pg` (max 20 conexões, idle 30s) |

### 5.2 Tabelas implementadas

| Tabela | Função |
|---|---|
| `usuarios` | Cadastro de usuários (id, nome, email, role, origem, mfa_*, entra_oid, cpf) |
| `solicitacoes` | Solicitações de magistério (protocolo, status, horários, disciplinas) |
| `historico_eventos` | Timeline de eventos por solicitação |
| `access_requests` | Solicitações de acesso externo |
| `ad_config` | Configuração do AD (singleton, id=1) |
| `faq_items` | Perguntas frequentes |
| `error_logs` | Logs de erro da aplicação |
| `audit_logs` | **Logs de auditoria** (login, decisões, mudanças) ✅ |

### 5.3 Enums

```sql
CREATE TYPE role_tipo AS ENUM ('SOLICITANTE', 'CHEFIA', 'COORDENADOR', 'SUPERADMIN');
CREATE TYPE origem_tipo AS ENUM ('AD', 'MANUAL', 'ENTRA');
CREATE TYPE solicitacao_status AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');
CREATE TYPE solicitacao_tipo AS ENUM ('Solicitação', 'Correção');
CREATE TYPE access_request_status AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');
```

### 5.4 Migrations

Executar em ordem no banco de produção:

```bash
psql $DATABASE_URL -f database/schema.sql          # Deploy inicial
psql $DATABASE_URL -f database/migrations/001_add_mfa_columns.sql
psql $DATABASE_URL -f database/migrations/002_add_entra_origin_and_audit.sql
```

---

## 6. Requisitos Técnicos

### 6.1 Servidor de aplicação

| Item | Mínimo | Recomendado |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 10 GB | 20 GB SSD |
| Sistema | Linux (Ubuntu 22.04 / RHEL 9) | — |
| Runtime | Node.js 20 LTS | Node.js 20 LTS |
| Container | Docker 24+ | Docker + Compose |
| TLS | obrigatório (Let's Encrypt / cert institucional) | — |

### 6.2 Rede / Firewall (egress)

| Origem | Destino | Porta | Uso |
|---|---|---|---|
| App | `login.microsoftonline.com` | 443 | OIDC Entra ID (authorize, token, JWKS) |
| App | `graph.microsoft.com` | 443 | Microsoft Graph (userinfo, sendMail) |
| App | `sso.acesso.gov.br` | 443 | OIDC gov.br (se habilitado) |
| App | AD interno AGU | 636 (LDAPS) | Autenticação local (se reativado) |
| App | PostgreSQL | 5432 | Dados |
| Internet | App (portal) | 443 | Acesso usuário |

### 6.3 DNS / Domínio

- Domínio sugerido: `portal.agu.gov.br`
- Certificado TLS válido com cadeia ICP-Brasil ou autoridade pública aceita.
- Redirect URIs registrados nos provedores OIDC devem casar **exatamente** com o domínio publicado.

### 6.4 Active Directory (quando reativado)

| Requisito | Valor |
|---|---|
| Versão | Windows Server AD 2016+ |
| Protocolo | LDAPS (porta 636) |
| Conta de serviço | `svc-portal-magisterio` (somente leitura) |
| Base DN | `DC=AGU,DC=GOV,DC=BR` |
| Atributos lidos | `sAMAccountName`, `mail`, `displayName`, `memberOf`, `employeeID` |
| Grupos necessários | `G-DF-DTI-INFRAESTRUTURA-MAGISTERIO`, `G-DF-CGAU-COORDENACAO-MAGISTERIO` + chefia |

---

## 7. Endpoints HTTP (API)

### 7.1 Autenticação

| Endpoint | Método | Função | Status |
|---|---|---|---|
| `/api/auth/login` | POST | Login LDAP (desabilitado — retorna 403) | ⏸️ |
| `/api/auth/me` | GET | Retorna dados do usuário autenticado | ✅ |
| `/api/auth/entra/authorize` | GET | Gera URL de autorização Entra ID | ✅ |
| `/api/auth/entra/callback` | POST | Troca code por tokens, emite JWT | ✅ |
| `/api/auth/govbr/authorize` | GET | Gera URL de autorização gov.br | ✅ |
| `/api/auth/govbr/callback` | POST | Troca code por tokens, emite JWT | ✅ |

### 7.2 MFA

| Endpoint | Método | Função | Status |
|---|---|---|---|
| `/api/mfa/status` | GET | Status MFA do usuário logado | ✅ |
| `/api/mfa/setup` | POST | Gera segredo + QR Code | ✅ |
| `/api/mfa/enable` | POST | Valida código e habilita MFA | ✅ |
| `/api/mfa/disable` | POST | Valida código e desabilita MFA | ✅ |
| `/api/mfa/verify` | POST | Verifica código TOTP (fluxo login) | ✅ |

### 7.3 Negócio

| Endpoint | Método | Função |
|---|---|---|
| `/api/solicitacoes` | GET | Lista solicitações (filtros: solicitanteId, chefiaId, status) |
| `/api/solicitacoes/:id` | GET | Detalhe de uma solicitação |
| `/api/solicitacoes` | POST | Cria nova solicitação |
| `/api/solicitacoes/:id/decidir` | POST | Aprova/recusa (chefia) |
| `/api/solicitacoes/:id/recurso` | POST | Registra recurso |
| `/api/usuarios` | GET | Lista todos os usuários |
| `/api/usuarios` | POST | Cria usuário |
| `/api/usuarios/:id` | PATCH | Atualiza usuário |
| `/api/usuarios/:id` | DELETE | Remove usuário |
| `/api/access-requests` | GET/POST | Solicitações de acesso externo |
| `/api/access-requests/:id/decidir` | POST | Aprova/recusa acesso |

### 7.4 Administração

| Endpoint | Método | Função |
|---|---|---|
| `/api/logs` | GET | Logs de erro (SUPERADMIN) |
| `/api/audit` | GET | Logs de auditoria (SUPERADMIN) |
| `/api/mail/test` | POST | Envia email de teste |

### 7.5 Rotas UI

| Rota | Perfil | Função |
|---|---|---|
| `/` | Público | Tela de login (botões SSO) |
| `/faq` | Público | FAQ |
| `/auth/entra/callback` | Público | Callback Entra ID |
| `/auth/govbr/callback` | Público | Callback gov.br |
| `/perfil/mfa` | Autenticado | Configurar MFA pessoal |
| `/solicitante/*` | Solicitante | Área do membro |
| `/chefia/*` | Chefia | Aprovação |
| `/coordenador/*` | Coordenador | CGAU |
| `/admin` | Superadmin | Visão geral |
| `/admin/ad` | Superadmin | Integração AD |
| `/admin/govbr` | Superadmin | Config Login gov.br |
| `/admin/entra` | Superadmin | Config Microsoft 365 |
| `/admin/mfa` | Superadmin | Política MFA |
| `/admin/mensageria` | Superadmin | Notificações |
| `/admin/usuarios` | Superadmin | Usuários e Grupos |
| `/admin/acessos` | Superadmin | Solicitações de Acesso |

---

## 8. Mensageria / Notificações

Implementado via **Microsoft Graph API** (`src/lib/server/mail.ts`):

- **Provedor:** Microsoft Graph (reaproveita o mesmo tenant do Entra ID).
- **Credenciais:** `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID`, `MSGRAPH_CLIENT_SECRET`.
- **Remetente:** `MSGRAPH_SENDER_EMAIL` (ex: `magisterio-noreply@agu.gov.br`).
- **Eventos notificados:**
  - Nova solicitação criada → email para solicitante + chefia.
  - Decisão (aprovada/recusada) → email para solicitante.
  - Recurso registrado → email para chefia.
  - Correção submetida → email para chefia.
- Configurável em **Admin → Mensageria**.

---

## 9. Variáveis de Ambiente — `.env` completo

```env
# ─── Banco de Dados ───────────────────────────────────────────────────────
DATABASE_URL=postgresql://magisterio_user:SENHA@host:5432/agu_magisterio

# ─── JWT / Sessão ─────────────────────────────────────────────────────────
JWT_SECRET=<gerar com: openssl rand -base64 64>
JWT_EXPIRES_IN=8h
SESSION_JWT_SECRET=<gerar com: openssl rand -base64 64>

# ─── Servidor ─────────────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=8080
NODE_ENV=production

# ─── Feature Flags (build-time, Vite) ────────────────────────────────────
VITE_ENTRA_ENABLED=true
VITE_GOVBR_ENABLED=false

# ─── Microsoft Entra ID (login principal) ─────────────────────────────────
ENTRA_TENANT_ID=<Directory (tenant) ID>
ENTRA_CLIENT_ID=<Application (client) ID>
ENTRA_CLIENT_SECRET=<client secret value>
ENTRA_REDIRECT_URI=https://portal.agu.gov.br/api/auth/entra/callback
ENTRA_SCOPES=openid profile email offline_access

# ─── Microsoft Graph (notificações por email) ────────────────────────────
MSGRAPH_TENANT_ID=<mesmo tenant>
MSGRAPH_CLIENT_ID=<pode ser o mesmo app ou outro>
MSGRAPH_CLIENT_SECRET=<secret>
MSGRAPH_SENDER_EMAIL=magisterio-noreply@agu.gov.br

# ─── Gov.br (opcional) ────────────────────────────────────────────────────
GOVBR_CLIENT_ID=
GOVBR_CLIENT_SECRET=
GOVBR_URI_PROVIDER=https://sso.acesso.gov.br
GOVBR_REDIRECT_URI=https://portal.agu.gov.br/api/auth/govbr/callback

# ─── AD/LDAP (desabilitado, mantido para referência) ─────────────────────
LDAP_SERVER=ldaps://10.207.112.2
LDAP_PORT=636
LDAP_BASE_DN=DC=AGU,DC=GOV,DC=BR
LDAP_DOMAIN=AGU
LDAP_USE_TLS=true
LDAP_ADMIN_GROUP=G-DF-DTI-INFRAESTRUTURA-MAGISTERIO
LDAP_CHEFIA_GROUP=
LDAP_COORDENADOR_GROUP=G-DF-CGAU-COORDENACAO-MAGISTERIO

# ─── MFA TOTP (usado apenas se login LDAP for reativado) ─────────────────
MFA_ISSUER=Portal Magistério AGU
```

> ⚠️ Segredos **nunca** devem entrar no repositório. Use vault institucional ou variáveis injetadas no orquestrador (Docker Secret, Kubernetes Secret, etc.).

---

## 10. Deploy

### 10.1 Build

```bash
npm ci --legacy-peer-deps
npm run build
```

O build gera:
- `dist/client/` — assets estáticos (JS, CSS, imagens)
- `dist/server/` — worker SSR (TanStack Start)

### 10.2 Execução (Docker Compose — recomendado)

```bash
docker compose up -d --build
```

O `docker-compose.yml` inclui:
- **app** — aplicação Node.js (porta 8080)
- **db** — PostgreSQL 16 Alpine (porta 5432, volume persistente)

O schema é aplicado automaticamente via `docker-entrypoint-initdb.d`.

### 10.3 Execução (Docker standalone)

```bash
docker build -t portal-magisterio-agu .
docker run -d --name portal-magisterio \
  --env-file .env \
  -p 8080:8080 \
  portal-magisterio-agu
```

### 10.4 Execução local (desenvolvimento)

```bash
npm ci --legacy-peer-deps
npm run dev
```

### 10.5 Proxy reverso (Nginx)

```nginx
server {
  server_name portal.agu.gov.br;
  listen 443 ssl http2;
  ssl_certificate     /etc/ssl/agu/portal.crt;
  ssl_certificate_key /etc/ssl/agu/portal.key;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 11. Segurança

- **TLS 1.2+** obrigatório em toda comunicação externa.
- **JWT de sessão** assinado com `JWT_SECRET` (HS256) — vida útil 8h.
- **State + Nonce** validados em todo fluxo OIDC (proteção contra CSRF e replay).
- **JWKS validation** — id_tokens do Entra ID e gov.br são validados contra chaves públicas (jose).
- **Rate limiting** sugerido no proxy reverso (10 req/s por IP em `/api/auth/*`).
- **Autorização server-side** — `hasMinRole()` verifica perfil em todos os endpoints protegidos.
- **Auditoria** — tabela `audit_logs` registra logins, decisões e mudanças de status.
- **Healthcheck** — endpoint `GET /api` retorna status da aplicação (usado pelo Docker).
- **CORS** — headers configurados no `node-server.mjs` para desenvolvimento.

---

## 12. Auditoria

### 12.1 Tabela `audit_logs`

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY,
    user_id         UUID REFERENCES usuarios(id),
    user_email      VARCHAR(255),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(100),
    details         JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 12.2 Ações registradas

| Action | Quando |
|---|---|
| `LOGIN_ENTRA` | Login bem-sucedido via Microsoft 365 |
| `LOGIN_GOVBR` | Login bem-sucedido via gov.br |
| `LOGIN_LDAP` | Login bem-sucedido via AD (quando reativado) |

### 12.3 Endpoint

`GET /api/audit?limit=100&offset=0&action=LOGIN_ENTRA&userId=<uuid>`

Acesso restrito a SUPERADMIN.

---

## 13. Checklist de Entrega para a CGAU

| # | Item | Responsável | Status |
|---|---|---|---|
| 1 | Provisionar VM ou cluster (specs §6.1) | Infra CGAU | ☐ |
| 2 | Criar banco PostgreSQL + executar schema.sql + migrations | DBA CGAU | ☐ |
| 3 | Liberar regras de firewall (§6.2) | Rede CGAU | ☐ |
| 4 | DNS `portal.agu.gov.br` + certificado TLS | Rede CGAU | ☐ |
| 5 | App Registration no Entra ID (§4.3) | Sistemas | ☐ |
| 6 | Conditional Access Policy com MFA (§4.3 item 5) | Sistemas | ☐ |
| 7 | Adicionar Redirect URI no App Registration | Sistemas | ☐ |
| 8 | Preencher `.env` com segredos (§9) | Sistemas + DevOps | ☐ |
| 9 | Configurar mensageria — Graph API (§8) | Sistemas | ☐ |
| 10 | Deploy via Docker Compose (§10.2) | DevOps | ☐ |
| 11 | Validar fluxo: Login → Solicitante → Chefia → Coordenação | CGAU + Negócio | ☐ |
| 12 | Configurar rotina de backup do PostgreSQL | DBA | ☐ |
| 13 | Plano de monitoramento (uptime, logs, alertas) | NOC | ☐ |
| 14 | Capacitação de coordenadores/chefias | CGAU | ☐ |

---

## 14. Suporte e Contatos

| Papel | Nome | Responsabilidade |
|---|---|---|
| Gerente de Projetos / Especialista Técnico | **Hyago Keller** | Arquitetura, requisitos, condução do projeto |
| Analista de Automações | **Yan Basílio** | Implementação, integrações, suporte técnico |
| Coordenadoria de Sistemas | (a designar) | Provisionamento, infra, AD, Entra ID |
| CGAU | (a designar) | Validação funcional, governança do magistério |

---

## 15. Roadmap pós-implantação

| # | Item | Prioridade |
|---|---|---|
| 1 | SSO completo (logout federado, refresh silencioso via `offline_access`) | Alta |
| 2 | Mapeamento automático de grupos do Entra ID → perfis do portal | Alta |
| 3 | Painel de auditoria na UI (Admin → Auditoria) | Média |
| 4 | Reativação do login AD/LDAP como fallback | Média |
| 5 | Single Logout para Entra ID | Média |
| 6 | API pública para integração com Sapiens / sistema de RH | Baixa |
| 7 | Acessibilidade WCAG 2.1 AA (auditoria + correções) | Baixa |

---

## 16. Changelog

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | Mai/2026 | Documento inicial — arquitetura, requisitos, checklist |
| 2.0 | Mai/2026 | Implementação Entra ID OIDC, desabilitação LDAP, tabela audit_logs, endpoints documentados, docker-compose atualizado, feature-flags centralizadas |

---

*Documento mantido pela equipe técnica do projeto.
Revisões devem ser solicitadas a Hyago Keller.*
