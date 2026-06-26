# Portal Magistério AGU — Guia Completo do Usuário

**Destinatários:** Membros AGU (Solicitantes), Chefias Imediatas, Coordenação CGAU e Superadministradores
**Versão:** 2.0 — Junho/2026
**Base normativa:** Portaria AGU nº 1, de 02/01/2020 e atualizações
**Equipe responsável:** Hyago Keller (Gerente de Projetos / Especialista Técnico) · Yan Basílio (Analista de Automações)

---

## Sumário

1. [Visão geral do Portal](#1-visão-geral-do-portal)
2. [Acesso, login e MFA](#2-acesso-login-e-mfa)
3. [Perfis e matriz de permissões](#3-perfis-e-matriz-de-permissões)
4. [Módulo Solicitante (Membro AGU)](#4-módulo-solicitante-membro-agu)
   - 4.1 [Tela inicial e cards de acompanhamento](#41-tela-inicial-e-cards-de-acompanhamento)
   - 4.2 [Declaração (Solicitação nova)](#42-declaração-solicitação-nova) — passo a passo de **todos** os campos
   - 4.3 [Correção de declaração já aprovada](#43-correção-de-declaração-já-aprovada)
   - 4.4 [Grade de horários — vigência, frequência e cálculo de carga](#44-grade-de-horários)
   - 4.5 [Acompanhamento e notificações](#45-acompanhamento-e-notificações)
   - 4.6 [Recurso (em caso de recusa da Chefia)](#46-recurso-em-caso-de-recusa-da-chefia)
5. [Módulo Chefia Imediata](#5-módulo-chefia-imediata)
6. [Módulo Coordenação CGAU](#6-módulo-coordenação-cgau)
7. [Módulo Superadmin / TI](#7-módulo-superadmin--ti)
8. [Notificações por e-mail (SMTP institucional)](#8-notificações-por-e-mail-smtp-institucional)
9. [Glossário e siglas](#9-glossário-e-siglas)
10. [Perguntas frequentes (FAQ resumida)](#10-perguntas-frequentes)
11. [Resolução de problemas (troubleshooting)](#11-resolução-de-problemas)
12. [Suporte e canais oficiais](#12-suporte-e-canais-oficiais)

---

## 1. Visão geral do Portal

O **Portal Magistério AGU** automatiza o ciclo completo da autorização para exercício do magistério por membros da Advocacia-Geral da União, conforme a Portaria AGU nº 1/2020. Substitui o processo manual em planilhas e e-mails, oferecendo:

- Formulário eletrônico padronizado de **Declaração** (solicitação nova) e **Correção** (alteração de declaração já aprovada);
- Encaminhamento automático para a **Chefia Imediata** indicada pelo próprio membro;
- Fluxo de **Recurso** (5 dias úteis) em caso de recusa;
- Painel da **Coordenação CGAU** com métricas, filtros, exportações e auditoria;
- Autenticação via **Active Directory (LDAP)** institucional da Rede AGU, com **MFA local (TOTP)** gerido pelo próprio portal;
- Aderência total ao **Design System gov.br** (acessibilidade WCAG AA, contraste, semântica, navegação por teclado).

### Ambientes
| Ambiente | URL | Uso |
|---|---|---|
| Produção | `https://portal-magisterio.agu.gov.br` | Operação oficial |
| Homologação | `https://hml-portal-magisterio.agu.gov.br` | Testes da Coordenação |
| Desenvolvimento | acesso restrito à equipe técnica | Desenvolvimento contínuo |

---

## 2. Acesso, login e MFA

### 2.1 Formas de login

| Opção | Quando usar | Observações |
|---|---|---|
| **Microsoft 365 (recomendado)** | Padrão institucional para todos os membros | MFA aplicado pelo tenant AGU (Conditional Access) |
| **gov.br** | Apenas quando habilitado pela Coordenação | Login Único do governo federal — nível Prata ou Ouro |
| **Usuário AGU + Senha (LDAP/AD)** | Contas sem SSO habilitado | Senha gerida pelo AD institucional |

### 2.2 MFA (Multi-Factor Authentication)

O segundo fator é **delegado ao Microsoft Entra ID**. O portal não armazena segredos TOTP.

- Para registrar o Microsoft Authenticator: `https://aka.ms/mfasetup`
- Caso o dispositivo seja trocado, procure o Service Desk da AGU para resetar o método.
- Conditional Access pode exigir reautenticação periódica, dispositivo gerenciado (Intune) ou rede confiável.

### 2.3 Primeiro acesso

1. Acesse a URL do portal.
2. Clique em **"Entrar com Microsoft 365"**.
3. Informe o e-mail institucional `@agu.gov.br`.
4. Confirme o MFA no aplicativo Authenticator.
5. No primeiro login o portal cria seu perfil **automaticamente** (provisionamento JIT) com base nos *App Roles* e *Grupos* do Entra ID.

### 2.4 Encerramento de sessão

Menu superior direito → **Sair**. A sessão expira automaticamente após **30 minutos de inatividade** (configurável pela Coordenação).

---

## 3. Perfis e matriz de permissões

| Ação | Solicitante | Chefia | CGAU | Superadmin |
|---|:-:|:-:|:-:|:-:|
| Criar Declaração | ✅ | — | — | — |
| Editar Declaração pendente | ✅ (própria) | — | — | — |
| Criar Correção de declaração aprovada | ✅ (própria) | — | — | — |
| Aprovar / recusar em 1ª instância | — | ✅ | — | — |
| Interpor recurso | ✅ | — | — | — |
| Decidir recurso em 2ª instância | — | — | ✅ | — |
| Ver todas as solicitações | — | (da unidade) | ✅ | ✅ |
| Exportar relatórios e métricas | — | (da unidade) | ✅ | ✅ |
| Gerir FAQ | — | — | ✅ | ✅ |
| Gerir usuários e integrações | — | — | — | ✅ |
| Acessar logs de auditoria | — | — | ✅ (próprios) | ✅ (todos) |

> Chefias com grupos AD adicionais (`PORTAL-MAG-CGAU` ou `PORTAL-MAG-ADMIN`) podem trocar de perfil em tempo real pelo **Gestão Switcher** no canto superior direito. A troca é registrada em log.

---

## 4. Módulo Solicitante (Membro AGU)

Destinado a **Advogados da União, Procuradores da Fazenda Nacional, Procuradores Federais, Procuradores do BACEN e Quadro Suplementar**.

### 4.1 Tela inicial e cards de acompanhamento

Ao entrar em `/solicitante` você vê:

1. **Botão "Declaração"** (vermelho, no topo) — com balão amarelo explicativo:
   > *"Use este botão para registrar uma nova atividade de magistério no semestre OU corrigir os dados de uma declaração já aprovada."*
2. **Solicitações passíveis de recurso** — solicitações recusadas dentro do prazo de 5 dias úteis aparecem aqui em destaque.
3. **Recursos em andamento** — recursos protocolados aguardando decisão.
4. **Minhas Solicitações** — tabela completa com filtros e *StatusTag* colorido.
5. **FAQ** — atalho para perguntas frequentes.

### 4.2 Declaração (Solicitação nova)

Caminho: **Início → botão "Declaração" → escolher "Solicitação"**.

#### 4.2.1 Identificação do servidor (preenchido automaticamente quando vier do AD)

| Campo | Regra | Exemplo |
|---|---|---|
| **CPF** | 11 dígitos, validado (módulo 11) | `123.456.789-09` |
| **SIAPE** | Numérico, 7 dígitos | `1234567` |
| **Cargo** | AU, PFN, PF, PBCB ou QS | `Advogado da União` |
| **UF de lotação** | 27 UFs + DF | `DF` |
| **Unidade / Equipe** | Texto livre (mín. 3 caracteres) | `PRU1 — Brasília` |

#### 4.2.2 Inscrição na OAB

| Campo | Regra |
|---|---|
| **Número OAB** | Numérico, sem pontuação |
| **UF da OAB** | Sigla de 2 letras |

#### 4.2.3 Chefia Imediata (CRÍTICO)

| Campo | Regra | Observação |
|---|---|---|
| **Nome da Chefia** | Texto livre | Conferir grafia oficial |
| **E-mail da Chefia** | Deve terminar em `@agu.gov.br` | **Este e-mail recebe a notificação e dispara o fluxo de análise. Erro aqui = solicitação parada.** |

> ⚠️ **Atenção:** confira **letra por letra** o e-mail da Chefia. E-mails pessoais (`@gmail.com`, `@hotmail.com`) são bloqueados pelo sistema. Se enviar para a chefia errada, abra um chamado no Service Desk para reencaminhamento.

#### 4.2.4 Formação acadêmica mais elevada

Seleção entre: Graduação · Especialização · Mestrado · Doutorado · Pós-Doutorado.

#### 4.2.5 Atividades de ensino (grade horária)

Ver detalhamento completo em [4.4 Grade de horários](#44-grade-de-horários).

#### 4.2.6 Disciplinas, projetos e avaliações

- **Disciplinas ministradas:** nome, instituição, curso, carga horária total no semestre.
- **Projetos de pesquisa/extensão:** título, papel (coordenador/colaborador), carga horária semanal.
- **Avaliações e bancas:** TCC, mestrado, doutorado, concursos — quantidade prevista no semestre.

#### 4.2.7 Declarações obrigatórias (checkboxes)

1. Declaro que a atividade **não conflita** com o horário de expediente na AGU.
2. Declaro que a atividade **respeita o limite de 20h semanais** previsto na Portaria AGU nº 1/2020.
3. Declaro que **não há impedimento ético ou disciplinar** para o exercício do magistério.
4. **Declaração de Boa-Fé** — declaro que todas as informações prestadas são verdadeiras, sob as penas da lei.

> Todos os itens são **obrigatórios**. O botão "Enviar" só habilita quando os quatro estão marcados.

#### 4.2.8 Revisão e envio

O sistema mostra um **resumo final** com toda a declaração. Confira e clique em **Enviar**.
Após o envio:
- A solicitação recebe um **protocolo** (ex.: `MAG-2026-000123`);
- A Chefia Imediata recebe e-mail automático via Microsoft Graph;
- O status inicial é **PENDENTE**.

### 4.3 Correção de declaração já aprovada

Caminho: **Início → botão "Declaração" → escolher "Correção"**.

Use quando, **após a aprovação**, for necessário ajustar dados — por exemplo: troca de horário, mudança de disciplina, adição/remoção de turma, correção de carga horária.

Diferenças em relação à Solicitação nova:

| Campo extra | Regra |
|---|---|
| **Protocolo a corrigir** | Selecione na lista das suas solicitações **APROVADAS** |
| **Descrição da correção** | Texto explicando o que mudou e por quê (mín. 30 caracteres) |

Todos os demais campos vêm **pré-preenchidos** com os dados da declaração original e podem ser editados livremente. O sistema gera um **novo protocolo** vinculado ao original e exibe na Chefia uma comparação **Antes vs Depois** dos campos alterados.

> A Correção também passa por análise da Chefia (e eventual recurso), seguindo o mesmo rito da Solicitação nova.

### 4.4 Grade de horários

A grade ocupa uma matriz **Dias × Turnos** (Seg–Sáb × Manhã/Tarde/Noite). Para cada célula você pode registrar uma ou mais atividades com:

| Campo | Regra |
|---|---|
| **Início** | HH:MM (passo de 30 min) |
| **Término** | HH:MM (passo de 30 min) — deve ser maior que o início |
| **Horas** | Calculado automaticamente (Término − Início) |
| **Frequência** | Semanal · Quinzenal · Mensal · Variável |
| **Semestre de referência** | 1º (Jan–Jun) ou 2º (Jul–Dez) |
| **Ano de referência** | Ano atual ou os dois próximos (não permite anos passados) |
| **Data de início da vigência** | Dentro dos limites do semestre selecionado |
| **Data de fim da vigência** | Dentro dos limites do semestre selecionado |

> **Regra de vigência:** as datas de início e fim **não podem ultrapassar o semestre** declarado (1º = 01/01 a 30/06; 2º = 01/07 a 31/12). O editor bloqueia o salvamento se a regra for violada e mostra a mensagem em vermelho.

O resumo abaixo da grade mostra a **carga horária semanal equivalente**, ponderada pela frequência (Semanal=1; Quinzenal=0,5; Mensal=0,25; Variável=estimativa do solicitante).

### 4.5 Acompanhamento e notificações

Em **Minhas Solicitações** cada item exibe um *StatusTag*:

| Status | Significado | Ações possíveis |
|---|---|---|
| **PENDENTE** | Aguardando análise da Chefia | Editar / Cancelar |
| **APROVADA** | Deferida pela Chefia (ou recurso provido) | Criar Correção |
| **RECUSADA** | Indeferida — motivo no detalhe | Interpor Recurso (5 dias úteis) |
| **EM RECURSO** | Recurso protocolado | Acompanhar |
| **CANCELADA** | Cancelada pelo solicitante | — |

E-mails são enviados (via Microsoft Graph) em todo evento: envio, decisão, recurso, alteração de status.

### 4.6 Recurso (em caso de recusa da Chefia)

1. Na lista de **Solicitações passíveis de recurso**, clique em **Interpor recurso**.
2. Escreva a fundamentação (mín. 30 caracteres) — recomenda-se mencionar a **Portaria AGU nº 1/2020** e o ponto específico do indeferimento que se contesta.
3. Anexe documentos novos, se houver (PDF, máx. 10 MB).
4. Envie. Prazo: **5 dias úteis** contados da decisão. Após o prazo, a opção é desabilitada.

Fluxo:
- O recurso volta **primeiro à mesma Chefia** que recusou (reconsideração).
- Se a Chefia **mantiver a recusa**, o recurso sobe automaticamente à **Coordenação CGAU** (decisão final, irrecorrível administrativamente).

---

## 5. Módulo Chefia Imediata

Caminho: `/chefia`.

### 5.1 Tela inicial

Cards com contadores:
- **Aprovações Pendentes** — fila prioritária.
- **Recursos** — pedidos de reconsideração.
- **Histórico** — tudo já analisado pela Chefia.

### 5.2 Analisar uma solicitação

Em **Aprovações Pendentes**, clique em **Detalhes**. Abre o componente `SolicitacaoDetalhe` exibindo:

- Identificação do servidor, OAB, formação;
- Chefia indicada e e-mail;
- **Grade horária completa** com vigências e frequências;
- **Resumo de carga horária semanal equivalente**;
- Disciplinas, projetos, avaliações;
- Declarações obrigatórias marcadas;
- Anexos (download direto);
- Histórico de movimentações.

Ações disponíveis:

| Ação | Efeito |
|---|---|
| **Aprovar** | Status → APROVADA. Coordenação passa a ver. E-mail ao solicitante. |
| **Recusar** | Exige justificativa (mín. 30 caracteres). Solicitante notificado e pode recorrer em 5 dias úteis. |
| **Solicitar ajustes** | Devolve ao solicitante para complementar campos específicos. |

> **Boa prática:** registre no parecer a compatibilidade com a jornada (20h semanais, ausência de conflito com expediente, escalas e audiências). Use linguagem objetiva e cite o artigo da Portaria 1/2020 quando recusar.

### 5.3 Recursos

Em **Recursos**, o drawer mostra o painel **"Dados da solicitação"** completo + a fundamentação do recurso. A Chefia pode:
- **Reformar a decisão** → status volta para APROVADA (encerra o ciclo);
- **Manter a recusa** → recurso sobe para a CGAU automaticamente.

### 5.4 Histórico

Lista de tudo já analisado pela Chefia. Filtros: período, status, solicitante. Exporta CSV.

### 5.5 Delegação / Gestão Switcher

Chefias com grupos AD `PORTAL-MAG-CGAU` ou `PORTAL-MAG-ADMIN` veem o **Gestão Switcher** no header e podem atuar temporariamente como Coordenação ou Superadmin. Toda troca é auditada.

---

## 6. Módulo Coordenação CGAU

Caminho: `/coordenador`.

### 6.1 Painel de Controle Geral

- **Filtro de período "de até"** (sem presets) — abrange por padrão da solicitação mais antiga até hoje.
- **KPIs clicáveis** — clicar no card expande uma tabela com as solicitações filtradas correspondentes.
- **Métricas de Magistério** — seção dedicada com:
  - Gráfico de carga horária por turno/dia;
  - Distribuição por frequência (Semanal/Quinzenal/Mensal/Variável);
  - Ranking de docentes por carga semanal;
  - Mapa de calor de ocupação Dias × Turnos.

### 6.2 Todas as Solicitações

Filtros: período, status, carreira, unidade, instituição de ensino, modalidade, frequência.
Busca: nome / matrícula / CPF / protocolo.
Detalhe: somente leitura, exceto quando se trata de recurso em 2ª instância.
Exportação: CSV, XLSX e PDF.

### 6.3 Decisão de recurso (2ª instância)

Quando a Chefia mantém a recusa, o recurso aparece na fila da CGAU. A decisão é **final** e fecha o ciclo. O parecer da Coordenação fica visível para Chefia e Solicitante.

### 6.4 Solicitações de Acesso

Aprovar/recusar cadastros pendentes que não vieram automaticamente do AD (ex.: terceirizados, estagiários autorizados).

### 6.5 Relatórios

- Por período (mês, trimestre, ano)
- Por carreira (AU, PFN, PF, PBCB, QS)
- Por instituição de ensino
- Recursos providos × improvidos
- SLA médio de análise (Chefia e CGAU)

### 6.6 Gestão da FAQ

Criar, editar, reordenar e despublicar perguntas. Alterações refletem imediatamente em `/faq`.

### 6.7 Auditoria

Toda decisão gera log com: usuário autor, data/hora, IP, estado anterior x novo. Consultável e exportável para Compliance.

---

## 7. Módulo Superadmin / TI

Caminho: `/admin`.

- **Admin → Microsoft 365** — configura Tenant ID, Client ID, política de Conditional Access e **mapeamento de App Roles / Grupos do Entra ID** para os perfis do portal (Solicitante, Chefia, CGAU, Superadmin), com provisionamento JIT.
- **Admin → gov.br** — habilita login via gov.br quando aplicável (feature flag `VITE_GOVBR_ENABLED`).
- **Admin → Usuários** — visualiza usuários provisionados, força resync com o AD.
- **Admin → Logs** — auditoria global.

---

## 8. Notificações por e-mail (Microsoft Graph)

O portal usa **Microsoft Graph API** (`/users/{remetente}/sendMail`) com o app registrado no tenant AGU. Todos os e-mails partem da caixa institucional configurada em **Admin → Microsoft 365 → Remetente**.

Eventos que disparam e-mail:

| Evento | Destinatário(s) |
|---|---|
| Solicitação criada | Chefia indicada |
| Decisão da Chefia (aprovar/recusar/ajustar) | Solicitante |
| Recurso interposto | Chefia + CGAU (cópia) |
| Reconsideração da Chefia | Solicitante |
| Decisão da CGAU | Solicitante + Chefia |
| Correção criada | Chefia |

Em caso de **erro 403 ErrorAccessDenied**, a Coordenação de Sistemas deve verificar:
- *Application Access Policy* limitando o app à caixa remetente;
- Licença Exchange Online ativa para o remetente;
- Permissão `Mail.Send` consentida em nível de aplicação.

---

## 9. Glossário e siglas

| Sigla | Significado |
|---|---|
| **AGU** | Advocacia-Geral da União |
| **CGAU** | Coordenação-Geral de Assuntos Universitários |
| **AU / PFN / PF / PBCB / QS** | Carreiras: Advogado da União, Procurador da Fazenda Nacional, Procurador Federal, Procurador do BACEN, Quadro Suplementar |
| **SIAPE** | Sistema Integrado de Administração de Recursos Humanos |
| **OAB** | Ordem dos Advogados do Brasil |
| **MFA** | Multi-Factor Authentication |
| **JIT** | Just-In-Time provisioning |
| **Entra ID** | Microsoft Entra ID (antigo Azure AD) |
| **AD** | Active Directory institucional |
| **SSO** | Single Sign-On |
| **SLA** | Service Level Agreement (tempo médio de análise) |

---

## 10. Perguntas frequentes

Acesse `/faq` no portal para a base completa e atualizada pela CGAU. Temas mais consultados:

- Como preencher a Declaração passo a passo;
- Como fazer uma Correção em declaração já aprovada;
- Por que o e-mail da Chefia é tão crítico;
- Como interpor recurso;
- Como acompanhar minhas solicitações.

---

## 11. Resolução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Não consigo entrar com M365 | Conta sem licença / MFA não configurado | Service Desk → `https://aka.ms/mfasetup` |
| Botão "Enviar" desabilitado | Declarações obrigatórias não marcadas ou campo inválido | Reveja os 4 checkboxes e os campos em vermelho |
| Editor da grade não salva | Vigência fora do semestre | Ajuste datas dentro de 01/01–30/06 ou 01/07–31/12 |
| Chefia não recebeu e-mail | E-mail digitado errado ou erro 403 no Graph | Abrir chamado; CGAU pode reencaminhar |
| Recurso desabilitado | Prazo de 5 dias úteis expirado | Não há nova instância administrativa |
| "Acesso negado" ao perfil de Coordenação | Grupo AD ausente | Solicitar inclusão em `PORTAL-MAG-CGAU` |
| Sessão expira muito rápido | Política de inatividade (30 min) | Comportamento esperado — refaça login |

---

## 12. Suporte e canais oficiais

- **FAQ pública:** `/faq` (não requer login adicional).
- **Suporte funcional (uso do portal, processo de magistério):** Coordenação CGAU.
- **Suporte técnico (login, MFA, AD, indisponibilidade, e-mails):** Coordenadoria de Sistemas / Service Desk AGU.
- **Equipe do projeto:**
  - **Hyago Keller** — Gerente de Projetos / Especialista Técnico
  - **Yan Basílio** — Analista de Automações

---

*Documento mantido pela equipe técnica do Portal Magistério AGU.
Sugestões de melhoria devem ser encaminhadas a Hyago Keller.
Próxima revisão prevista: Dezembro/2026.*
