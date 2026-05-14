import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { StatusTag } from "@/components/StatusTag";
import { DetalheDrawer } from "@/routes/solicitante.minhas";
import { useSolicitacoes } from "@/lib/store";
import type { Solicitacao, SolicitacaoStatus } from "@/lib/types";
import { CARGOS, CHEFIAS, UFS } from "@/lib/types";

export const Route = createFileRoute("/coordenador/todas")({
  head: () => ({ meta: [{ title: "Todas as Solicitações — Portal Magistério AGU" }] }),
  component: Todas,
});

const PAGE_SIZE = 20;

function Todas() {
  const all = useSolicitacoes();
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState<"" | SolicitacaoStatus>("");
  const [chefia, setChefia] = useState("");
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [page, setPage] = useState(1);
  const [det, setDet] = useState<Solicitacao | null>(null);

  const filtrados = useMemo(() => {
    return all.filter((s) => {
      if (q) {
        const t = q.toLowerCase();
        if (!s.solicitanteNome.toLowerCase().includes(t) && !s.cpf.includes(t)) return false;
      }
      if (uf && s.uf !== uf) return false;
      if (cargo && s.cargo !== cargo) return false;
      if (status && s.status !== status) return false;
      if (chefia && s.chefiaId !== chefia) return false;
      const d = s.dataAbertura.slice(0, 10);
      if (ini && d < ini) return false;
      if (fim && d > fim) return false;
      return true;
    });
  }, [all, q, uf, cargo, status, chefia, ini, fim]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageItems = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Dashboard", to: "/coordenador" },
        { label: "Todas as Solicitações" },
      ]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Visão Consolidada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Todos os registros do sistema, com filtros avançados.
        </p>

        <div className="gov-card mb-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="busca" className="block text-xs font-semibold mb-1">Buscar por nome ou CPF</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  id="busca"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm focus:border-gov-blue"
                  placeholder="Digite para buscar…"
                />
              </div>
            </div>
            <Select label="UF" value={uf} onChange={(v) => { setUf(v); setPage(1); }} options={["", ...UFS]} />
            <Select label="Status" value={status} onChange={(v) => { setStatus(v as typeof status); setPage(1); }}
              options={["", "PENDENTE", "APROVADA", "RECUSADA"]}
              labels={{ "": "Todos", PENDENTE: "Em andamento", APROVADA: "Aprovadas", RECUSADA: "Recusadas" }}
            />
            <Select label="Cargo" value={cargo} onChange={(v) => { setCargo(v); setPage(1); }} options={["", ...CARGOS]} />
            <Select label="Chefia" value={chefia} onChange={(v) => { setChefia(v); setPage(1); }}
              options={["", ...CHEFIAS.map((c) => c.id)]}
              labels={Object.fromEntries([["", "Todas"], ...CHEFIAS.map((c) => [c.id, c.nome])])}
            />
            <DateInput label="Data inicial" value={ini} onChange={setIni} />
            <DateInput label="Data final" value={fim} onChange={setFim} />
          </div>
        </div>

        <div className="gov-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <Th>Protocolo</Th><Th>Solicitante</Th><Th>CPF</Th><Th>Cargo</Th>
                <Th>UF</Th><Th>Chefia</Th><Th>Status</Th>
                <Th>Abertura</Th><Th>Decisão</Th><Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Nenhum registro.</td></tr>
              )}
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                  <Td>{s.solicitanteNome}</Td>
                  <Td className="font-mono text-xs">{s.cpf}</Td>
                  <Td className="text-xs">{s.cargo}</Td>
                  <Td>{s.uf}</Td>
                  <Td className="text-xs">{s.chefiaNome}</Td>
                  <Td><StatusTag status={s.status} /></Td>
                  <Td className="text-xs">{new Date(s.dataAbertura).toLocaleDateString("pt-BR")}</Td>
                  <Td className="text-xs">{s.dataDecisao ? new Date(s.dataDecisao).toLocaleDateString("pt-BR") : "—"}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setDet(s)}
                      className="text-xs font-semibold text-gov-blue hover:underline"
                    >
                      Ver
                    </button>
                  </Td>
                  
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filtrados.length} {filtrados.length === 1 ? "registro" : "registros"} • Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </section>

      {det && <DetalheDrawer s={det} onClose={() => setDet(null)} />}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

function Select({ label, value, onChange, options, labels }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; labels?: Record<string, string>;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
      >
        {options.map((o) => (
          <option key={o} value={o}>{labels?.[o] ?? (o || "Todos")}</option>
        ))}
      </select>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue" />
    </div>
  );
}
