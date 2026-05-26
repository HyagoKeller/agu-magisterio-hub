# Portal Magistério AGU — Documentação Técnica de Implantação

**Destinatários:** Coordenadoria de Sistemas / CGAU — Advocacia-Geral da União
**Versão:** 1.0
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
| **Superadministrador** | Configura AD, gov.br, Microsoft 365, mensageria, usuários. |

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
| Server functions | `createServerFn` (RPC tipado) |
| Persistência (atual / demo) | `localStorage` (a ser migrada para PostgreSQL na produção) |
| Persistência (produção) | PostgreSQL 15+ |
| Containerização | Docker (Dockerfile incluso) |
| Edge runtime alvo | Node.js 20+ ou Cloudflare Workers (nodejs_compat) |

### 2.2 Repositório — estrutura relevante

```
src/
├── routes/              # Páginas (file-based routing)
│   ├── index.tsx        # Tela de login
│   ├── admin.*.tsx      # Painel administrativo
│   ├── solicitante.*    # Área do membro
│   ├── chefia.*         # Aprovação
│   ├── coordenador.*    # CGAU
│   └── api/             # Endpoints HTTP (callbacks OIDC)
├── lib/
│   ├── auth.tsx              # Contexto de sessão
│   ├── feature-flags.ts      # Flags VITE_*_ENABLED
│   ├── govbr.functions.ts    # Server fn — OIDC gov.br
│   └── entra.functions.ts    # Server fn — OIDC Entra ID
└── components/
```

---

## 3. Autenticação e Identidade

O portal suporta **três caminhos de autenticação**, ativáveis individualmente por feature-flag:

### 3.1 Login local (AD/LDAP da AGU) — padrão

- Usuário informa CPF/usuário e senha → validados contra o **Active Directory da AGU**.
- Grupos do AD definem o perfil:
  - `AGU-MAGISTERIO-SOLICITANTES`
  - `AGU-MAGISTERIO-CHEFIA`
  - `AGU-MAGISTERIO-COORDENACAO`
  - `AGU-MAGISTERIO-ADMIN`
- Configurável em **Admin → Integração AD** (host, porta, baseDN, bindDN, SSL, intervalo de sincronização).

### 3.2 Microsoft 365 / Entra ID (OIDC) — **MFA oficial do portal**

- Botão "Entrar com Microsoft 365" exibido quando `VITE_ENTRA_ENABLED=true`.
- Fluxo OIDC Authorization Code:
  1. Redireciona para `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`.
  2. Usuário autentica no tenant da AGU (senha + **MFA via Conditional Access Policy**).
  3. Entra ID chama `ENTRA_REDIRECT_URI?code=...`.
  4. Backend troca `code` por tokens em `/oauth2/v2.0/token`.
  5. `id_token` é validado contra JWKS (`iss`, `aud`, `exp`, `nonce`).
  6. Mapeamento do claim `oid` (ou `preferred_username`) → usuário local; emite JWT de sessão.
- **O MFA é responsabilidade exclusiva do tenant** — não há TOTP local no portal.

### 3.3 Login Único gov.br (OIDC) — opcional

- Botão "Entrar com gov.br" exibido quando `VITE_GOVBR_ENABLED=true`.
- Fluxo padrão OAuth2/OIDC do `acesso.gov.br` (homologação ou produção).
- MFA aplicado nativamente pelo gov.br conforme o nível de confiabilidade exigido.

---

## 4. MFA — Política Adotada

> **Decisão arquitetural:** o portal **não opera MFA próprio (TOTP)**.
> O 2º fator é delegado **exclusivamente ao Microsoft Entra ID** (Conditional Access).

### 4.1 Por quê

| Critério | TOTP local | Entra ID (escolhido) |
|---|---|---|
| Gestão centralizada | ❌ | ✅ (já existe no tenant AGU) |
| Conformidade institucional | parcial | ✅ |
| Recuperação de fator | manual | ✅ Self-service do tenant |
| Métodos suportados | só TOTP | Microsoft Authenticator, SMS, FIDO2, etc. |
| Auditoria | local | ✅ Logs do Entra ID |
| Custo operacional | alto | baixo |

### 4.2 Como configurar no tenant (a cargo da equipe de Sistemas)

1. **Entra ID → Identity → Applications → App registrations** → New registration.
   - Nome: `Portal Magistério AGU`
   - Supported account types: *Accounts in this organizational directory only*.
   - Redirect URI (Web): `https://portal.agu.gov.br/api/auth/entra/callback`.
2. Em **Authentication**: habilitar **ID tokens**.
3. Em **Certificates & secrets**: criar um *client secret* (validade ≤ 24 meses) e salvar o valor.
4. Em **API permissions**: `openid`, `profile`, `email`, `offline_access` (delegated). *Grant admin consent*.
5. **Protection → Conditional Access** → criar policy:
   - Users/groups: grupos do magistério.
   - Cloud apps: o app recém-registrado.
   - Grant: **Require multifactor authentication**.

### 4.3 Variáveis a entregar à infraestrutura

```
VITE_ENTRA_ENABLED=true
ENTRA_TENANT_ID=<Directory ID>
ENTRA_CLIENT_ID=<Application ID>
ENTRA_CLIENT_SECRET=<segredo>
ENTRA_REDIRECT_URI=https://portal.agu.gov.br/api/auth/entra/callback
ENTRA_SCOPES=openid profile email offline_access
```

---

## 5. Requisitos Técnicos

### 5.1 Servidor de aplicação

| Item | Mínimo | Recomendado |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 10 GB | 20 GB SSD |
| Sistema | Linux (Ubuntu 22.04 / RHEL 9) | — |
| Runtime | Node.js 20 LTS | Node.js 20 LTS |
| Container | Docker 24+ | Docker + Compose |
| TLS | obrigatório (Let's Encrypt / cert institucional) | — |

### 5.2 Banco de dados (produção)

| Item | Especificação |
|---|---|
| SGBD | PostgreSQL 15+ |
| Esquemas | `magisterio` (dados de negócio), `auth` (sessões/MFA logs) |
| Backup | Diário (full) + WAL contínuo |
| Charset | UTF-8 |

### 5.3 Rede / Firewall (egress)

| Origem | Destino | Porta | Uso |
|---|---|---|---|
| App | AD interno AGU | 389/636 (LDAPS) | autenticação local |
| App | `login.microsoftonline.com` | 443 | OIDC Entra ID |
| App | `sso.acesso.gov.br` | 443 | OIDC gov.br (se habilitado) |
| App | Servidor SMTP institucional | 587/465 | notificações |
| App | PostgreSQL | 5432 | dados |
| Internet | App (portal) | 443 | acesso usuário |

### 5.4 DNS / Domínio

- Domínio sugerido: `portal.agu.gov.br`
- Certificado TLS válido com cadeia ICP-Brasil ou autoridade pública aceita.
- Redirect URIs registrados nos provedores OIDC devem casar **exatamente** com o domínio publicado.

### 5.5 Active Directory

| Requisito | Valor |
|---|---|
| Versão | Windows Server AD 2016+ |
| Protocolo | LDAPS (porta 636) |
| Conta de serviço | `svc-portal-magisterio` (somente leitura) |
| Base DN | `OU=Usuarios,DC=agu,DC=gov,DC=br` |
| Atributos lidos | `sAMAccountName`, `mail`, `displayName`, `memberOf`, `cpf` (custom) |
| Grupos necessários | 4 (vide §3.1) |

---

## 6. Mensageria / Notificações

Configurável em **Admin → Mensageria**:

- **Provedor:** Microsoft Graph (recomendado, reaproveita o tenant) ou Google Workspace.
- **Eventos notificados:** nova solicitação, decisão (aprovada/recusada), recurso, mudança de status.
- **Destinatários:** solicitante, chefia, coordenação (configurável).

---

## 7. Endpoints e Rotas

### 7.1 Rotas públicas (UI)

| Rota | Função |
|---|---|
| `/` | Tela de login (3 abas: Entrar, Solicitar acesso, Recuperar senha) |
| `/faq` | FAQ pública |

### 7.2 Rotas protegidas (UI)

| Rota | Perfil |
|---|---|
| `/solicitante/*` | Solicitante |
| `/chefia/*` | Chefia |
| `/coordenador/*` | Coordenação CGAU |
| `/admin/*` | Superadmin |

### 7.3 Endpoints HTTP

| Endpoint | Método | Função |
|---|---|---|
| `/api/auth/govbr/callback` | GET | Callback OIDC gov.br |
| `/api/auth/entra/callback` | GET | Callback OIDC Entra ID *(a implementar no backend de produção)* |

---

## 8. Variáveis de Ambiente — `.env`

```env
# Feature flags (frontend, replicar no build)
VITE_GOVBR_ENABLED=false
VITE_ENTRA_ENABLED=true

# gov.br (opcional)
GOVBR_CLIENT_ID=
GOVBR_CLIENT_SECRET=
GOVBR_URI_PROVIDER=https://sso.acesso.gov.br
GOVBR_REDIRECT_URI=https://portal.agu.gov.br/api/auth/govbr/callback
GOVBR_SCOPES=openid+email+profile+govbr_confiabilidades

# Microsoft Entra ID (MFA oficial)
ENTRA_TENANT_ID=
ENTRA_CLIENT_ID=
ENTRA_CLIENT_SECRET=
ENTRA_REDIRECT_URI=https://portal.agu.gov.br/api/auth/entra/callback
ENTRA_SCOPES=openid profile email offline_access

# Sessão
SESSION_JWT_SECRET=<gerar com openssl rand -base64 64>
```

> ⚠️ Segredos **nunca** devem entrar no repositório. Use vault institucional ou variáveis injetadas no orquestrador (Kubernetes Secret, Docker Swarm Secret, Cloudflare Worker Secret).

---

## 9. Deploy

### 9.1 Build

```bash
bun install         # ou npm ci
bun run build       # gera artefatos em .output/
```

### 9.2 Execução (Docker)

```bash
docker build -t portal-magisterio:1.0 .
docker run -d --name portal-magisterio \
  --env-file .env \
  -p 3000:3000 \
  portal-magisterio:1.0
```

### 9.3 Atrás de proxy reverso (Nginx exemplo)

```nginx
server {
  server_name portal.agu.gov.br;
  listen 443 ssl http2;
  ssl_certificate     /etc/ssl/agu/portal.crt;
  ssl_certificate_key /etc/ssl/agu/portal.key;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 10. Segurança

- **TLS 1.2+** obrigatório em toda comunicação externa.
- **JWT de sessão** assinado com `SESSION_JWT_SECRET` (HS256) — vida útil 8h, sliding refresh.
- **CSRF:** server functions usam `SameSite=Strict` em cookies + verificação de origem em callbacks OIDC.
- **State + Nonce** validados em todo fluxo OIDC.
- **Rate limiting** sugerido no proxy reverso (10 req/s por IP em `/api/auth/*`).
- **RLS / autorização** server-side por perfil em todas as server functions.
- **Logs de auditoria:** login, mudança de status de solicitação, decisões de chefia/coordenação.

---

## 11. Checklist de Entrega para a CGAU

| # | Item | Responsável | Status |
|---|---|---|---|
| 1 | Provisionar VM ou cluster (specs §5.1) | Infra CGAU | ☐ |
| 2 | Criar banco PostgreSQL + usuário aplicação | DBA CGAU | ☐ |
| 3 | Liberar regras de firewall (§5.3) | Rede CGAU | ☐ |
| 4 | DNS `portal.agu.gov.br` + certificado TLS | Rede CGAU | ☐ |
| 5 | Criar conta de serviço LDAP (read-only) | Infra AD | ☐ |
| 6 | Criar 4 grupos do magistério no AD (§3.1) | Infra AD | ☐ |
| 7 | App registration no Entra ID + Conditional Access MFA | Sistemas | ☐ |
| 8 | Preencher `.env` com segredos | Sistemas + DevOps | ☐ |
| 9 | Configurar mensageria (Graph API) | Sistemas | ☐ |
| 10 | Validar fluxo: Solicitante → Chefia → Coordenação | CGAU + Negócio | ☐ |
| 11 | Configurar rotina de backup do PostgreSQL | DBA | ☐ |
| 12 | Plano de monitoramento (uptime, logs, alertas) | NOC | ☐ |
| 13 | Capacitação de coordenadores/chefias | CGAU | ☐ |

---

## 12. Suporte e Contatos

| Papel | Nome | Responsabilidade |
|---|---|---|
| Gerente de Projetos / Especialista Técnico | **Hyago Keller** | Arquitetura, requisitos, condução do projeto |
| Analista de Automações | **Yan Basílio** | Implementação, integrações, suporte técnico |
| Coordenadoria de Sistemas | (a designar) | Provisionamento, infra, AD, Entra ID |
| CGAU | (a designar) | Validação funcional, governança do magistério |

---

## 13. Roadmap pós-implantação

1. **Migração** do storage demo (`localStorage`) para PostgreSQL com Prisma/Drizzle.
2. **SSO completo** (logout federado, refresh silencioso via `offline_access`).
3. **Single Logout** para Entra ID.
4. **Painel de auditoria** consolidado (acesso, decisões, recursos).
5. **API pública** para integração com Sapiens / sistema de RH.
6. **Acessibilidade WCAG 2.1 AA** (auditoria + correções).

---

*Documento mantido pela equipe técnica do projeto.
Revisões devem ser solicitadas a Hyago Keller.*
