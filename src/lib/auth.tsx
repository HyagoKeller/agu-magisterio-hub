import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

const KEY = "agu_magisterio_user_v1";
const PENDING_KEY = "agu_magisterio_pending_mfa_v1";
const MFA_KEY = "agu_magisterio_mfa_v1"; // demo: { [userId]: secret }

const PRESET: Record<Role, User> = {
  SOLICITANTE: { id: "u1", nome: "João Pereira da Silva", email: "joao.silva@agu.gov.br", role: "SOLICITANTE", matricula: "1234567", emailPessoal: "joao.silva.pessoal@gmail.com", origem: "AD", ativo: true },
  CHEFIA: { id: "ch1", nome: "Dra. Maria Helena Souza", email: "maria.souza@agu.gov.br", role: "CHEFIA", origem: "AD", ativo: true, gruposGestao: ["COORDENADOR", "SUPERADMIN"] },
  COORDENADOR: { id: "co1", nome: "Dr. Antônio Coordenador CGAU/AGU", email: "antonio.cgau@agu.gov.br", role: "COORDENADOR", origem: "AD", ativo: true },
  SUPERADMIN: { id: "sa1", nome: "Administrador do Sistema", email: "admin.ti@agu.gov.br", role: "SUPERADMIN", origem: "MANUAL", ativo: true },
};

interface AuthCtx {
  user: User | null;
  /** Usuário aguardando 2º fator (MFA TOTP). Não tem sessão ainda. */
  pendingMfa: User | null;
  /** Login direto (sem MFA) — uso interno do protótipo. */
  login: (role: Role) => void;
  /**
   * Login local (LDAP simulado): se o usuário tiver MFA habilitado, devolve
   * `requiresMfa: true` e guarda o usuário em "pendingMfa". Caso contrário,
   * grava a sessão imediatamente.
   */
  loginLocal: (role: Role) => { requiresMfa: boolean };
  /** Conclui o 2º fator: promove pendingMfa → user. */
  completeMfa: () => void;
  /** Cancela o 2º fator pendente. */
  cancelMfa: () => void;
  /** Habilita o TOTP do usuário logado (persiste segredo demo em localStorage). */
  enableMfa: (secret: string) => void;
  /** Desabilita TOTP. */
  disableMfa: () => void;
  logout: () => void;
  /** Alterna o perfil mantendo a identidade da Chefia (simula SSO multi-grupo do AD). */
  switchRole: (role: Role) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function loadMfaStore(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MFA_KEY) ?? "{}"); } catch { return {}; }
}
function saveMfaStore(s: Record<string, string>) {
  localStorage.setItem(MFA_KEY, JSON.stringify(s));
}

function hydrateUser(u: User): User {
  const store = loadMfaStore();
  const secret = store[u.id];
  return secret ? { ...u, mfaEnabled: true, mfaSecret: secret } : u;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingMfa, setPendingMfa] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(hydrateUser(JSON.parse(raw)));
      const pending = localStorage.getItem(PENDING_KEY);
      if (pending) setPendingMfa(hydrateUser(JSON.parse(pending)));
    } catch {}
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
    setUser(u);
  };

  const login = (role: Role) => {
    persist(hydrateUser(PRESET[role]));
  };

  const loginLocal = (role: Role) => {
    const u = hydrateUser(PRESET[role]);
    if (u.mfaEnabled && u.mfaSecret) {
      localStorage.setItem(PENDING_KEY, JSON.stringify(u));
      setPendingMfa(u);
      return { requiresMfa: true };
    }
    persist(u);
    return { requiresMfa: false };
  };

  const completeMfa = () => {
    if (!pendingMfa) return;
    persist(pendingMfa);
    localStorage.removeItem(PENDING_KEY);
    setPendingMfa(null);
  };

  const cancelMfa = () => {
    localStorage.removeItem(PENDING_KEY);
    setPendingMfa(null);
  };

  const enableMfa = (secret: string) => {
    if (!user) return;
    const store = loadMfaStore();
    store[user.id] = secret;
    saveMfaStore(store);
    persist({ ...user, mfaEnabled: true, mfaSecret: secret });
  };

  const disableMfa = () => {
    if (!user) return;
    const store = loadMfaStore();
    delete store[user.id];
    saveMfaStore(store);
    const { mfaSecret: _s, ...rest } = user;
    persist({ ...rest, mfaEnabled: false });
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PENDING_KEY);
    setUser(null);
    setPendingMfa(null);
  };

  const switchRole = (role: Role) => {
    if (!user) return;
    persist({ ...user, role });
  };

  return (
    <Ctx.Provider value={{ user, pendingMfa, login, loginLocal, completeMfa, cancelMfa, enableMfa, disableMfa, logout, switchRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}

export function homeForRole(role: Role): string {
  if (role === "SOLICITANTE") return "/solicitante";
  if (role === "CHEFIA") return "/chefia";
  if (role === "SUPERADMIN") return "/admin";
  return "/coordenador";
}
