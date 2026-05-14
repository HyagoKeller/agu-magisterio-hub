import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { StatusTag } from "@/components/StatusTag";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/chefia/historico")({
  head: () => ({ meta: [{ title: "Histórico — Chefia | Portal Magistério AGU" }] }),
  component: Historico,
});

function Historico() {
  const { user } = useAuth();
  const all = useSolicitacoes();
  const [status, setStatus] = useState<"TODAS" | "APROVADA" | "RECUSADA">("TODAS");
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");

  const list = useMemo(() => {
    return all
      .filter((s) => s.chefiaId === user?.id && s.status !== "PENDENTE")
      .filter((s) => status === "TODAS" || s.status === status)
      .filter((s) => {
        if (!s.dataDecisao) return false;
        const d = s.dataDecisao.slice(0, 10);
        if (ini && d < ini) return false;
        if (fim && d > fim) return false;
        return true;
      })
      .sort((a, b) => (b.dataDecisao || "").localeCompare(a.dataDecisao || ""));
  }, [all, user, status, ini, fim]);

  const exportar = () => {
    const header = ["Protocolo", "Solicitante", "Decisão", "Data da Decisão", "Comentário/Justificativa"];
    const rows = list.map((s) => [
      s.protocolo,
      s.solicitanteNome,
      s.status === "APROVADA" ? "Aprovada" : "Recusada",
      s.dataDecisao ? new Date(s.dataDecisao).toLocaleString("pt-BR") : "",
      (s.decisaoComentario || s.justificativaRecusa || "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `historico-decisoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Início", to: "/chefia" },
        { label: "Histórico" },
      ]} />
      <section className="gov-container pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl mb-1">Histórico de Decisões</h1>
            <p className="text-sm text-muted-foreground">Suas decisões anteriores.</p>
          </div>
          <button
            type="button"
            onClick={exportar}
            className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        <div className="gov-card mb-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="st">Status</label>
            <select id="st" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="TODAS">Todas</option>
              <option value="APROVADA">Aprovadas</option>
              <option value="RECUSADA">Recusadas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="ini">Data inicial</label>
            <input id="ini" type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="fim">Data final</label>
            <input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="gov-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <Th>Protocolo</Th><Th>Solicitante</Th><Th>Decisão</Th><Th>Data da Decisão</Th><Th>Comentário</Th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum registro.</td></tr>
              )}
              {list.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                  <Td>{s.solicitanteNome}</Td>
                  <Td><StatusTag status={s.status} /></Td>
                  <Td>{s.dataDecisao ? new Date(s.dataDecisao).toLocaleString("pt-BR") : "—"}</Td>
                  <Td className="max-w-sm truncate">{s.decisaoComentario || s.justificativaRecusa || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}
