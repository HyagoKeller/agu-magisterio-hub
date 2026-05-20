import { useState } from "react";
import { X } from "lucide-react";
import {
  DIAS_LABEL,
  DIAS_SEMANA,
  FREQUENCIA_COR,
  FREQUENCIA_LABEL,
  FREQUENCIA_PESO,
  FREQUENCIAS,
  TURNOS,
  TURNOS_LABEL,
  type Frequencia,
  type HorarioCelula,
} from "@/lib/types";

export type Grade = Record<string, HorarioCelula>;

interface Props {
  value: Grade;
  onChange?: (g: Grade) => void;
  readOnly?: boolean;
  /** Limites do semestre da declaração — vigência não pode ultrapassar. */
  semestreInicio?: string; // ISO YYYY-MM-DD
  semestreFim?: string;    // ISO YYYY-MM-DD
}

export function HorariosGrid({ value, onChange, readOnly = false, semestreInicio, semestreFim }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  const setCell = (key: string, cell: HorarioCelula | null) => {
    if (!onChange) return;
    const next = { ...value };
    if (cell === null) delete next[key];
    else next[key] = cell;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Turno</th>
              {DIAS_SEMANA.map((d) => (
                <th key={d} className="px-2 py-2 font-semibold text-muted-foreground">{DIAS_LABEL[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TURNOS.map((t) => (
              <tr key={t} className="border-t border-border">
                <th className="px-3 py-2 text-left font-semibold text-gov-blue-dark">{TURNOS_LABEL[t]}</th>
                {DIAS_SEMANA.map((d) => {
                  const key = `${t}-${d}`;
                  const cell = value[key];
                  return (
                    <td key={d} className="px-1.5 py-1.5 text-center align-middle">
                      {cell ? (
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => !readOnly && setEditing(key)}
                          className="group inline-flex flex-col items-center justify-center min-w-[88px] rounded-md px-2 py-1.5 text-[11px] font-semibold leading-tight shadow-sm"
                          style={{ background: FREQUENCIA_COR[cell.frequencia].bg, color: FREQUENCIA_COR[cell.frequencia].fg }}
                          aria-label={`${cell.horas}h ${FREQUENCIA_LABEL[cell.frequencia]}${cell.inicio ? ` das ${cell.inicio} às ${cell.fim}` : ""}${cell.dataInicio ? ` vigência ${cell.dataInicio} a ${cell.dataFim ?? ""}` : ""}`}
                        >
                          <span className="text-sm font-bold">{formatHoras(cell.horas)}h</span>
                          {cell.inicio && cell.fim && (
                            <span className="opacity-95 text-[10px] tabular-nums">{cell.inicio}–{cell.fim}</span>
                          )}
                          <span className="opacity-90">{FREQUENCIA_LABEL[cell.frequencia]}</span>
                          {(cell.dataInicio || cell.dataFim) && (
                            <span className="mt-0.5 opacity-90 text-[9px] tabular-nums">
                              {formatDateBR(cell.dataInicio)}→{formatDateBR(cell.dataFim)}
                            </span>
                          )}
                        </button>
                      ) : readOnly ? (
                        <span className="text-muted-foreground/40">·</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(key)}
                          className="inline-flex h-9 min-w-[48px] items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:border-gov-blue hover:bg-accent hover:text-gov-blue-dark"
                          aria-label="Adicionar horário"
                        >
                          +
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="font-semibold text-muted-foreground">Frequência:</span>
        {FREQUENCIAS.map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: FREQUENCIA_COR[f].bg }} />
            {FREQUENCIA_LABEL[f]}
          </span>
        ))}
      </div>

      {editing && !readOnly && (
        <CellEditor
          initial={value[editing]}
          onCancel={() => setEditing(null)}
          onSave={(c) => { setCell(editing, c); setEditing(null); }}
          onRemove={value[editing] ? () => { setCell(editing, null); setEditing(null); } : undefined}
          title={cellTitle(editing)}
        />
      )}
    </div>
  );
}

function cellTitle(key: string) {
  const [t, d] = key.split("-") as [keyof typeof TURNOS_LABEL, keyof typeof DIAS_LABEL];
  return `${TURNOS_LABEL[t]} • ${DIAS_LABEL[d]}`;
}

function formatHoras(h: number) {
  return Number.isInteger(h) ? String(h) : h.toFixed(1).replace(".", ",");
}

function formatDateBR(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function computeHoras(inicio: string, fim: string): number | null {
  if (!inicio || !fim) return null;
  const diff = timeToMinutes(fim) - timeToMinutes(inicio);
  if (diff <= 0) return null;
  return Math.round((diff / 60) * 2) / 2; // arredonda em 0,5
}

function CellEditor({
  initial, onSave, onCancel, onRemove, title,
}: {
  initial?: HorarioCelula;
  onSave: (c: HorarioCelula) => void;
  onCancel: () => void;
  onRemove?: () => void;
  title: string;
}) {
  const [inicio, setInicio] = useState<string>(initial?.inicio ?? "");
  const [fim, setFim] = useState<string>(initial?.fim ?? "");
  const [dataInicio, setDataInicio] = useState<string>(initial?.dataInicio ?? "");
  const [dataFim, setDataFim] = useState<string>(initial?.dataFim ?? "");
  const [horas, setHoras] = useState<string>(initial ? String(initial.horas) : "");
  const [horasTouched, setHorasTouched] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>(initial?.frequencia ?? "SEMANAL");
  const [obs, setObs] = useState(initial?.observacao ?? "");

  // Calcula horas automaticamente a partir de início/fim (se o usuário não tiver editado manualmente)
  const horasCalculadas = computeHoras(inicio, fim);
  const horasEfetivas = horasTouched || !horasCalculadas ? horas : String(horasCalculadas);

  const vigenciaInvalida = !!dataInicio && !!dataFim && dataFim < dataInicio;

  const submit = () => {
    if (!inicio || !fim) return;
    if (timeToMinutes(fim) <= timeToMinutes(inicio)) return;
    if (vigenciaInvalida) return;
    const h = Number((horasEfetivas || "0").replace(",", "."));
    if (!Number.isFinite(h) || h <= 0 || h > 24) return;
    onSave({
      horas: h, frequencia,
      inicio, fim,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      observacao: obs.trim() || undefined,
    });
  };

  const intervaloInvalido = !!inicio && !!fim && timeToMinutes(fim) <= timeToMinutes(inicio);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base text-gov-blue-dark">{title}</h3>
          <button onClick={onCancel} aria-label="Fechar" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Início</label>
              <input
                type="time" value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fim</label>
              <input
                type="time" value={fim}
                onChange={(e) => setFim(e.target.value)}
                className={`w-full rounded-md border bg-card px-3 py-2 text-sm focus:border-gov-blue tabular-nums ${intervaloInvalido ? "border-gov-danger" : "border-input"}`}
              />
            </div>
          </div>
          {intervaloInvalido && (
            <p className="text-[11px] font-semibold text-gov-danger">O horário de fim deve ser maior que o de início.</p>
          )}

          <div className="rounded-md border border-border bg-muted/30 p-2.5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vigência da atividade <span className="font-normal normal-case">— pode ultrapassar o semestre da declaração</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Data de início</label>
                <input
                  type="date" value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Data de fim</label>
                <input
                  type="date" value={dataFim} min={dataInicio || undefined}
                  onChange={(e) => setDataFim(e.target.value)}
                  className={`w-full rounded-md border bg-card px-3 py-2 text-sm focus:border-gov-blue tabular-nums ${vigenciaInvalida ? "border-gov-danger" : "border-input"}`}
                />
              </div>
            </div>
            {vigenciaInvalida && (
              <p className="mt-1.5 text-[11px] font-semibold text-gov-danger">A data de fim deve ser igual ou posterior à data de início.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Carga horária (h) <span className="font-normal text-muted-foreground">— calculada automaticamente</span>
            </label>
            <input
              type="number" step="0.5" min={0.5} max={24}
              value={horasEfetivas}
              onChange={(e) => { setHorasTouched(true); setHoras(e.target.value); }}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Frequência</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIAS.map((f) => (
                <button
                  type="button" key={f}
                  onClick={() => setFrequencia(f)}
                  className={`rounded-md border-2 px-2 py-1.5 text-xs font-semibold transition ${
                    frequencia === f ? "border-transparent text-white shadow-sm" : "border-border bg-card text-muted-foreground hover:border-gov-blue"
                  }`}
                  style={frequencia === f ? { background: FREQUENCIA_COR[f].bg, color: FREQUENCIA_COR[f].fg } : undefined}
                >
                  {FREQUENCIA_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Observação (opcional)</label>
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex.: aulas eventuais, troca de turno…"
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {onRemove ? (
            <button onClick={onRemove} className="rounded-full border border-gov-danger px-3 py-1.5 text-xs font-semibold text-gov-danger hover:bg-gov-danger hover:text-white">
              Remover
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-accent">Cancelar</button>
            <button onClick={submit} className="rounded-full bg-gov-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-gov-blue-dark">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResumoGrade({ grade }: { grade: Grade }) {
  const entries = Object.values(grade);
  const totalSemanal = entries.reduce((sum, c) => sum + c.horas * FREQUENCIA_PESO[c.frequencia], 0);
  const diasUnicos = new Set(Object.keys(grade).map((k) => k.split("-")[1])).size;
  const variaveis = entries.filter((c) => c.frequencia === "VARIAVEL").length;

  const datasInicio = entries.map((c) => c.dataInicio).filter(Boolean) as string[];
  const datasFim = entries.map((c) => c.dataFim).filter(Boolean) as string[];
  const inicioMin = datasInicio.length ? datasInicio.sort()[0] : undefined;
  const fimMax = datasFim.length ? datasFim.sort().slice(-1)[0] : undefined;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gov-blue-dark">
        📊 Resumo do Período
      </div>
      <dl className="space-y-2 text-sm">
        <Row label="Total de horas semanais" value={`${formatHoras(totalSemanal)}h`} highlight />
        <Row label="Dias da semana com atividades" value={`${diasUnicos} ${diasUnicos === 1 ? "dia" : "dias"}`} />
        <Row label="Atividades com frequência variável" value={`${variaveis} ${variaveis === 1 ? "registro" : "registros"}`} />
        {(inicioMin || fimMax) && (
          <Row
            label="Vigência consolidada"
            value={`${formatDateBR(inicioMin)} → ${formatDateBR(fimMax)}`}
          />
        )}
      </dl>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${highlight ? "text-gov-blue-dark text-base" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}
