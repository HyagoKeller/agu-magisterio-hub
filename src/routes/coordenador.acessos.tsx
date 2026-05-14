import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { GovBreadcrumb } from "@/components/GovHeader";
import { requestsStore, useAccessRequests, usersStore } from "@/lib/admin-store";
import { useAuth } from "@/lib/auth";
import type { AccessRequest } from "@/lib/types";

export const Route = createFileRoute("/coordenador/acessos")({
  component: AcessosCoord,
});

function AcessosCoord() {
  const reqs = useAccessRequests();
  const { user } = useAuth();
  const [aba, setAba] = useState<"PENDENTE" | "APROVADO" | "RECUSADO">("PENDENTE");
  const lista = reqs.filter((r) => r.status === aba);

  const aprovar = (r: AccessRequest) => {
    usersStore.add({
      id: `acc-${r.id}`,
      nome: r.nome,
      email: r.emailInstitucional || r.emailPessoal,
      emailPessoal: r.emailPessoal,
      role: r.perfilSolicitado,
      origem: "MANUAL",
      ativo: true,
    });
    requestsStore.decide(r.id, "APROVADO", user?.nome || "Coordenação");
    toast.success(`Acesso concedido a ${r.nome}.`);
  };

  const recusar = (r: AccessRequest) => {
    const motivo = prompt("Motivo da recusa:") || "Não atende aos critérios.";
    requestsStore.decide(r.id, "RECUSADO", user?.nome || "Coordenação", motivo);
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Início", to: "/coordenador" }, { label: "Solicitações de Acesso" }]} />
      <section className="gov-container pb-12">
        <h1 className="font-display text-2xl mb-1">Validação de Acessos Externos</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Pedidos de acesso de quem ainda não está no AD. A Coordenação ou o RH valida e o usuário recebe credenciais por e-mail.
        </p>

        <div className="flex gap-1 border-b border-border mb-4">
          {(["PENDENTE", "APROVADO", "RECUSADO"] as const).map((s) => (
            <button key={s} onClick={() => setAba(s)} className={`px-4 py-2 text-sm font-semibold border-b-[3px] -mb-px ${aba === s ? "border-gov-blue text-gov-blue" : "border-transparent text-muted-foreground hover:text-gov-blue"}`}>
              {s === "PENDENTE" ? "Pendentes" : s === "APROVADO" ? "Aprovadas" : "Recusadas"} ({reqs.filter((r) => r.status === s).length})
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {lista.map((r) => (
            <article key={r.id} className="gov-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gov-blue-dark">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">CPF {r.cpf} · {new Date(r.dataSolicitacao).toLocaleDateString("pt-BR")}</div>
                </div>
                <span className="inline-flex rounded-full bg-gov-blue-light px-2.5 py-0.5 text-xs font-semibold text-gov-blue">{r.perfilSolicitado}</span>
              </div>
              <div className="mt-3 grid gap-1 text-sm md:grid-cols-2">
                <div><span className="text-muted-foreground">E-mail pessoal:</span> {r.emailPessoal}</div>
                {r.emailInstitucional && <div><span className="text-muted-foreground">E-mail institucional:</span> {r.emailInstitucional}</div>}
                <div><span className="text-muted-foreground">Cargo:</span> {r.cargoPretendido}</div>
                {r.unidade && <div><span className="text-muted-foreground">Unidade:</span> {r.unidade}</div>}
              </div>
              <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">{r.justificativa}</p>
              {r.status === "PENDENTE" && (
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => recusar(r)} className="inline-flex items-center gap-1 rounded-full border border-gov-red px-4 py-2 text-sm font-semibold text-gov-red"><X className="h-4 w-4" /> Recusar</button>
                  <button onClick={() => aprovar(r)} className="inline-flex items-center gap-1 rounded-full bg-gov-success px-4 py-2 text-sm font-semibold text-white"><Check className="h-4 w-4" /> Aprovar</button>
                </div>
              )}
            </article>
          ))}
          {lista.length === 0 && <div className="gov-card text-center text-muted-foreground">Nenhuma solicitação nesta aba.</div>}
        </div>
      </section>
    </>
  );
}
