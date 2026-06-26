import { useSyncExternalStore } from "react";

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  ordem: number;
  atualizadoEm: string;
}

const KEY = "agu_magisterio_faq_v2";

const SEED: FaqItem[] = [
  {
    id: "f1",
    categoria: "Acesso",
    pergunta: "Como acesso o Portal Magistério AGU?",
    resposta:
      "O acesso é feito com seu usuário institucional do Active Directory da AGU. Caso ainda não tenha cadastro, utilize a aba 'Solicitar acesso' na tela de login.",
    ordem: 1,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f-manual-declaracao",
    categoria: "Manual do Solicitante",
    pergunta: "Manual completo: como preencher a Declaração (Nova Solicitação)",
    resposta:
`Este manual orienta o servidor no preenchimento da Declaração de Atividade de Magistério a cada semestre letivo. Leia com atenção — a maioria das recusas decorre de campos preenchidos de forma incompleta ou de e-mail incorreto da chefia imediata.

PASSO 1 — Acessar o formulário
• Faça login no Portal Magistério AGU.
• Na tela inicial do Solicitante, clique no botão vermelho "Declaração" (destacado com seta amarela).
• O botão atende a DOIS usos:
   1) Registrar nova atividade de magistério no semestre vigente.
   2) Corrigir dados de uma solicitação já APROVADA (ver manual específico de Correção).

PASSO 2 — Tipo de Solicitação
• "Solicitação" — escolha esta opção para abrir um novo pedido de autorização de magistério no semestre.
• "Correção" — utilize apenas quando já existir solicitação APROVADA e for necessário ajustar algum dado.

PASSO 3 — Dados pessoais e funcionais (todos obrigatórios, exceto OAB)
• CPF: digite os 11 dígitos — o sistema aplica a máscara 000.000.000-00 e valida automaticamente.
• Matrícula SIAPE: apenas números, sem pontos ou traços.
• OAB Nº e OAB UF: opcionais — informe se for inscrito na Ordem dos Advogados do Brasil.
• Membro Titular de Cargo: selecione um dos cargos da carreira (Advogado(a) da União, Procurador(a) da Fazenda Nacional, Procurador(a) Federal, Procurador(a) do Banco Central, Quadro Suplementar).
• UF da Unidade/Equipe: estado em que está lotado.
• Unidade/Equipe em que atua: descreva com precisão, no formato "Órgão/UF - Núcleo" (ex.: "PGU/DF - Núcleo Cível"). Esse dado aparece no protocolo enviado à chefia.
• Formação acadêmica (Especialização, Mestrado ou Doutorado): opcional, mas recomendado.

PASSO 4 — Chefia Imediata (CAMPO CRÍTICO)
• Nome da Chefia atual: informe o NOME COMPLETO da sua chefia imediata atual — aquela que tem competência para autorizar o magistério no semestre.
• E-mail da Chefia atual: ATENÇÃO ESPECIAL. Este é o campo MAIS IMPORTANTE da declaração.
   – Use OBRIGATORIAMENTE o e-mail institucional (@agu.gov.br ou domínio equivalente).
   – Confira letra por letra: um único caractere errado faz a notificação não chegar e a solicitação fica parada.
   – Não utilize e-mails pessoais (gmail, hotmail, outlook etc.), apelidos ou listas de distribuição.
   – Se a chefia mudou recentemente, confirme com a secretaria da unidade antes de enviar.
   – O sistema envia automaticamente para este endereço o aviso de nova solicitação. Se o e-mail estiver incorreto, a chefia NÃO será notificada e o pedido não será analisado dentro do prazo.

PASSO 5 — Atividades de Ensino do Semestre
• Semestre e Ano de referência: confirme o período letivo correto.
• Grade de horários: marque os turnos (Manhã/Tarde/Noite) e dias da semana em que ocorrerão as aulas. Para cada célula, informe:
   – Horas semanais.
   – Frequência: SEMANAL, QUINZENAL, MENSAL ou VARIÁVEL.
   – Horário de início e fim (formato HH:MM).
   – Data de início e fim da vigência (dentro do semestre declarado).
   – Observação, se necessário.
• Disciplinas: liste TODAS as disciplinas que ministrará (nome, instituição e curso).
• Projeto Pedagógico: descreva o projeto, ementa ou objetivo geral das atividades.
• Material didático: informe materiais que produzirá ou utilizará (apostilas, slides, bibliografia).
• Avaliações: descreva instrumentos avaliativos previstos (provas, trabalhos, seminários) e o cronograma.

PASSO 6 — Declarações obrigatórias
Antes de enviar você deve marcar:
• Declaração de leitura — confirma que leu a Portaria Interministerial AGU/MF/BACEN nº 1/2020.
• Declaração de verdade — confirma, sob as penas da lei, que as informações são verdadeiras.
• Declaração de ciência — confirma que está ciente das regras de compatibilidade de horários com a jornada institucional.

PASSO 7 — Revisão e envio
• Confira todos os campos na tela de Revisão.
• Clique em "Enviar Solicitação". O sistema gera um número de protocolo (ex.: AGU-2026-000123) e envia notificação por e-mail à chefia imediata e ao próprio servidor.
• Acompanhe o andamento em "Minhas Solicitações".

PRAZOS E REGRAS GERAIS
• A autorização vale apenas para o semestre letivo declarado. É necessário NOVO requerimento a cada semestre.
• A chefia tem prazo regulamentar para decidir (aprovar ou recusar).
• Em caso de recusa, cabe recurso em até 5 dias úteis (ver manual de Recurso).

ERROS MAIS COMUNS QUE GERAM RECUSA
• E-mail da chefia digitado errado.
• Unidade/Equipe genérica ("PGU" sem núcleo, por exemplo).
• Horários incompatíveis com a jornada do cargo.
• Falta de descrição de disciplinas, materiais ou avaliações.
• Declarações obrigatórias não marcadas.`,
    ordem: 2,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f-manual-correcao",
    categoria: "Manual do Solicitante",
    pergunta: "Manual completo: como CORRIGIR uma solicitação já aprovada",
    resposta:
`A Correção é utilizada APENAS quando você já possui uma solicitação com status APROVADA e precisa ajustar algum dado (ex.: nome da disciplina, horário, unidade, chefia). Ela NÃO substitui uma nova solicitação semestral.

QUANDO USAR
• Aprovação já concedida no semestre vigente.
• Algum dado precisa ser ajustado por equívoco de preenchimento ou mudança formal (ex.: troca de chefia, alteração de horário pela instituição de ensino, correção de unidade/equipe).

QUANDO NÃO USAR
• Para registrar nova atividade em outro semestre → use "Solicitação".
• Para recorrer de uma recusa → use a função "Entrar com Recurso" em "Minhas Solicitações".
• Para solicitações ainda PENDENTES → aguarde a decisão; não há correção sobre pedido pendente.

PASSO A PASSO
1) Na tela inicial do Solicitante, clique no botão vermelho "Declaração".
2) Em "Tipo de Solicitação", marque "Correção".
3) Selecione no campo "Protocolo a corrigir" o número da solicitação aprovada que deseja ajustar. O sistema mostra apenas seus protocolos APROVADOS.
   – Se a lista estiver vazia, você ainda não possui solicitações aprovadas para corrigir.
4) Preencha "Descrição da correção" (mínimo 20 caracteres) indicando CLARAMENTE:
   – Qual campo deve ser corrigido.
   – Qual era o valor anterior.
   – Qual é o valor correto.
   Exemplo: "Corrigir Unidade/Equipe de 'PGU/DF' para 'PGU/DF - Núcleo Cível'. Demais dados permanecem inalterados."
5) O sistema preenche automaticamente os demais campos com os dados do protocolo original. Ajuste apenas o que for necessário.
6) Reforce a CONFIRMAÇÃO do e-mail da chefia imediata — a correção também passa por nova análise e notificação.
7) Marque novamente as declarações obrigatórias.
8) Envie. Será gerado NOVO protocolo, vinculado ao original, com tipo "Correção".

O QUE ACONTECE DEPOIS
• A chefia imediata recebe novo e-mail informando que se trata de Correção do protocolo X.
• A análise segue o mesmo fluxo de uma solicitação comum (aprovação ou recusa).
• Caso a Correção seja recusada, o protocolo APROVADO original permanece válido com os dados anteriores.
• Caso seja aprovada, os dados corrigidos passam a valer e ficam registrados no histórico.

DICAS
• Não use Correção para "trocar de semestre" — cada semestre exige nova solicitação.
• Seja objetivo na descrição: a chefia precisa entender de imediato o que mudou.
• Se a correção envolver a própria chefia (mudança de chefia imediata), confirme o novo nome e o novo e-mail institucional antes de enviar.`,
    ordem: 3,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f-chefia-email",
    categoria: "Manual do Solicitante",
    pergunta: "Por que o E-MAIL DA CHEFIA é tão importante? Como acertar?",
    resposta:
`O e-mail da chefia imediata é o campo mais crítico da Declaração. É por ele que o Portal envia o aviso oficial de nova solicitação. Se estiver errado:
• A chefia NÃO recebe a notificação.
• A solicitação fica PARADA no sistema.
• O prazo de análise corre sem que ninguém saiba.
• Você pode perder a janela do semestre.

COMO ACERTAR
• Use SEMPRE o e-mail institucional (@agu.gov.br ou o domínio oficial do seu órgão).
• Confirme o endereço na assinatura de um e-mail recente da chefia, no catálogo institucional ou com a secretaria da unidade.
• Não use e-mails pessoais (gmail, hotmail, yahoo, outlook.com etc.).
• Não use listas (gabinete@, secretaria@) — o destinatário deve ser a pessoa física que decidirá.
• Digite com calma e revise letra por letra antes de enviar.
• Se a chefia mudou recentemente, pergunte oficialmente quem assumiu a competência para autorizar magistério.

SE PERCEBER O ERRO DEPOIS DE ENVIAR
• Solicitação ainda PENDENTE: aguarde a chefia correta ser identificada — em geral é necessário aguardar a recusa ou o vencimento e abrir nova solicitação.
• Solicitação já APROVADA: utilize a função "Correção" para atualizar o e-mail/nome da chefia.
• Solicitação RECUSADA por destinatário equivocado: utilize "Entrar com Recurso" dentro de 5 dias úteis, explicando o ocorrido.`,
    ordem: 4,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f-recurso-detalhado",
    categoria: "Recurso",
    pergunta: "Manual completo: como entrar com RECURSO de uma recusa",
    resposta:
`O recurso permite que a chefia imediata reanalise sua solicitação após uma recusa. Ele é ÚNICO (só pode ser interposto uma vez por protocolo) e tem prazo curto.

QUANDO CABE RECURSO
• Apenas para solicitações com status RECUSADA.
• Dentro de 5 (cinco) DIAS ÚTEIS contados a partir da data da decisão de recusa.
• Apenas uma vez por protocolo — não há "recurso do recurso".

ONDE ENTRAR COM O RECURSO
1) Menu "Minhas Solicitações".
2) Localize o protocolo com status "Recusada".
3) Na coluna "Ações", clique em "Entrar com Recurso" (botão vermelho). O botão só aparece se o prazo ainda estiver aberto e se você ainda não recorreu.

COMO PREENCHER
• Leia atentamente a "Justificativa da recusa" exibida no modal — é o ponto que você precisa rebater.
• Escreva a "Fundamentação do recurso" com NO MÍNIMO 30 caracteres, mas o ideal é ser objetivo e técnico:
   – Explique por que a recusa não procede ou apresente os dados/correções que sanam o motivo apontado.
   – Anexe contexto: portaria aplicável, compatibilidade de horários, carga horária semanal equivalente, eventual erro material no preenchimento original.
   – Evite argumentos pessoais; foque em fatos e na Portaria Interministerial AGU/MF/BACEN nº 1/2020.
• Confirme e clique em "Protocolar Recurso".

O QUE ACONTECE DEPOIS
• O recurso é registrado com status "Recurso pendente" e enviado por e-mail à mesma chefia imediata.
• A chefia analisa e decide: ACEITO (a solicitação passa para APROVADA) ou REJEITADO (a recusa é mantida em definitivo).
• Você acompanha o resultado em "Minhas Solicitações" → coluna "Recurso".
• Após o resultado do recurso, não há novo recurso. Caso o pedido siga indeferido, a alternativa é abrir nova Solicitação (em outro semestre) ou tratar administrativamente fora do Portal.

PRAZO — COMO CONTAR
• Conta-se em dias úteis (segunda a sexta), excluindo feriados nacionais.
• O dia da decisão de recusa NÃO conta; começa no próximo dia útil.
• O sistema mostra a data-limite no próprio modal de recurso.

DICAS PARA AUMENTAR AS CHANCES
• Releia a justificativa de recusa antes de redigir.
• Corrija qualquer erro de preenchimento que motivou a recusa (horário, unidade, descrição de disciplinas).
• Se houve alegação de incompatibilidade de horário, demonstre, com a grade, que a carga é compatível com a jornada institucional.
• Seja claro, sucinto e impessoal.`,
    ordem: 5,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f-acompanhar",
    categoria: "Manual do Solicitante",
    pergunta: "Como acompanho o andamento da minha solicitação?",
    resposta:
`Acesse "Minhas Solicitações" no menu do Solicitante. Você verá uma tabela com:
• Protocolo, Semestre e Data de abertura.
• Chefia indicada.
• Status atual: PENDENTE (em análise pela chefia), APROVADA ou RECUSADA.
• Coluna "Recurso": indica se há recurso disponível, pendente, aceito ou rejeitado.
• Botão "Detalhes": abre o painel lateral com todos os dados preenchidos, histórico de eventos (criação, decisão, recurso) e justificativas.

Use o filtro por status no topo da tabela para localizar rapidamente solicitações em andamento, aprovadas ou recusadas.`,
    ordem: 6,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f4",
    categoria: "Prazos",
    pergunta: "A autorização vale por quanto tempo?",
    resposta:
      "A autorização é válida apenas para o semestre letivo vigente, sendo necessário novo requerimento para os semestres subsequentes.",
    ordem: 7,
    atualizadoEm: new Date().toISOString(),
  },
];

function load(): FaqItem[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw);
  } catch {
    return SEED;
  }
}

let data: FaqItem[] | null = null;
const listeners = new Set<() => void>();

function persist(next: FaqItem[]) {
  data = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function getAll() {
  if (data === null) data = load();
  return data;
}

export const faqStore = {
  getAll,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(item: Omit<FaqItem, "id" | "atualizadoEm">) {
    const novo: FaqItem = {
      ...item,
      id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      atualizadoEm: new Date().toISOString(),
    };
    persist([...getAll(), novo]);
  },
  update(id: string, patch: Partial<FaqItem>) {
    persist(getAll().map((i) => (i.id === id ? { ...i, ...patch, atualizadoEm: new Date().toISOString() } : i)));
  },
  remove(id: string) {
    persist(getAll().filter((i) => i.id !== id));
  },
};

export function useFaq() {
  return useSyncExternalStore(faqStore.subscribe, faqStore.getAll, faqStore.getAll);
}
