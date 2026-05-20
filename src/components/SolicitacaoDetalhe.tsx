import { GovMessage } from "@/components/GovMessage";
import { StatusTag } from "@/components/StatusTag";
import { HorariosGrid, ResumoGrade, type Grade } from "@/components/HorariosGrid";
import type { Solicitacao } from "@/lib/types";
import { useSolicitacoes } from "@/lib/store";

interface Props {
  s: Solicitacao;
  /** Quando false, oculta o histórico (útil em modais compactos). Default true. */
  showHistorico?: boolean;
  /** Quando false, oculta o bloco de recurso (default true). */
  showRecurso?: boolean;
}

export function SolicitacaoDetalhe({ s, showHistorico = true, showRecurso = true }: Props) {
  const all = useSolicitacoes();
  const original =
    s.tipoSolicitacao === "Correção" && s.protocoloOriginal
      ? all.find((x) => x.protocolo === s.protocoloOriginal)
      : null;

  const camposComparaveis: { label: string; novo?: string; antigo?: string }[] = original
    ? [
        { label: "CPF", novo: s.cpf, antigo: original.cpf },
        { label: "SIAPE", novo: s.siape, antigo: original.siape },
        {
          label: "OAB",
          novo: [s.oabNumero, s.oabUf].filter(Boolean).join(" / ") || "—",
          antigo: [original.oabNumero, original.oabUf].filter(Boolean).join(" / ") || "—",
        },
        { label: "Cargo", novo: s.cargo, antigo: original.cargo },
        { label: "UF", novo: s.uf, antigo: original.uf },
        { label: "Unidade", novo: s.unidade, antigo: original.unidade },
        { label: "Chefia", novo: s.chefiaNome, antigo: original.chefiaNome },
        { label: "E-mail Chefia", novo: s.chefiaEmail || "—", antigo: original.chefiaEmail || "—" },
        { label: "Formação", novo: s.formacao || "—", antigo: original.formacao || "—" },
      ]
    : [];
  const alterados = camposComparaveis.filter((c) => (c.novo || "") !== (c.antigo || ""));

  return (
    <div className="space-y-6">
      {/* Cabeçalho com tags e datas */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusTag status={s.status} />
        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {s.tipoSolicitacao}
        </span>
        <span className="text-xs text-muted-foreground">
          Aberta em {new Date(s.dataAbertura).toLocaleString("pt-BR")}
        </span>
        {s.dataDecisao && (
          <span className="text-xs text-muted-foreground">
            • Decidida em {new Date(s.dataDecisao).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {/* Mensagens de status */}
      {s.status === "RECUSADA" && s.justificativaRecusa && (
        <GovMessage tone="danger" title="Justificativa da recusa">
          {s.justificativaRecusa}
        </GovMessage>
      )}
      {s.status === "APROVADA" && s.decisaoComentario && (
        <GovMessage tone="success" title="Comentário da aprovação">
          {s.decisaoComentario}
        </GovMessage>
      )}

      {/* Bloco específico da Correção */}
      {s.tipoSolicitacao === "Correção" && (
        <section className="rounded-md border-2 border-gov-warning/40 bg-[oklch(0.98_0.04_85)] p-4">
          <h3 className="font-display text-base text-gov-blue-dark mb-1">
            Correção referente ao protocolo {s.protocoloOriginal ?? "—"}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {s.descricaoCorrecao || "Sem descrição informada pelo solicitante."}
          </p>

          {original ? (
            alterados.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border bg-card">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-semibold">Campo</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Valor anterior</th>
                      <th className="px-3 py-2 font-semibold text-gov-blue-dark">Valor proposto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alterados.map((c) => (
                      <tr key={c.label} className="border-t border-border">
                        <td className="px-3 py-2 font-semibold">{c.label}</td>
                        <td className="px-3 py-2 text-muted-foreground line-through">{c.antigo || "—"}</td>
                        <td className="px-3 py-2 font-semibold text-gov-blue-dark">{c.novo || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma diferença detectada nos dados cadastrais — verifique atividades de ensino abaixo.
              </p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Protocolo original não localizado neste ambiente.
            </p>
          )}
        </section>
      )}

      {/* Dados do servidor */}
      <section>
        <h3 className="mb-3 font-display text-base text-gov-blue-dark">Dados do servidor</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Info label="Solicitante" value={s.solicitanteNome} full />
          <Info label="CPF" value={s.cpf} />
          <Info label="SIAPE" value={s.siape} />
          <Info label="OAB" value={[s.oabNumero, s.oabUf].filter(Boolean).join(" / ") || "—"} />
          <Info label="Cargo" value={s.cargo} full />
          <Info label="UF" value={s.uf} />
          <Info label="Unidade/Equipe" value={s.unidade} />
          <Info label="Formação acadêmica" value={s.formacao || "—"} />
          <Info label="Semestre" value={s.semestre} />
          <Info label="Protocolo" value={s.protocolo} />
        </dl>
      </section>

      {/* Chefia */}
      <section>
        <h3 className="mb-3 font-display text-base text-gov-blue-dark">Chefia imediata</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Info label="Nome" value={s.chefiaNome} full />
          <Info label="E-mail" value={s.chefiaEmail || "—"} full />
        </dl>
      </section>

      {/* Atividades de Ensino */}
      {s.atividades && (
        <section>
          <h3 className="mb-3 font-display text-base text-gov-blue-dark">Atividades de Ensino</h3>

          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Horários das disciplinas
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-1.5"></th>
                    {DIAS_SEMANA.map((d) => (
                      <th key={d} className="px-2 py-1.5 font-semibold text-muted-foreground">{DIAS_LABEL[d]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TURNOS.map((t) => (
                    <tr key={t} className="border-t border-border">
                      <th className="px-2 py-2 text-left font-semibold text-gov-blue-dark">{TURNOS_LABEL[t]}</th>
                      {DIAS_SEMANA.map((d) => {
                        const marcado = !!s.atividades?.horarios?.[`${t}-${d}`];
                        return (
                          <td key={d} className="px-2 py-2 text-center">
                            {marcado ? (
                              <span className="inline-block h-3 w-3 rounded-sm bg-gov-blue" aria-label="ocupado" />
                            ) : (
                              <span className="text-muted-foreground/40">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <dl className="grid gap-3">
            <Info label="Disciplinas ministradas (Art. 2º; I, V, VI) e Projetos de Extensão"
              value={s.atividades.disciplinas || "—"} full />
            <Info label="Elaboração de Projeto Pedagógico (Art. 2º, II)"
              value={s.atividades.projetoPedagogico || "—"} full />
            <Info label="Material Didático/Programa de Ensino (Art. 2º, III) e Projetos de Pesquisa"
              value={s.atividades.material || "—"} full />
            <Info label="Elaboração de Avaliações, Provas, Simulados e Afins (Art. 2º, IV)"
              value={s.atividades.avaliacoes || "—"} full />
          </dl>

          <div className="mt-4 rounded-md border border-gov-blue/20 bg-[oklch(0.98_0.02_250)] p-3 text-xs">
            <div className="font-semibold text-gov-blue-dark mb-1.5">Declarações de boa-fé</div>
            <ul className="space-y-1">
              <Declar ok={s.atividades.declaracaoLeu} texto="Leu a Portaria Interministerial AGU/MF/BACEN Nº 1/2020." />
              <Declar ok={s.atividades.declaracaoVerdade} texto="Declara a veracidade da carga-horária informada." />
              <Declar ok={s.atividades.declaracaoCiente} texto="Ciente que a autorização vale apenas para o semestre atual." />
            </ul>
          </div>
        </section>
      )}

      {/* Recurso */}
      {showRecurso && s.recurso && (
        <GovMessage
          tone={s.recurso.status === "ACEITO" ? "success" : s.recurso.status === "REJEITADO" ? "danger" : "info"}
          title={`Recurso ${s.recurso.status.toLowerCase()}`}
        >
          <div className="text-xs mb-1">
            Protocolado em {new Date(s.recurso.dataSolicitacao).toLocaleString("pt-BR")}
          </div>
          <div className="whitespace-pre-wrap text-sm">{s.recurso.texto}</div>
          {s.recurso.decisaoComentario && (
            <div className="mt-2 border-t border-border/50 pt-2 text-xs">
              <strong>Decisão{s.recurso.decididoPor ? ` por ${s.recurso.decididoPor}` : ""}:</strong>{" "}
              {s.recurso.decisaoComentario}
            </div>
          )}
        </GovMessage>
      )}

      {/* Histórico */}
      {showHistorico && (
        <section>
          <h3 className="mb-2 font-display text-base text-gov-blue-dark">Histórico de movimentações</h3>
          <ol className="space-y-3 border-l-2 border-gov-blue/30 pl-4">
            {s.historico.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-gov-blue" />
                <div className="text-sm font-semibold text-gov-blue-dark">{h.evento}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.data).toLocaleString("pt-BR")} • {h.autor}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 sm:col-span-3" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function Declar({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white ${
          ok ? "bg-gov-success" : "bg-gov-danger"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{texto}</span>
    </li>
  );
}
