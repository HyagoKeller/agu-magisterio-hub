import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { useSolicitacoes } from "@/lib/store";
import { CARGOS, CHEFIAS, UFS } from "@/lib/types";

export const Route = createFileRoute("/coordenador/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Portal Magistério AGU" }] }),
  component: Relatorios,
});

function Relatorios() {
  const all = useSolicitacoes();
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [uf, setUf] = useState("");
  const [status, setStatus] = useState("");
  const [cargo, setCargo] = useState("");

  const filtrados = useMemo(() =>
    all.filter((s) => {
      const d = s.dataAbertura.slice(0, 10);
      if (ini && d < ini) return false;
      if (fim && d > fim) return false;
      if (uf && s.uf !== uf) return false;
      if (status && s.status !== status) return false;
      if (cargo && s.cargo !== cargo) return false;
      return true;
    }), [all, ini, fim, uf, status, cargo]);

  const porChefia = useMemo(() => {
    const m = new Map<string, { aprov: number; rec: number; pend: number }>();
    filtrados.forEach((s) => {
      const cur = m.get(s.chefiaNome) || { aprov: 0, rec: 0, pend: 0 };
      if (s.status === "APROVADA") cur.aprov++;
      else if (s.status === "RECUSADA") cur.rec++;
      else cur.pend++;
      m.set(s.chefiaNome, cur);
    });
    return [...m.entries()].map(([nome, v]) => ({ nome, ...v, total: v.aprov + v.rec + v.pend }));
  }, [filtrados]);

  const porUF = useMemo(() => {
    const m = new Map<string, number>();
    filtrados.forEach((s) => m.set(s.uf, (m.get(s.uf) || 0) + 1));
    const total = filtrados.length;
    return [...m.entries()]
      .map(([uf, qtd]) => ({ uf, qtd, pct: total ? ((qtd / total) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [filtrados]);

  const baixar = (filename: string, content: string, mime: string) => {
    const blob = new Blob(["\ufeff" + content], { type: `${mime};charset=utf-8` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportExcel = () => {
    const header = ["Protocolo", "Solicitante", "CPF", "SIAPE", "Cargo", "UF", "Unidade", "Chefia", "Status", "Abertura", "Decisão"];
    const rows = filtrados.map((s) => [
      s.protocolo, s.solicitanteNome, s.cpf, s.siape, s.cargo, s.uf, s.unidade, s.chefiaNome,
      s.status, new Date(s.dataAbertura).toLocaleString("pt-BR"),
      s.dataDecisao ? new Date(s.dataDecisao).toLocaleString("pt-BR") : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    baixar(`relatorio-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
    toast.success("Arquivo exportado", { description: "Compatível com Excel (.csv)" });
  };

  const exportPDF = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório AGU</title>
      <style>body{font-family:Arial;padding:24px;color:#333}h1{color:#0C326F}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#1351B4;color:#fff}</style></head>
      <body><h1>Portal Magistério AGU — Relatório</h1>
      <p>Gerado em ${new Date().toLocaleString("pt-BR")} • ${filtrados.length} registros</p>
      <table><thead><tr><th>Protocolo</th><th>Solicitante</th><th>Cargo</th><th>UF</th><th>Chefia</th><th>Status</th></tr></thead>
      <tbody>${filtrados.map((s) => `<tr><td>${s.protocolo}</td><td>${s.solicitanteNome}</td><td>${s.cargo}</td><td>${s.uf}</td><td>${s.chefiaNome}</td><td>${s.status}</td></tr>`).join("")}</tbody></table>
      <script>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
    toast.success("Relatório PDF aberto", { description: "Use a janela de impressão para salvar como PDF." });
  };

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Dashboard", to: "/coordenador" },
        { label: "Relatórios" },
      ]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Relatórios e Exportação</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Aplique filtros e exporte os dados consolidados.
        </p>

        <div className="gov-card mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Field label="Data inicial"><input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" /></Field>
          <Field label="Data final"><input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" /></Field>
          <Field label="UF">
            <select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">Todas</option>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="PENDENTE">Em andamento</option>
              <option value="APROVADA">Aprovadas</option>
              <option value="RECUSADA">Recusadas</option>
            </select>
          </Field>
          <Field label="Cargo">
            <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">Todos</option>{CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button type="button" onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-full bg-gov-blue px-5 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel (.xlsx)
          </button>
          <button type="button" onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-full border border-gov-blue px-5 py-2 text-sm font-semibold text-gov-blue hover:bg-accent">
            <FileText className="h-4 w-4" /> Exportar PDF
          </button>
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {filtrados.length} registros no recorte atual
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="gov-card">
            <h2 className="font-display text-base mb-4">Consolidado por chefia</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <Th>Chefia</Th><Th>Aprov.</Th><Th>Rec.</Th><Th>Pend.</Th><Th>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {porChefia.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Sem dados.</td></tr>}
                  {porChefia.map((c) => (
                    <tr key={c.nome} className="border-b border-border last:border-0">
                      <Td>{c.nome}</Td>
                      <Td className="text-gov-success font-semibold">{c.aprov}</Td>
                      <Td className="text-gov-danger font-semibold">{c.rec}</Td>
                      <Td className="text-gov-blue font-semibold">{c.pend}</Td>
                      <Td className="font-semibold">{c.total}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="gov-card">
            <h2 className="font-display text-base mb-4">Consolidado por UF</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <Th>UF</Th><Th>Quantidade</Th><Th>%</Th>
                  </tr>
                </thead>
                <tbody>
                  {porUF.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Sem dados.</td></tr>}
                  {porUF.map((r) => (
                    <tr key={r.uf} className="border-b border-border last:border-0">
                      <Td className="font-semibold">{r.uf}</Td>
                      <Td>{r.qtd}</Td>
                      <Td>{r.pct}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1">
          <Download className="h-3 w-3" /> Acervo completo de chefias: {CHEFIAS.length} cadastradas no diretório institucional.
        </p>
      </section>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold mb-1">{label}</label>{children}</div>;
}
