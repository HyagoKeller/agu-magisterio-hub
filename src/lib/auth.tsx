import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

const KEY = "agu_magisterio_user_v1";

const PRESET: Record<Role, User> = {
  SOLICITANTE: { id: "u1", nome: "João Pereira da Silva", email: "joao.silva@agu.gov.br", role: "SOLICITANTE", matricula: "1234567", emailPessoal: "joao.silva.pessoal@gmail.com", origem: "AD", ativo: true },
  CHEFIA: { id: "ch1", nome: "Dra. Maria Helena Souza", email: "maria.souza@agu.gov.br", role: "CHEFIA", origem: "AD", ativo: true },
  COORDENADOR: { id: "co1", nome: "Dr. Antônio Coordenador CGU/AGU", email: "antonio.cgu@agu.gov.br", role: "COORDENADOR", origem: "AD", ativo: true },
  SUPERADMIN: { id: "sa1", nome: "Administrador do Sistema", email: "admin.ti@agu.gov.br", role: "SUPERADMIN", origem: "MANUAL", ativo: true },
};

interface AuthCtx {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
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

  const login = (role: Role) => {
    const u = PRESET[role];
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
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
