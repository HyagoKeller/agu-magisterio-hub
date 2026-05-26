import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

const KEY = "agu_magisterio_user_v1";

const PRESET: Record<Role, User> = {
  SOLICITANTE: { id: "u1", nome: "João Pereira da Silva", email: "joao.silva@agu.gov.br", role: "SOLICITANTE", matricula: "1234567", emailPessoal: "joao.silva.pessoal@gmail.com", origem: "AD", ativo: true },
  CHEFIA: { id: "ch1", nome: "Dra. Maria Helena Souza", email: "maria.souza@agu.gov.br", role: "CHEFIA", origem: "AD", ativo: true, gruposGestao: ["COORDENADOR", "SUPERADMIN"] },
  COORDENADOR: { id: "co1", nome: "Dr. Antônio Coordenador CGAU/AGU", email: "antonio.cgau@agu.gov.br", role: "COORDENADOR", origem: "AD", ativo: true },
  SUPERADMIN: { id: "sa1", nome: "Administrador do Sistema", email: "admin.ti@agu.gov.br", role: "SUPERADMIN", origem: "MANUAL", ativo: true },
};

interface AuthCtx {
  user: User | null;
  /** Compat: o portal não exige mais MFA local — o 2º fator é delegado ao Entra ID/365. */
  pendingMfa: null;
  login: (role: Role) => void;
  /** Login local (LDAP simulado). MFA não é mais aplicado pelo portal. */
  loginLocal: (role: Role) => { requiresMfa: false };
  logout: () => void;
  switchRole: (role: Role) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
    setUser(u);
  };

  const login = (role: Role) => persist(PRESET[role]);

  const loginLocal = (role: Role) => {
    persist(PRESET[role]);
    return { requiresMfa: false as const };
  };

  const logout = () => persist(null);

  const switchRole = (role: Role) => {
    if (!user) return;
    persist({ ...user, role });
  };

  return (
    <Ctx.Provider value={{ user, pendingMfa: null, login, loginLocal, logout, switchRole }}>
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
