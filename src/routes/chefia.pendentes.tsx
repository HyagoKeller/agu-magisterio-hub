import { createFileRoute, Link } from "@tanstack/react-router";
import { GovBreadcrumb } from "@/components/GovHeader";
import { useAuth } from "@/lib/auth";
import { useSolicitacoes } from "@/lib/store";

export const Route = createFileRoute("/chefia/pendentes")({
  head: () => ({ meta: [{ title: "Aprovações Pendentes — Portal Magistério AGU" }] }),
  component: Pendentes,
});

function Pendentes() {
  const { user } = useAuth();
  const list = useSolicitacoes()
    .filter((s) => s.chefiaId === user?.id && s.status === "PENDENTE")
    .sort((a, b) => a.dataAbertura.localeCompare(b.dataAbertura));

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Início", to: "/chefia" },
        { label: "Aprovações Pendentes" },
      ]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Solicitações Pendentes</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ordenadas por data — mais antigas primeiro.
        </p>

        <div className="gov-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <Th>Protocolo</Th>
                <Th>Tipo</Th>
                <Th>Solicitante</Th>
                <Th>Cargo</Th>
                <Th>Unidade/UF</Th>
                <Th>Data de Envio</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">
                  Sem pendências no momento. Bom trabalho!
                </td></tr>
              )}
              {list.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <Td><span className="font-semibold text-gov-blue-dark">{s.protocolo}</span></Td>
                  <Td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.tipoSolicitacao === "Correção"
                        ? "bg-[oklch(0.95_0.08_75)] text-[oklch(0.45_0.15_60)]"
                        : "bg-[oklch(0.95_0.04_250)] text-gov-blue-dark"
                    }`}>
                      {s.tipoSolicitacao}
                    </span>
                  </Td>
                  <Td>{s.solicitanteNome}</Td>
                  <Td>{s.cargo}</Td>
                  <Td>{s.unidade} / {s.uf}</Td>
                  <Td>{new Date(s.dataAbertura).toLocaleDateString("pt-BR")}</Td>
                  <Td className="text-right">
                    <Link
                      to="/chefia/analise/$id"
                      params={{ id: s.id }}
                      className="inline-flex rounded-full bg-gov-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-gov-blue-dark"
                    >
                      Analisar
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}
