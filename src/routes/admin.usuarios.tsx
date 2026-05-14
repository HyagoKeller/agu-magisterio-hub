import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UserCog } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { useManagedUsers, usersStore } from "@/lib/admin-store";
import type { Role, User } from "@/lib/types";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsersPage,
});

const ROLE_LABEL: Record<Role, string> = {
  SOLICITANTE: "Solicitante",
  CHEFIA: "Chefia",
  COORDENADOR: "Coordenação",
  SUPERADMIN: "Superadmin",
};

function UsersPage() {
  const users = useManagedUsers();
  const [filtro, setFiltro] = useState<"" | Role>("");
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const lista = useMemo(() => {
    return users.filter((u) => {
      if (filtro && u.role !== filtro) return false;
      if (q && !(`${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [users, filtro, q]);

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/admin" }, { label: "Usuários e Grupos" }]} />
      <section className="gov-container pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl mb-1">Usuários e Grupos</h1>
            <p className="text-sm text-muted-foreground">
              Usuários sincronizados pelo AD aparecem como <strong>Origem AD</strong>. Acessos externos (concedidos manualmente) aparecem como <strong>Manual</strong>.
            </p>
          </div>
          <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-full bg-gov-blue px-4 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark">
            <Plus className="h-4 w-4" /> Novo usuário manual
          </button>
        </div>

        <div className="mt-6 gov-card">
          <div className="flex flex-wrap gap-3 mb-4">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail" className="flex-1 min-w-[220px] rounded-md border border-input bg-card px-3 py-2 text-sm" />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Role | "")} className="rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">Todos os perfis</option>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">E-mail</th>
                  <th className="py-2 pr-3">Perfil</th>
                  <th className="py-2 pr-3">Origem</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id} className="border-b border-border">
                    <td className="py-2 pr-3 font-medium">{u.nome}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.role}
                        onChange={(e) => { usersStore.update(u.id, { role: e.target.value as Role }); toast.success("Perfil atualizado."); }}
                        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
                      >
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${u.origem === "AD" ? "bg-gov-blue-light text-gov-blue" : "bg-muted text-foreground"}`}>{u.origem}</span>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => { usersStore.update(u.id, { ativo: !u.ativo }); }}
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${u.ativo ? "bg-[oklch(0.94_0.08_145)] text-gov-success" : "bg-[oklch(0.95_0.05_27)] text-gov-danger"}`}
                      >
                        {u.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button onClick={() => { if (confirm("Remover usuário?")) usersStore.remove(u.id); }} className="inline-flex items-center gap-1 text-gov-red hover:underline text-xs"><Trash2 className="h-3.5 w-3.5" /> Remover</button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground"><UserCog className="inline h-5 w-5 mr-1" /> Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {openNew && <NewUserModal onClose={() => setOpenNew(false)} />}
    </>
  );
}

function NewUserModal({ onClose }: { onClose: () => void }) {
  const [u, setU] = useState<Partial<User>>({ role: "SOLICITANTE", origem: "MANUAL", ativo: true });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!u.nome || !u.email) { toast.error("Preencha nome e e-mail."); return; }
    usersStore.add({ id: `m-${Date.now().toString(36)}`, nome: u.nome!, email: u.email!, emailPessoal: u.emailPessoal, role: (u.role as Role) || "SOLICITANTE", origem: "MANUAL", ativo: true });
    toast.success("Usuário criado.");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg">
        <h2 className="font-display text-lg mb-4">Novo usuário manual</h2>
        <div className="grid gap-3">
          <input placeholder="Nome completo" className="rounded-md border border-input px-3 py-2 text-sm" onChange={(e) => setU({ ...u, nome: e.target.value })} />
          <input placeholder="E-mail institucional ou pessoal" className="rounded-md border border-input px-3 py-2 text-sm" onChange={(e) => setU({ ...u, email: e.target.value })} />
          <input placeholder="E-mail pessoal (recuperação)" className="rounded-md border border-input px-3 py-2 text-sm" onChange={(e) => setU({ ...u, emailPessoal: e.target.value })} />
          <select value={u.role} onChange={(e) => setU({ ...u, role: e.target.value as Role })} className="rounded-md border border-input px-3 py-2 text-sm">
            <option value="SOLICITANTE">Solicitante</option>
            <option value="CHEFIA">Chefia</option>
            <option value="COORDENADOR">Coordenação</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Cancelar</button>
          <button type="submit" className="rounded-full bg-gov-blue px-4 py-2 text-sm font-semibold text-white">Criar</button>
        </div>
      </form>
    </div>
  );
}
