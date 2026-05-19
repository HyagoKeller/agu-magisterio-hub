export type Role = "SOLICITANTE" | "CHEFIA" | "COORDENADOR" | "SUPERADMIN";

export type SolicitacaoStatus = "PENDENTE" | "APROVADA" | "RECUSADA";

export type RecursoStatus = "PENDENTE" | "ACEITO" | "REJEITADO";

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

export interface AtividadesEnsino {
  horarios: Record<string, boolean>; // "MANHA-SEG" => true
  disciplinas: string;
  projetoPedagogico: string;
  material: string;
  avaliacoes: string;
  declaracaoLeu: boolean;
  declaracaoVerdade: boolean;
  declaracaoCiente: boolean;
}

export interface Recurso {
  texto: string;
  dataSolicitacao: string;
  status: RecursoStatus;
  decisaoData?: string;
  decisaoComentario?: string;
  decididoPor?: string;
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
  chefiaEmail?: string;
  formacao?: string;
  tipoSolicitacao: "Solicitação" | "Correção";
  protocoloOriginal?: string;
  descricaoCorrecao?: string;
  atividades?: AtividadesEnsino;
  status: SolicitacaoStatus;
  decisaoComentario?: string;
  justificativaRecusa?: string;
  recurso?: Recurso;
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
  intervaloSincronizacao: number;
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

export const DIAS_SEMANA = ["SEG","TER","QUA","QUI","SEX","SAB","DOM","ALT"] as const;
export const DIAS_LABEL: Record<typeof DIAS_SEMANA[number], string> = {
  SEG:"SEG", TER:"TER", QUA:"QUA", QUI:"QUI", SEX:"SEX", SAB:"SÁB", DOM:"DOM", ALT:"Dias Alternados",
};
export const TURNOS = ["MANHA","TARDE","NOITE","VARIAVEL"] as const;
export const TURNOS_LABEL: Record<typeof TURNOS[number], string> = {
  MANHA:"MANHÃ", TARDE:"TARDE", NOITE:"NOITE", VARIAVEL:"VARIÁVEL",
};

/** Soma `n` dias úteis (seg-sex) a partir de `from`. */
export function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

/** Retorna true se ainda pode recorrer (até 5 dias úteis após a decisão) */
export function dentroPrazoRecurso(dataDecisaoIso?: string): boolean {
  if (!dataDecisaoIso) return false;
  const limite = addBusinessDays(new Date(dataDecisaoIso), 5);
  return new Date() <= limite;
}

export type MessagingProvider = "NONE" | "GOOGLE" | "MICROSOFT";

export interface MessagingConfig {
  provider: MessagingProvider;
  habilitado: boolean;
  remetente: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  notificarNovaSolicitacao: boolean;
  notificarDecisao: boolean;
  copiaSolicitante: boolean;
  copiaChefia: boolean;
}
