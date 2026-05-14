import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Clock, FileCheck2, FileX2, FilePlus2, Timer } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/coordenador/")({
  head: () => ({ meta: [{ title: "Dashboard — Coordenação | Portal Magistério AGU" }] }),
  component: DashboardCoord,
});

const CORES = ["oklch(0.45 0.17 257)", "oklch(0.55 0.16 145)", "oklch(0.85 0.18 92)", "oklch(0.52 0.22 27)", "oklch(0.55 0.13 230)"];

function DashboardCoord() {
  const all = useSolicitacoes();

  const stats = useMemo(() => {
    const total = all.length;
    const aprovadas = all.filter((s) => s.status === "APROVADA").length;
    const recusadas = all.filter((s) => s.status === "RECUSADA").length;
    const pendentes = all.filter((s) => s.status === "PENDENTE").length;
    const decididas = all.filter((s) => s.dataDecisao);
    const tempos = decididas.map((s) =>
      (new Date(s.dataDecisao!).getTime() - new Date(s.dataAbertura).getTime()) / 86400000
    );
    const media = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
    return { total, aprovadas, recusadas, pendentes, mediaDias: media, pctA: pct(aprovadas), pctR: pct(recusadas), pctP: pct(pendentes) };
  }, [all]);

  const porUF = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((s) => m.set(s.uf, (m.get(s.uf) || 0) + 1));
    return [...m.entries()]
      .map(([uf, total]) => ({ uf, total }))
      .sort((a, b) => b.total - a.total);
  }, [all]);

  const porCargo = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((s) => m.set(s.cargo, (m.get(s.cargo) || 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [all]);

  const evolucao = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((s) => {
      const d = new Date(s.dataAbertura);
      const semana = `S${Math.ceil(d.getDate() / 7)}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(semana, (m.get(semana) || 0) + 1);
    });
    return [...m.entries()].map(([semana, total]) => ({ semana, total }));
  }, [all]);

  return (
    <>
      <GovBreadcrumb items={[{ label: "Dashboard", to: "/coordenador" }]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Painel de Controle Geral</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Visão consolidada das solicitações de magistério da AGU.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <Kpi label="Total no semestre" value={stats.total} Icon={FilePlus2} />
          <Kpi label="% Aprovadas" value={`${stats.pctA}%`} subtitle={`${stats.aprovadas} solicitações`} Icon={FileCheck2} tone="text-gov-success" />
          <Kpi label="% Recusadas" value={`${stats.pctR}%`} subtitle={`${stats.recusadas} solicitações`} Icon={FileX2} tone="text-gov-danger" />
          <Kpi label="% Pendentes" value={`${stats.pctP}%`} subtitle={`${stats.pendentes} solicitações`} Icon={Clock} tone="text-gov-blue" />
          <Kpi label="Média de aprovação" value={`${stats.mediaDias.toFixed(1)} d`} subtitle="dias úteis aproximados" Icon={Timer} />
        </div>

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

function Kpi({ label, value, subtitle, Icon, tone = "text-gov-blue-dark" }: {
  label: string; value: string | number; subtitle?: string; Icon: React.ComponentType<{ className?: string }>; tone?: string;
}) {
  return (
    <div className="gov-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <div className="mt-2 font-display text-3xl text-gov-blue-dark">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`gov-card ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="font-display text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}
