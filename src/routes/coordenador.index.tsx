import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ChevronDown, ChevronUp, Clock, FileCheck2, FilePlus2, FileX2, GraduationCap, Sun, Timer, X } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { StatusTag } from "@/components/StatusTag";
import { useSolicitacoes } from "@/lib/store";
import {
  DIAS_LABEL, DIAS_SEMANA, FREQUENCIAS, FREQUENCIA_COR, FREQUENCIA_LABEL, FREQUENCIA_PESO,
  TURNOS, TURNOS_LABEL,
  type Solicitacao, type SolicitacaoStatus,
} from "@/lib/types";

export const Route = createFileRoute("/coordenador/")({
  head: () => ({ meta: [{ title: "Dashboard — Coordenação | Portal Magistério AGU" }] }),
  component: DashboardCoord,
});

const CORES = ["oklch(0.45 0.17 257)", "oklch(0.55 0.16 145)", "oklch(0.85 0.18 92)", "oklch(0.52 0.22 27)", "oklch(0.55 0.13 230)"];

type CardKey = "TOTAL" | "APROVADA" | "RECUSADA" | "PENDENTE";

function isoStartOfDay(s: string) { return new Date(`${s}T00:00:00`).getTime(); }
function isoEndOfDay(s: string) { return new Date(`${s}T23:59:59.999`).getTime(); }

function defaultRange(all: { dataAbertura: string }[]) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const hoje = new Date();
  if (!all.length) {
    const ini = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
    return { de: fmt(ini), ate: fmt(hoje) };
  }
  const datas = all.map((s) => new Date(s.dataAbertura).getTime());
  const min = new Date(Math.min(...datas));
  const max = new Date(Math.max(...datas, hoje.getTime()));
  return { de: fmt(min), ate: fmt(max) };
}

function DashboardCoord() {
  const all = useSolicitacoes();
  const { de: deDefault, ate: ateDefault } = useMemo(() => defaultRange(all), [all]);
  const [de, setDe] = useState(deDefault);
  const [ate, setAte] = useState(ateDefault);
  const [expandido, setExpandido] = useState<CardKey | null>(null);

  const filtradas = useMemo(() => {
    const ini = isoStartOfDay(de);
    const fim = isoEndOfDay(ate);
    return all.filter((s) => {
      const t = new Date(s.dataAbertura).getTime();
      return t >= ini && t <= fim;
    });
  }, [all, de, ate]);

  const stats = useMemo(() => {
    const total = filtradas.length;
    const aprovadas = filtradas.filter((s) => s.status === "APROVADA").length;
    const recusadas = filtradas.filter((s) => s.status === "RECUSADA").length;
    const pendentes = filtradas.filter((s) => s.status === "PENDENTE").length;
    const decididas = filtradas.filter((s) => s.dataDecisao);
    const tempos = decididas.map((s) =>
      (new Date(s.dataDecisao!).getTime() - new Date(s.dataAbertura).getTime()) / 86400000
    );
    const media = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
    return { total, aprovadas, recusadas, pendentes, mediaDias: media, pctA: pct(aprovadas), pctR: pct(recusadas), pctP: pct(pendentes) };
  }, [filtradas]);

  const porUF = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.forEach((s) => m.set(s.uf, (m.get(s.uf) || 0) + 1));
    return [...m.entries()].map(([uf, total]) => ({ uf, total })).sort((a, b) => b.total - a.total);
  }, [filtradas]);

  const porCargo = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.forEach((s) => m.set(s.cargo, (m.get(s.cargo) || 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [filtradas]);

  const evolucao = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.forEach((s) => {
      const d = new Date(s.dataAbertura);
      const semana = `S${Math.ceil(d.getDate() / 7)}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(semana, (m.get(semana) || 0) + 1);
    });
    return [...m.entries()].map(([semana, total]) => ({ semana, total }));
  }, [filtradas]);

  // ====== Métricas de magistério (nova grade horária) ======
  const comGrade = useMemo(
    () => filtradas.filter((s) => s.atividades?.grade && Object.keys(s.atividades.grade).length > 0),
    [filtradas]
  );

  const metricasGrade = useMemo(() => {
    const totalDocentes = comGrade.length;
    let somaSemanal = 0;
    let totalCelulas = 0;
    const porTurnoMap = new Map<string, number>();
    const porDiaMap = new Map<string, number>();
    const porFreqMap = new Map<string, number>();
    const heat = new Map<string, number>(); // key: TURNO-DIA -> total horas equivalentes
    const docenteHoras = new Map<string, number>();

    comGrade.forEach((s) => {
      let horasSemanaisDoc = 0;
      Object.entries(s.atividades!.grade!).forEach(([key, cell]) => {
        const [turno, dia] = key.split("-");
        const peso = FREQUENCIA_PESO[cell.frequencia];
        const eq = cell.horas * peso;
        somaSemanal += eq;
        horasSemanaisDoc += eq;
        totalCelulas += 1;
        porTurnoMap.set(turno, (porTurnoMap.get(turno) || 0) + eq);
        porDiaMap.set(dia, (porDiaMap.get(dia) || 0) + eq);
        porFreqMap.set(cell.frequencia, (porFreqMap.get(cell.frequencia) || 0) + 1);
        heat.set(key, (heat.get(key) || 0) + eq);
      });
      docenteHoras.set(s.solicitanteNome, (docenteHoras.get(s.solicitanteNome) || 0) + horasSemanaisDoc);
    });

    const media = totalDocentes ? somaSemanal / totalDocentes : 0;
    const porTurno = TURNOS.map((t) => ({ turno: TURNOS_LABEL[t], horas: Math.round((porTurnoMap.get(t) || 0) * 10) / 10 }));
    const porDia = DIAS_SEMANA.map((d) => ({ dia: DIAS_LABEL[d], horas: Math.round((porDiaMap.get(d) || 0) * 10) / 10 }));
    const porFreq = FREQUENCIAS.map((f) => ({ name: FREQUENCIA_LABEL[f], value: porFreqMap.get(f) || 0, color: FREQUENCIA_COR[f].bg }));
    const topDocentes = [...docenteHoras.entries()]
      .map(([nome, horas]) => ({ nome, horas: Math.round(horas * 10) / 10 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);

    return { totalDocentes, somaSemanal: Math.round(somaSemanal * 10) / 10, media: Math.round(media * 10) / 10, totalCelulas, porTurno, porDia, porFreq, topDocentes, heat };
  }, [comGrade]);

  const listaExpandida = useMemo<Solicitacao[]>(() => {
    if (!expandido) return [];
    const base = expandido === "TOTAL" ? filtradas : filtradas.filter((s) => s.status === expandido);
    return [...base].sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
  }, [expandido, filtradas]);



  return (
    <>
      <GovBreadcrumb items={[{ label: "Dashboard", to: "/coordenador" }]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Painel de Controle Geral</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Visão consolidada das solicitações de magistério da AGU.
        </p>

        <div className="gov-card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="data-de" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">De</label>
              <input id="data-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} max={ate}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue" />
            </div>
            <div>
              <label htmlFor="data-ate" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Até</label>
              <input id="data-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} min={de}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue" />
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {filtradas.length} {filtradas.length === 1 ? "solicitação no período" : "solicitações no período"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <KpiClick k="TOTAL" expandido={expandido} setExpandido={setExpandido}
            label="Total no período" value={stats.total} Icon={FilePlus2} />
          <KpiClick k="APROVADA" expandido={expandido} setExpandido={setExpandido}
            label="% Aprovadas" value={`${stats.pctA}%`} subtitle={`${stats.aprovadas} solicitações`} Icon={FileCheck2} tone="text-gov-success" />
          <KpiClick k="RECUSADA" expandido={expandido} setExpandido={setExpandido}
            label="% Recusadas" value={`${stats.pctR}%`} subtitle={`${stats.recusadas} solicitações`} Icon={FileX2} tone="text-gov-danger" />
          <KpiClick k="PENDENTE" expandido={expandido} setExpandido={setExpandido}
            label="% Pendentes" value={`${stats.pctP}%`} subtitle={`${stats.pendentes} solicitações`} Icon={Clock} tone="text-gov-blue" />
          <div className="gov-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Média de aprovação</span>
              <Timer className="h-5 w-5 text-gov-blue-dark" />
            </div>
            <div className="mt-2 font-display text-3xl text-gov-blue-dark">{stats.mediaDias.toFixed(1)} d</div>
            <div className="mt-0.5 text-xs text-muted-foreground">dias úteis aproximados</div>
          </div>
        </div>

        {expandido && (
          <div className="gov-card mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">
                {expandido === "TOTAL" && "Todas as solicitações do período"}
                {expandido === "APROVADA" && "Solicitações aprovadas"}
                {expandido === "RECUSADA" && "Solicitações recusadas"}
                {expandido === "PENDENTE" && "Solicitações pendentes"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({listaExpandida.length})</span>
              </h2>
              <button onClick={() => setExpandido(null)} aria-label="Fechar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gov-blue-dark hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <Th>Protocolo</Th>
                    <Th>Solicitante</Th>
                    <Th>UF / Unidade</Th>
                    <Th>Abertura</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {listaExpandida.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
                  )}
                  {listaExpandida.slice(0, 50).map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                      <Td>{s.solicitanteNome}</Td>
                      <Td className="text-xs">{s.uf} • {s.unidade}</Td>
                      <Td className="text-xs">{new Date(s.dataAbertura).toLocaleDateString("pt-BR")}</Td>
                      <Td><StatusTag status={s.status as SolicitacaoStatus} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listaExpandida.length > 50 && (
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  Mostrando 50 de {listaExpandida.length}. <Link to="/coordenador/todas" className="font-semibold text-gov-blue hover:underline">Ver todas →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Solicitações por UF">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porUF}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="uf" stroke="oklch(0.4 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.4 0 0)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="oklch(0.45 0.17 257)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribuição por cargo">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={porCargo} dataKey="value" nameKey="name" outerRadius={90} label>
                  {porCargo.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Evolução temporal (por semana)" full>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="semana" stroke="oklch(0.4 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.4 0 0)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="oklch(0.52 0.22 27)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>
    </>
  );
}

function KpiClick({ k, expandido, setExpandido, label, value, subtitle, Icon, tone = "text-gov-blue-dark" }: {
  k: CardKey; expandido: CardKey | null; setExpandido: (v: CardKey | null) => void;
  label: string; value: string | number; subtitle?: string; Icon: React.ComponentType<{ className?: string }>; tone?: string;
}) {
  const ativo = expandido === k;
  return (
    <button
      type="button"
      onClick={() => setExpandido(ativo ? null : k)}
      aria-expanded={ativo}
      className={`gov-card text-left transition hover:shadow-md hover:-translate-y-0.5 ${ativo ? "ring-2 ring-gov-blue" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <div className="mt-2 font-display text-3xl text-gov-blue-dark">{value}</div>
      <div className="mt-0.5 flex items-center justify-between">
        {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : <span />}
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gov-blue">
          {ativo ? "Recolher" : "Expandir"} {ativo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </div>
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`gov-card ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="font-display text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}
