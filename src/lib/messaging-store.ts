import { useSyncExternalStore } from "react";
import type { MessagingConfig } from "./types";

const KEY = "agu_messaging_config_v1";

const DEFAULT: MessagingConfig = {
  provider: "NONE",
  habilitado: false,
  remetente: "no-reply@agu.gov.br",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  msTenantId: "",
  msClientId: "",
  msClientSecret: "",
  notificarNovaSolicitacao: true,
  notificarDecisao: true,
  copiaSolicitante: true,
  copiaChefia: true,
};

function load(): MessagingConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let state: MessagingConfig | null = null;
const listeners = new Set<() => void>();

export const messagingStore = {
  get(): MessagingConfig {
    if (state === null) state = load();
    return state;
  },
  set(c: MessagingConfig) {
    state = c;
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(c));
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useMessagingConfig() {
  return useSyncExternalStore(messagingStore.subscribe, messagingStore.get, messagingStore.get);
}

export interface NotifyPayload {
  evento: "NOVA_SOLICITACAO" | "DECISAO_APROVADA" | "DECISAO_RECUSADA";
  destinatarios: { nome: string; email: string }[];
  protocolo: string;
  resumo: string;
}

/**
 * Envia notificação simulada. Em produção, dispara via Google Workspace (Gmail API)
 * ou Microsoft Graph (sendMail), conforme configuração do superadmin.
 */
export function dispatchNotification(payload: NotifyPayload) {
  const cfg = messagingStore.get();
  const log = {
    timestamp: new Date().toISOString(),
    provider: cfg.provider,
    habilitado: cfg.habilitado,
    remetente: cfg.remetente,
    ...payload,
  };
  // eslint-disable-next-line no-console
  console.info("[Notificação Magistério AGU]", log);
  return log;
}
