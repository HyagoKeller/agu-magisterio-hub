export type Role = "SOLICITANTE" | "CHEFIA" | "COORDENADOR" | "SUPERADMIN";

export type SolicitacaoStatus = "PENDENTE" | "APROVADA" | "RECUSADA";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  matricula?: string;
  emailPessoal?: string;
  origem?: "AD" | "MANUAL";
  ativo?: boolean;
}

export interface Solicitacao {
  id: string;
  protocolo: string;
  semestre: string;
  dataAbertura: string;
  dataDecisao?: string;
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
  tipoSolicitacao: "Solicitação" | "Correção";
  protocoloOriginal?: string;
  descricaoCorrecao?: string;
  status: SolicitacaoStatus;
  decisaoComentario?: string;
  justificativaRecusa?: string;
  historico: HistoricoEvento[];
}

export interface HistoricoEvento {
  data: string;
  evento: string;
  autor: string;
}

export type AccessRequestStatus = "PENDENTE" | "APROVADO" | "RECUSADO";

export interface AccessRequest {
  id: string;
  nome: string;
  cpf: string;
  emailPessoal: string;
  emailInstitucional?: string;
  cargoPretendido: string;
  perfilSolicitado: Role;
  unidade?: string;
  justificativa: string;
  dataSolicitacao: string;
  status: AccessRequestStatus;
  validadoPor?: string;
  dataValidacao?: string;
  motivoRecusa?: string;
}

export interface ADConfig {
  habilitado: boolean;
  servidor: string;
  porta: number;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  usarSSL: boolean;
  dominio: string;
  grupoSolicitantes: string;
  grupoChefia: string;
  grupoCoordenacao: string;
  grupoSuperadmin: string;
  sincronizacaoAutomatica: boolean;
  intervaloSincronizacao: number; // minutos
  ultimaSincronizacao?: string;
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
  { id: "ch1", nome: "Dra. Maria Helena Souza", email: "maria.souza@agu.gov.br" },
  { id: "ch2", nome: "Dr. Carlos Eduardo Lima", email: "carlos.lima@agu.gov.br" },
  { id: "ch3", nome: "Dra. Patrícia Mendes", email: "patricia.mendes@agu.gov.br" },
  { id: "ch4", nome: "Dr. Roberto Almeida", email: "roberto.almeida@agu.gov.br" },
  { id: "ch5", nome: "Dra. Juliana Ferreira", email: "juliana.ferreira@agu.gov.br" },
];

export type MessagingProvider = "NONE" | "GOOGLE" | "MICROSOFT";

export interface MessagingConfig {
  provider: MessagingProvider;
  habilitado: boolean;
  remetente: string;
  // Google Workspace
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  // Microsoft 365 / Graph
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  // Eventos
  notificarNovaSolicitacao: boolean;
  notificarDecisao: boolean;
  copiaSolicitante: boolean;
  copiaChefia: boolean;
}
