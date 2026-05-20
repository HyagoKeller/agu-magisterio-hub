import { useSyncExternalStore } from "react";
import type { AtividadesEnsino, HorarioCelula, Solicitacao, SolicitacaoStatus, RecursoStatus } from "./types";

const KEY = "agu_magisterio_solicitacoes_v4";

function load(): Solicitacao[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return seed();
  }
}

function persist(data: Solicitacao[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  data_ = data;
  listeners.forEach((l) => l());
}

let data_: Solicitacao[] | null = null;
const listeners = new Set<() => void>();

function getAll(): Solicitacao[] {
  if (data_ === null) data_ = load();
  return data_;
}

export const store = {
  getAll,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(s: Solicitacao) {
    persist([s, ...getAll()]);
  },
  update(id: string, patch: Partial<Solicitacao>) {
    persist(getAll().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  },
  decide(id: string, status: SolicitacaoStatus, autor: string, comentario?: string, justificativa?: string) {
    const now = new Date().toISOString();
    persist(
      getAll().map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              dataDecisao: now,
              decisaoComentario: comentario,
              justificativaRecusa: justificativa,
              historico: [
                ...s.historico,
                {
                  data: now,
                  evento:
                    status === "APROVADA"
                      ? "Solicitação aprovada pela chefia"
                      : "Solicitação recusada pela chefia",
                  autor,
                },
              ],
            }
          : s
      )
    );
  },
  solicitarRecurso(id: string, texto: string, autor: string) {
    const now = new Date().toISOString();
    persist(
      getAll().map((s) =>
        s.id === id
          ? {
              ...s,
              recurso: { texto, dataSolicitacao: now, status: "PENDENTE" as RecursoStatus },
              historico: [
                ...s.historico,
                { data: now, evento: "Recurso protocolado pelo solicitante", autor },
              ],
            }
          : s
      )
    );
  },
  decidirRecurso(id: string, decisao: "ACEITO" | "REJEITADO", autor: string, comentario?: string) {
    const now = new Date().toISOString();
    persist(
      getAll().map((s) => {
        if (s.id !== id || !s.recurso) return s;
        const recursoAceito = decisao === "ACEITO";
        return {
          ...s,
          status: recursoAceito ? "APROVADA" : s.status,
          dataDecisao: recursoAceito ? now : s.dataDecisao,
          recurso: {
            ...s.recurso,
            status: decisao,
            decisaoData: now,
            decisaoComentario: comentario,
            decididoPor: autor,
          },
          historico: [
            ...s.historico,
            {
              data: now,
              evento: recursoAceito
                ? "Recurso aceito — solicitação reaprovada"
                : "Recurso rejeitado pela chefia",
              autor,
            },
          ],
        };
      })
    );
  },
};

export function useSolicitacoes(): Solicitacao[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getAll,
    store.getAll
  );
}

function semestreAtual() {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() < 6 ? 1 : 2}`;
}

function gerarProtocolo() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `AGU-${new Date().getFullYear()}-${n}`;
}

export { gerarProtocolo, semestreAtual };

function cell(
  horas: number,
  frequencia: HorarioCelula["frequencia"],
  inicio?: string,
  fim?: string,
  dataInicio?: string,
  dataFim?: string,
  observacao?: string
): HorarioCelula {
  return { horas, frequencia, inicio, fim, dataInicio, dataFim, observacao };
}

function atividades(opts: {
  grade: Record<string, HorarioCelula>;
  semestre: 1 | 2;
  ano: number;
  disciplinas: string;
  projetoPedagogico?: string;
  material?: string;
  avaliacoes?: string;
}): AtividadesEnsino {
  return {
    grade: opts.grade,
    semestreReferencia: opts.semestre,
    anoReferencia: opts.ano,
    disciplinas: opts.disciplinas,
    projetoPedagogico: opts.projetoPedagogico ?? "—",
    material: opts.material ?? "—",
    avaliacoes: opts.avaliacoes ?? "—",
    declaracaoLeu: true,
    declaracaoVerdade: true,
    declaracaoCiente: true,
  };
}

function seed(): Solicitacao[] {
  const ANO = new Date().getFullYear();
  const base: Omit<Solicitacao, "id" | "protocolo">[] = [
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-04-12T10:30:00Z",
      dataDecisao: "2025-04-15T14:20:00Z",
      solicitanteId: "u1",
      solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00", siape: "1234567",
      oabNumero: "12345", oabUf: "DF",
      cargo: "Advogado(a) da União", uf: "DF",
      unidade: "PGU/DF - Núcleo Tributário",
      chefiaId: "ch1", chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado", tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      decisaoComentario: "Servidor possui qualificação adequada.",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "NOITE-SEG": cell(3, "SEMANAL", "19:00", "22:00"),
          "NOITE-QUA": cell(3, "SEMANAL", "19:00", "22:00"),
          "TARDE-SAB": cell(4, "QUINZENAL", "14:00", "18:00", "Aulas práticas"),
        },
        disciplinas: "Direito Tributário I — IDP (Graduação); Tributação Internacional — IDP (Pós).",
        material: "Apostila de jurisprudência tributária 2026.",
        avaliacoes: "2 provas dissertativas + 1 simulado.",
      }),
      historico: [
        { data: "2025-04-12T10:30:00Z", evento: "Solicitação criada", autor: "João Pereira da Silva" },
        { data: "2025-04-15T14:20:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dra. Maria Helena Souza" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-02T09:15:00Z",
      solicitanteId: "u1", solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00", siape: "1234567",
      cargo: "Advogado(a) da União", uf: "DF",
      unidade: "PGU/DF - Núcleo Cível",
      chefiaId: "ch1", chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Especialização", tipoSolicitacao: "Solicitação",
      status: "PENDENTE",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "NOITE-TER": cell(2, "SEMANAL", "19:30", "21:30"),
          "NOITE-QUI": cell(2, "SEMANAL", "19:30", "21:30"),
        },
        disciplinas: "Processo Civil II — UDF.",
        projetoPedagogico: "Coordenação do módulo de prática processual.",
      }),
      historico: [
        { data: "2025-05-02T09:15:00Z", evento: "Solicitação criada", autor: "João Pereira da Silva" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-08T16:00:00Z",
      solicitanteId: "u2", solicitanteNome: "Ana Carolina Souza",
      cpf: "987.654.321-00", siape: "7654321",
      cargo: "Procurador(a) Federal", uf: "SP",
      unidade: "PF/SP - Coordenação",
      chefiaId: "ch1", chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado", tipoSolicitacao: "Solicitação",
      status: "PENDENTE",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "MANHA-SEG": cell(2, "SEMANAL", "08:00", "10:00"),
          "MANHA-QUA": cell(2, "SEMANAL", "08:00", "10:00"),
          "MANHA-SEX": cell(2, "SEMANAL", "08:00", "10:00"),
        },
        disciplinas: "Direito Administrativo I e II — PUC/SP.",
        avaliacoes: "Avaliações continuadas semanais.",
      }),
      historico: [
        { data: "2025-05-08T16:00:00Z", evento: "Solicitação criada", autor: "Ana Carolina Souza" },
      ],
    },
    {
      semestre: `${ANO}.1`,
      dataAbertura: "2025-02-20T11:00:00Z",
      dataDecisao: "2025-02-25T10:00:00Z",
      solicitanteId: "u3", solicitanteNome: "Marcos Vinícius Costa",
      cpf: "456.789.123-00", siape: "9988776",
      cargo: "Procurador(a) da Fazenda Nacional", uf: "RJ",
      unidade: "PFN/RJ",
      chefiaId: "ch2", chefiaNome: "Dr. Carlos Eduardo Lima",
      formacao: "Especialização", tipoSolicitacao: "Solicitação",
      status: "RECUSADA",
      justificativaRecusa: "Carga horária declarada excede o limite previsto na portaria para o turno noturno.",
      atividades: atividades({
        semestre: 1, ano: ANO,
        grade: {
          "NOITE-SEG": cell(4, "SEMANAL", "18:30", "22:30"),
          "NOITE-TER": cell(4, "SEMANAL", "18:30", "22:30"),
          "NOITE-QUA": cell(4, "SEMANAL", "18:30", "22:30"),
          "NOITE-QUI": cell(4, "SEMANAL", "18:30", "22:30"),
        },
        disciplinas: "Direito Financeiro — UERJ.",
      }),
      historico: [
        { data: "2025-02-20T11:00:00Z", evento: "Solicitação criada", autor: "Marcos Vinícius Costa" },
        { data: "2025-02-25T10:00:00Z", evento: "Solicitação recusada pela chefia", autor: "Dr. Carlos Eduardo Lima" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-04-28T08:45:00Z",
      dataDecisao: "2025-05-03T17:30:00Z",
      solicitanteId: "u4", solicitanteNome: "Beatriz Lima Rocha",
      cpf: "321.654.987-00", siape: "5544332",
      cargo: "Procurador(a) Federal", uf: "MG",
      unidade: "PF/MG",
      chefiaId: "ch3", chefiaNome: "Dra. Patrícia Mendes",
      formacao: "Mestrado", tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "TARDE-TER": cell(3, "SEMANAL", "14:00", "17:00"),
          "TARDE-QUI": cell(3, "SEMANAL", "14:00", "17:00"),
          "MANHA-SAB": cell(4, "MENSAL", "08:00", "12:00", "Aula magna mensal"),
        },
        disciplinas: "Direito Previdenciário — UFMG.",
        projetoPedagogico: "Participação no NDE do curso.",
      }),
      historico: [
        { data: "2025-04-28T08:45:00Z", evento: "Solicitação criada", autor: "Beatriz Lima Rocha" },
        { data: "2025-05-03T17:30:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dra. Patrícia Mendes" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-10T13:20:00Z",
      solicitanteId: "u1", solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00", siape: "1234567",
      cargo: "Advogado(a) da União", uf: "DF",
      unidade: "PGU/DF - Núcleo Tributário",
      chefiaId: "ch1", chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado", tipoSolicitacao: "Correção",
      protocoloOriginal: "AGU-2025-100000",
      descricaoCorrecao: "Corrigir Unidade/Equipe para PGU/DF — Núcleo Cível, conforme nova lotação a partir de maio/2025.",
      status: "PENDENTE",
      historico: [
        { data: "2025-05-10T13:20:00Z", evento: "Correção solicitada (referência: AGU-2025-100000)", autor: "João Pereira da Silva" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-14T09:00:00Z",
      dataDecisao: "2025-05-16T11:00:00Z",
      solicitanteId: "u5", solicitanteNome: "Renato Aguiar Nogueira",
      cpf: "741.852.963-00", siape: "3344556",
      cargo: "Procurador(a) do Banco Central do Brasil", uf: "DF",
      unidade: "PGBC/DF",
      chefiaId: "ch4", chefiaNome: "Dr. Roberto Almeida",
      formacao: "Doutorado", tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "NOITE-SEG": cell(2, "SEMANAL", "20:00", "22:00"),
          "NOITE-QUA": cell(2, "SEMANAL", "20:00", "22:00"),
          "NOITE-SEX": cell(2, "QUINZENAL", "20:00", "22:00"),
          "MANHA-SAB": cell(3, "VARIAVEL", "09:00", "12:00", "Bancas e orientações"),
        },
        disciplinas: "Regulação do Sistema Financeiro — FGV/Brasília.",
        material: "Materiais autorais sobre regulação prudencial.",
      }),
      historico: [
        { data: "2025-05-14T09:00:00Z", evento: "Solicitação criada", autor: "Renato Aguiar Nogueira" },
        { data: "2025-05-16T11:00:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dr. Roberto Almeida" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-18T15:40:00Z",
      solicitanteId: "u6", solicitanteNome: "Larissa Toledo Bittencourt",
      cpf: "159.357.486-00", siape: "8877665",
      cargo: "Advogado(a) da União", uf: "RS",
      unidade: "PU/RS - Equipe Trabalhista",
      chefiaId: "ch5", chefiaNome: "Dra. Juliana Ferreira",
      formacao: "Mestrado", tipoSolicitacao: "Solicitação",
      status: "PENDENTE",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "TARDE-SEG": cell(2, "SEMANAL", "16:00", "18:00"),
          "TARDE-QUA": cell(2, "SEMANAL", "16:00", "18:00"),
          "TARDE-SEX": cell(2, "QUINZENAL", "16:00", "18:00"),
        },
        disciplinas: "Direito do Trabalho Aplicado — PUCRS.",
      }),
      historico: [
        { data: "2025-05-18T15:40:00Z", evento: "Solicitação criada", autor: "Larissa Toledo Bittencourt" },
      ],
    },
    {
      semestre: `${ANO}.2`,
      dataAbertura: "2025-05-19T10:10:00Z",
      dataDecisao: "2025-05-20T16:50:00Z",
      solicitanteId: "u7", solicitanteNome: "Felipe Andrade Marinho",
      cpf: "852.963.741-00", siape: "1122334",
      cargo: "Procurador(a) Federal", uf: "PE",
      unidade: "PF/PE",
      chefiaId: "ch3", chefiaNome: "Dra. Patrícia Mendes",
      formacao: "Especialização", tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      atividades: atividades({
        semestre: 2, ano: ANO,
        grade: {
          "NOITE-TER": cell(2.5, "SEMANAL", "19:00", "21:30"),
          "NOITE-QUI": cell(2.5, "SEMANAL", "19:00", "21:30"),
        },
        disciplinas: "Improbidade Administrativa — UNICAP.",
      }),
      historico: [
        { data: "2025-05-19T10:10:00Z", evento: "Solicitação criada", autor: "Felipe Andrade Marinho" },
        { data: "2025-05-20T16:50:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dra. Patrícia Mendes" },
      ],
    },
  ];
  return base.map((s, i) => ({
    ...s,
    id: `seed-${i + 1}`,
    protocolo: `AGU-2025-${100000 + i * 137}`,
  }));
}
