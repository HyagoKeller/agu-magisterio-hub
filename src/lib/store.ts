import { useSyncExternalStore } from "react";
import type { Solicitacao, SolicitacaoStatus } from "./types";

const KEY = "agu_magisterio_solicitacoes_v1";

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

function seed(): Solicitacao[] {
  const base: Omit<Solicitacao, "id" | "protocolo">[] = [
    {
      semestre: "2025.2",
      dataAbertura: "2025-04-12T10:30:00Z",
      dataDecisao: "2025-04-15T14:20:00Z",
      solicitanteId: "u1",
      solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00",
      siape: "1234567",
      oabNumero: "12345",
      oabUf: "DF",
      cargo: "Advogado(a) da União",
      uf: "DF",
      unidade: "PGU/DF - Núcleo Tributário",
      chefiaId: "ch1",
      chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado",
      tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      decisaoComentario: "Servidor possui qualificação adequada.",
      historico: [
        { data: "2025-04-12T10:30:00Z", evento: "Solicitação criada", autor: "João Pereira da Silva" },
        { data: "2025-04-15T14:20:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dra. Maria Helena Souza" },
      ],
    },
    {
      semestre: "2025.2",
      dataAbertura: "2025-05-02T09:15:00Z",
      solicitanteId: "u1",
      solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00",
      siape: "1234567",
      cargo: "Advogado(a) da União",
      uf: "DF",
      unidade: "PGU/DF - Núcleo Cível",
      chefiaId: "ch1",
      chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Especialização",
      tipoSolicitacao: "Solicitação",
      status: "PENDENTE",
      historico: [
        { data: "2025-05-02T09:15:00Z", evento: "Solicitação criada", autor: "João Pereira da Silva" },
      ],
    },
    {
      semestre: "2025.2",
      dataAbertura: "2025-05-08T16:00:00Z",
      solicitanteId: "u2",
      solicitanteNome: "Ana Carolina Souza",
      cpf: "987.654.321-00",
      siape: "7654321",
      cargo: "Procurador(a) Federal",
      uf: "SP",
      unidade: "PF/SP - Coordenação",
      chefiaId: "ch1",
      chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado",
      tipoSolicitacao: "Solicitação",
      status: "PENDENTE",
      historico: [
        { data: "2025-05-08T16:00:00Z", evento: "Solicitação criada", autor: "Ana Carolina Souza" },
      ],
    },
    {
      semestre: "2025.1",
      dataAbertura: "2025-02-20T11:00:00Z",
      dataDecisao: "2025-02-25T10:00:00Z",
      solicitanteId: "u3",
      solicitanteNome: "Marcos Vinícius Costa",
      cpf: "456.789.123-00",
      siape: "9988776",
      cargo: "Procurador(a) da Fazenda Nacional",
      uf: "RJ",
      unidade: "PFN/RJ",
      chefiaId: "ch2",
      chefiaNome: "Dr. Carlos Eduardo Lima",
      formacao: "Especialização",
      tipoSolicitacao: "Solicitação",
      status: "RECUSADA",
      justificativaRecusa: "Servidor não atende aos requisitos mínimos de tempo de cargo neste semestre.",
      historico: [
        { data: "2025-02-20T11:00:00Z", evento: "Solicitação criada", autor: "Marcos Vinícius Costa" },
        { data: "2025-02-25T10:00:00Z", evento: "Solicitação recusada pela chefia", autor: "Dr. Carlos Eduardo Lima" },
      ],
    },
    {
      semestre: "2025.2",
      dataAbertura: "2025-04-28T08:45:00Z",
      dataDecisao: "2025-05-03T17:30:00Z",
      solicitanteId: "u4",
      solicitanteNome: "Beatriz Lima Rocha",
      cpf: "321.654.987-00",
      siape: "5544332",
      cargo: "Procurador(a) Federal",
      uf: "MG",
      unidade: "PF/MG",
      chefiaId: "ch3",
      chefiaNome: "Dra. Patrícia Mendes",
      formacao: "Mestrado",
      tipoSolicitacao: "Solicitação",
      status: "APROVADA",
      historico: [
        { data: "2025-04-28T08:45:00Z", evento: "Solicitação criada", autor: "Beatriz Lima Rocha" },
        { data: "2025-05-03T17:30:00Z", evento: "Solicitação aprovada pela chefia", autor: "Dra. Patrícia Mendes" },
      ],
    },
    {
      semestre: "2025.2",
      dataAbertura: "2025-05-10T13:20:00Z",
      solicitanteId: "u1",
      solicitanteNome: "João Pereira da Silva",
      cpf: "123.456.789-00",
      siape: "1234567",
      cargo: "Advogado(a) da União",
      uf: "DF",
      unidade: "PGU/DF - Núcleo Tributário",
      chefiaId: "ch1",
      chefiaNome: "Dra. Maria Helena Souza",
      formacao: "Mestrado",
      tipoSolicitacao: "Correção",
      protocoloOriginal: "AGU-2025-100000",
      descricaoCorrecao: "Corrigir Unidade/Equipe para PGU/DF — Núcleo Cível, conforme nova lotação a partir de maio/2025.",
      status: "PENDENTE",
      historico: [
        { data: "2025-05-10T13:20:00Z", evento: "Correção solicitada (referência: AGU-2025-100000)", autor: "João Pereira da Silva" },
      ],
    },
  ];
  return base.map((s, i) => ({
    ...s,
    id: `seed-${i + 1}`,
    protocolo: `AGU-2025-${100000 + i * 137}`,
  }));
}
