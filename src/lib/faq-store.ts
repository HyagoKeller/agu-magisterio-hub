import { useSyncExternalStore } from "react";

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  ordem: number;
  atualizadoEm: string;
}

const KEY = "agu_magisterio_faq_v1";

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
    id: "f2",
    categoria: "Solicitações",
    pergunta: "Quais informações preciso para abrir uma solicitação?",
    resposta:
      "CPF, SIAPE, cargo, unidade/equipe, dados da chefia imediata e as atividades de ensino do semestre (horários, disciplinas, projetos e avaliações), conforme a Portaria Interministerial AGU/MF/BACEN nº 1/2020.",
    ordem: 2,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f3",
    categoria: "Recurso",
    pergunta: "Como recorrer de uma recusa?",
    resposta:
      "Você tem até 5 dias úteis após a recusa para entrar com recurso, em 'Minhas Solicitações' → botão 'Entrar com Recurso'. O recurso é único e será reanalisado pela chefia imediata.",
    ordem: 3,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: "f4",
    categoria: "Prazos",
    pergunta: "A autorização vale por quanto tempo?",
    resposta:
      "A autorização é válida apenas para o semestre letivo vigente, sendo necessário novo requerimento para os semestres subsequentes.",
    ordem: 4,
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
