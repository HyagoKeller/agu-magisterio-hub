export type Role = "SOLICITANTE" | "CHEFIA" | "COORDENADOR";

export type SolicitacaoStatus = "PENDENTE" | "APROVADA" | "RECUSADA";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  matricula?: string;
}

export interface Solicitacao {
  id: string;
  protocolo: string;
  semestre: string;
  dataAbertura: string;
  dataDecisao?: string;
  // Solicitante
  solicitanteId: string;
  solicitanteNome: string;
  cpf: string;
  siape: string;
  oabNumero?: string;
  oabUf?: string;
  cargo: string;
  uf: string;
  unidade: string;
  chefiaId: string;
  chefiaNome: string;
  formacao?: string;
  tipoSolicitacao: "Solicitação";
  // Decisão
  status: SolicitacaoStatus;
  decisaoComentario?: string;
  justificativaRecusa?: string;
  // Histórico
  historico: HistoricoEvento[];
}

export interface HistoricoEvento {
  data: string;
  evento: string;
  autor: string;
}

export const CARGOS = [
  "Advogado(a) da União",
  "Procurador(a) da Fazenda Nacional",
  "Procurador(a) Federal",
  "Procurador(a) do Banco Central do Brasil",
  "Quadro Suplementar da AGU",
] as const;

export const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
] as const;

export const FORMACOES = ["Especialização", "Mestrado", "Doutorado"] as const;

export const CHEFIAS = [
  { id: "ch1", nome: "Dra. Maria Helena Souza" },
  { id: "ch2", nome: "Dr. Carlos Eduardo Lima" },
  { id: "ch3", nome: "Dra. Patrícia Mendes" },
  { id: "ch4", nome: "Dr. Roberto Almeida" },
  { id: "ch5", nome: "Dra. Juliana Ferreira" },
];
