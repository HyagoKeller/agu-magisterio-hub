import { useSyncExternalStore } from "react";
import type { AccessRequest, ADConfig, User } from "./types";

const AD_KEY = "agu_ad_config_v1";
const REQ_KEY = "agu_access_requests_v1";
const USERS_KEY = "agu_managed_users_v1";

const DEFAULT_AD: ADConfig = {
  habilitado: false,
  servidor: "ldaps://ad.agu.gov.br",
  porta: 636,
  baseDN: "DC=agu,DC=gov,DC=br",
  bindDN: "CN=svc_magisterio,OU=Servicos,DC=agu,DC=gov,DC=br",
  bindPassword: "",
  usarSSL: true,
  dominio: "agu.gov.br",
  grupoSolicitantes: "GG-MAGISTERIO-SOLICITANTES",
  grupoChefia: "GG-MAGISTERIO-CHEFIA",
  grupoCoordenacao: "GG-MAGISTERIO-COORDENACAO",
  grupoSuperadmin: "GG-MAGISTERIO-ADMIN",
  sincronizacaoAutomatica: true,
  intervaloSincronizacao: 60,
};

function loadAD(): ADConfig {
  if (typeof window === "undefined") return DEFAULT_AD;
  try {
    const raw = localStorage.getItem(AD_KEY);
    return raw ? { ...DEFAULT_AD, ...JSON.parse(raw) } : DEFAULT_AD;
  } catch { return DEFAULT_AD; }
}

function loadRequests(): AccessRequest[] {
  if (typeof window === "undefined") return seedRequests();
  try {
    const raw = localStorage.getItem(REQ_KEY);
    if (!raw) {
      const s = seedRequests();
      localStorage.setItem(REQ_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch { return seedRequests(); }
}

function loadUsers(): User[] {
  if (typeof window === "undefined") return seedUsers();
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const s = seedUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch { return seedUsers(); }
}

let adState: ADConfig | null = null;
let reqState: AccessRequest[] | null = null;
let usersState: User[] | null = null;
const adListeners = new Set<() => void>();
const reqListeners = new Set<() => void>();
const usersListeners = new Set<() => void>();

export const adStore = {
  get(): ADConfig {
    if (adState === null) adState = loadAD();
    return adState;
  },
  set(c: ADConfig) {
    adState = c;
    if (typeof window !== "undefined") localStorage.setItem(AD_KEY, JSON.stringify(c));
    adListeners.forEach((l) => l());
  },
  subscribe(l: () => void) { adListeners.add(l); return () => adListeners.delete(l); },
};

export const requestsStore = {
  getAll(): AccessRequest[] {
    if (reqState === null) reqState = loadRequests();
    return reqState;
  },
  add(r: AccessRequest) {
    reqState = [r, ...this.getAll()];
    if (typeof window !== "undefined") localStorage.setItem(REQ_KEY, JSON.stringify(reqState));
    reqListeners.forEach((l) => l());
  },
  decide(id: string, status: "APROVADO" | "RECUSADO", validadoPor: string, motivo?: string) {
    reqState = this.getAll().map((r) =>
      r.id === id
        ? { ...r, status, validadoPor, dataValidacao: new Date().toISOString(), motivoRecusa: motivo }
        : r,
    );
    if (typeof window !== "undefined") localStorage.setItem(REQ_KEY, JSON.stringify(reqState));
    reqListeners.forEach((l) => l());
  },
  subscribe(l: () => void) { reqListeners.add(l); return () => reqListeners.delete(l); },
};

export const usersStore = {
  getAll(): User[] {
    if (usersState === null) usersState = loadUsers();
    return usersState;
  },
  add(u: User) {
    usersState = [u, ...this.getAll()];
    if (typeof window !== "undefined") localStorage.setItem(USERS_KEY, JSON.stringify(usersState));
    usersListeners.forEach((l) => l());
  },
  update(id: string, patch: Partial<User>) {
    usersState = this.getAll().map((u) => (u.id === id ? { ...u, ...patch } : u));
    if (typeof window !== "undefined") localStorage.setItem(USERS_KEY, JSON.stringify(usersState));
    usersListeners.forEach((l) => l());
  },
  remove(id: string) {
    usersState = this.getAll().filter((u) => u.id !== id);
    if (typeof window !== "undefined") localStorage.setItem(USERS_KEY, JSON.stringify(usersState));
    usersListeners.forEach((l) => l());
  },
  subscribe(l: () => void) { usersListeners.add(l); return () => usersListeners.delete(l); },
};

export function useADConfig() {
  return useSyncExternalStore(adStore.subscribe, adStore.get, adStore.get);
}
export function useAccessRequests() {
  return useSyncExternalStore(requestsStore.subscribe, requestsStore.getAll, requestsStore.getAll);
}
export function useManagedUsers() {
  return useSyncExternalStore(usersStore.subscribe, usersStore.getAll, usersStore.getAll);
}

function seedRequests(): AccessRequest[] {
  return [
    {
      id: "req-1",
      nome: "Fernanda Alves Ribeiro",
      cpf: "111.222.333-44",
      emailPessoal: "fernanda.alves@gmail.com",
      cargoPretendido: "Procurador(a) Federal",
      perfilSolicitado: "SOLICITANTE",
      unidade: "PF/PE",
      justificativa: "Recém-empossada, ainda sem usuário institucional liberado para o sistema de magistério.",
      dataSolicitacao: "2025-05-10T13:20:00Z",
      status: "PENDENTE",
    },
    {
      id: "req-2",
      nome: "Ricardo Mendes Tavares",
      cpf: "222.333.444-55",
      emailPessoal: "ricardo.tavares@hotmail.com",
      emailInstitucional: "ricardo.tavares@agu.gov.br",
      cargoPretendido: "Advogado(a) da União",
      perfilSolicitado: "SOLICITANTE",
      unidade: "PGU/RS",
      justificativa: "Acesso revogado por inatividade. Retornei ao quadro ativo neste mês.",
      dataSolicitacao: "2025-05-12T09:05:00Z",
      status: "PENDENTE",
    },
  ];
}

function seedUsers(): User[] {
  return [
    { id: "u1", nome: "João Pereira da Silva", email: "joao.silva@agu.gov.br", emailPessoal: "joao.silva.pessoal@gmail.com", role: "SOLICITANTE", matricula: "1234567", origem: "AD", ativo: true },
    { id: "u2", nome: "Ana Carolina Souza", email: "ana.souza@agu.gov.br", role: "SOLICITANTE", matricula: "7654321", origem: "AD", ativo: true },
    { id: "ch1", nome: "Dra. Maria Helena Souza", email: "maria.souza@agu.gov.br", role: "CHEFIA", origem: "AD", ativo: true },
    { id: "ch2", nome: "Dr. Carlos Eduardo Lima", email: "carlos.lima@agu.gov.br", role: "CHEFIA", origem: "AD", ativo: true },
    { id: "co1", nome: "Dr. Antônio Coordenador", email: "antonio.cgu@agu.gov.br", role: "COORDENADOR", origem: "AD", ativo: true },
    { id: "sa1", nome: "Administrador do Sistema", email: "admin.ti@agu.gov.br", role: "SUPERADMIN", origem: "MANUAL", ativo: true },
  ];
}

export function newRequestId() {
  return `req-${Date.now().toString(36)}`;
}
