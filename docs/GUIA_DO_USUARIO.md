# Portal Magistério AGU — Guia do Usuário

**Destinatários:** Membros AGU (Solicitantes), Chefias Imediatas e Coordenação CGAU
**Versão:** 1.0 — Maio/2026
**Equipe responsável:** Hyago Keller (Gerente de Projetos) · Yan Basílio (Analista de Automações)

---

## Sumário

1. [Acesso ao Portal](#1-acesso-ao-portal)
2. [Módulo Solicitante (Membro AGU)](#2-módulo-solicitante-membro-agu)
3. [Módulo Chefia Imediata](#3-módulo-chefia-imediata)
4. [Módulo Coordenação CGAU](#4-módulo-coordenação-cgau)
5. [FAQ e Suporte](#5-faq-e-suporte)

---

## 1. Acesso ao Portal

### 1.1 Endereço

`https://portal.agu.gov.br`

### 1.2 Formas de login

| Opção | Quando usar |
|---|---|
| **Microsoft 365 (recomendado)** | Padrão institucional. Senha + MFA validados pelo tenant da AGU (Conditional Access). |
| **gov.br** | Quando habilitado pela Coordenação — usa Login Único do governo federal. |
| **Usuário AGU + Senha (LDAP)** | Acesso via Active Directory institucional para contas que não usam SSO. |

> **MFA:** O segundo fator é aplicado pelo Microsoft 365. Caso o seu dispositivo ainda não esteja registrado no Microsoft Authenticator, procure o suporte de TI antes do primeiro acesso.

### 1.3 Primeiro acesso / Recuperação

- Na tela inicial use **"Solicitar acesso"** se você ainda não foi cadastrado.
- Use **"Recuperar senha"** apenas para a senha do AD. Senhas do Microsoft 365 são recuperadas pelo portal oficial da Microsoft.
- Sair: menu superior direito → **Sair**.

---

## 2. Módulo Solicitante (Membro AGU)

Destinado a Advogados da União, Procuradores da Fazenda Nacional, Procuradores Federais, Procuradores do BACEN e Quadro Suplementar.

### 2.1 Tela inicial

Atalhos para:
- **Nova Solicitação** (botão vermelho no topo)
- **Minhas Solicitações** (acompanhar status)
- **FAQ**

### 2.2 Criar uma nova solicitação

Caminho: **Início → Nova Solicitação**.

Preencha em sequência:

1. **Dados da Atividade**
   - Instituição de ensino
   - Curso / disciplina
   - Modalidade (presencial / EAD / híbrida)
   - Natureza (graduação, pós-graduação, extensão, palestra etc.)
2. **Horários** — grade semanal de aulas (use o componente *HorariosGrid*).
3. **Período** — data de início e término.
4. **Justificativa / Compatibilidade com a jornada AGU**.
5. **Anexos** — contrato, convite, plano de ensino (PDF).
6. **Revisar e Enviar**.

Ao enviar, a solicitação vai automaticamente para a **Chefia Imediata** vinculada ao seu cadastro no AD.

### 2.3 Acompanhar status

Em **Minhas Solicitações** cada item exibe um *StatusTag*:

| Status | Significado |
|---|---|
| **PENDENTE** | Aguardando análise da Chefia. |
| **APROVADA** | Deferida pela Chefia / Coordenação. |
| **RECUSADA** | Indeferida — motivo disponível no detalhe. |
| **EM RECURSO** | Recurso protocolado e em análise. |

### 2.4 Interpor recurso

Em uma solicitação **RECUSADA**:

1. Abra o detalhe.
2. Clique em **Interpor recurso**.
3. Escreva a fundamentação (mín. 50 caracteres) e anexe documentos novos, se houver.
4. Envie — o recurso retorna à Chefia e, em segunda instância, à Coordenação CGAU.

### 2.5 Editar / Cancelar

- Solicitações **PENDENTES** podem ser editadas ou canceladas pelo próprio solicitante.
- Após decisão da Chefia, somente recurso é permitido.

### 2.6 Notificações

Você receberá e-mail (via Microsoft Graph) em todo evento relevante: envio, decisão, recurso, alteração de status.

---

## 3. Módulo Chefia Imediata

Destinado a chefes de unidade responsáveis pela primeira análise das solicitações.

### 3.1 Tela inicial

Cards com:
- **Aprovações Pendentes** (badge com contagem)
- **Recursos** (badge com contagem)
- **Histórico**

### 3.2 Analisar uma solicitação

Caminho: **Aprovações Pendentes → clicar na solicitação**.

A tela de análise mostra:
- Dados do solicitante e da atividade
- Grade de horários
- Anexos (download direto)
- Histórico de movimentações
- Caixa de **Parecer** (obrigatório em qualquer decisão)

Ações disponíveis:

| Ação | Efeito |
|---|---|
| **Aprovar** | Status passa a APROVADA e segue para visibilidade da Coordenação. |
| **Recusar** | Exige justificativa. Solicitante é notificado e pode interpor recurso. |
| **Solicitar ajustes** | Devolve ao solicitante para complementação. |

> **Boa prática:** registrar no parecer a compatibilidade com a jornada de trabalho e eventuais conflitos com escalas/audiências.

### 3.3 Recursos

Em **Recursos**, a Chefia revisa o pedido de reconsideração. Pode:
- **Reformar a decisão** (acatar o recurso → status volta para APROVADA), ou
- **Manter a recusa** — nesse caso o recurso sobe automaticamente para a Coordenação CGAU.

### 3.4 Histórico

Lista todas as solicitações já analisadas pela Chefia, com filtros por período, status e solicitante. Permite exportação CSV.

### 3.5 Delegação / Gestão

O componente **Gestão Switcher** (canto superior direito) permite à Chefia, quando autorizada, atuar temporariamente como Coordenadora ou Superadmin, para fins de cobertura. A delegação é registrada em log de auditoria.

---

## 4. Módulo Coordenação CGAU

Destinado à Coordenação-Geral de Assuntos Universitários da AGU.

### 4.1 Dashboard

Visão consolidada com:
- Total de solicitações por status
- Solicitações por unidade / carreira
- Recursos em aberto
- Gráfico de evolução mensal

### 4.2 Todas as Solicitações

Caminho: **Coordenação → Todas as Solicitações**.

Recursos:
- Filtros: período, status, carreira, unidade, instituição de ensino, modalidade
- Busca por nome / matrícula / CPF
- Abertura do detalhe completo (somente leitura, exceto em recurso de 2ª instância)
- Exportação CSV / XLSX

### 4.3 Decisão de recurso (2ª instância)

Quando a Chefia mantém a recusa, o recurso aparece na fila da Coordenação. A decisão da CGAU é **final** e fecha o ciclo.

### 4.4 Solicitações de Acesso

Caminho: **Coordenação → Solicitações de Acesso**.

Permite aprovar/recusar cadastros pendentes de novos solicitantes que não estão no AD (ex.: terceirizados, estagiários autorizados).

### 4.5 Relatórios

- **Por período** (mês, trimestre, ano)
- **Por carreira** (AU, PFN, PF, PBCB, QS)
- **Por instituição de ensino**
- **Recursos providos x improvidos**
- **Tempo médio de análise (SLA da Chefia e da CGAU)**

Exportação em CSV, XLSX e PDF.

### 4.6 Gestão da FAQ

Caminho: **Coordenação → Gestão da FAQ**.

Permite criar, editar, reordenar e despublicar perguntas. As alterações são refletidas imediatamente em `/faq` para todos os perfis.

### 4.7 Auditoria

Toda decisão (aprovar, recusar, reformar, alterar FAQ, conceder acesso) gera log com:
- usuário autor
- data/hora
- IP de origem
- estado anterior x estado novo

Logs são consultáveis pela Coordenação e exportáveis para a área de Compliance.

---

## 5. FAQ e Suporte

- **FAQ pública:** `/faq` — acessível a todos os perfis sem login adicional.
- **Suporte funcional (uso do portal, processo de magistério):** Coordenação CGAU.
- **Suporte técnico (login, MFA, AD, indisponibilidade):** Coordenadoria de Sistemas / Service Desk AGU.
- **Equipe do projeto:**
  - Hyago Keller — Gerente de Projetos / Especialista Técnico
  - Yan Basílio — Analista de Automações

---

### Anexo — Matriz de permissões

| Ação | Solicitante | Chefia | Coordenação | Superadmin |
|---|:-:|:-:|:-:|:-:|
| Criar solicitação | ✅ | — | — | — |
| Editar solicitação pendente | ✅ (própria) | — | — | — |
| Aprovar/recusar 1ª instância | — | ✅ | — | — |
| Decidir recurso 2ª instância | — | — | ✅ | — |
| Ver todas as solicitações | — | (da unidade) | ✅ | ✅ |
| Exportar relatórios | — | (da unidade) | ✅ | ✅ |
| Gerir FAQ | — | — | ✅ | ✅ |
| Gerir usuários / integrações | — | — | — | ✅ |

---

*Documento mantido pela equipe técnica do Portal Magistério AGU.
Sugestões de melhoria devem ser encaminhadas a Hyago Keller.*
