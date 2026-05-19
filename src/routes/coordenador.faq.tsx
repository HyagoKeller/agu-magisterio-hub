import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GovBreadcrumb } from "@/components/GovHeader";
import { GovMessage } from "@/components/GovMessage";
import { faqStore, useFaq, type FaqItem } from "@/lib/faq-store";

export const Route = createFileRoute("/coordenador/faq")({
  head: () => ({ meta: [{ title: "Gestão da FAQ — Portal Magistério AGU" }] }),
  component: GestaoFaq,
});

const EMPTY = { pergunta: "", resposta: "", categoria: "Geral", ordem: 1 };

function GestaoFaq() {
  const items = useFaq();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [draft, setDraft] = useState<typeof EMPTY>(EMPTY);

  const salvar = () => {
    if (draft.pergunta.trim().length < 5 || draft.resposta.trim().length < 10) {
      toast.error("Informe pergunta (≥5 caracteres) e resposta (≥10 caracteres).");
      return;
    }
    if (editing) {
      faqStore.update(editing.id, draft);
      toast.success("Pergunta atualizada.");
    } else {
      faqStore.add(draft);
      toast.success("Pergunta adicionada à FAQ.");
    }
    setEditing(null);
    setDraft(EMPTY);
  };

  const editar = (item: FaqItem) => {
    setEditing(item);
    setDraft({
      pergunta: item.pergunta,
      resposta: item.resposta,
      categoria: item.categoria,
      ordem: item.ordem,
    });
  };

  const remover = (item: FaqItem) => {
    if (!confirm(`Excluir a pergunta "${item.pergunta}"?`)) return;
    faqStore.remove(item.id);
    toast.success("Pergunta removida.");
    if (editing?.id === item.id) {
      setEditing(null);
      setDraft(EMPTY);
    }
  };

  return (
    <>
      <GovBreadcrumb items={[
        { label: "Dashboard", to: "/coordenador" },
        { label: "Gestão da FAQ" },
      ]} />
      <section className="gov-container pb-10">
        <h1 className="font-display text-2xl mb-1">Gestão da FAQ</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Inclua, edite e remova as Dúvidas Frequentes exibidas em <code>/faq</code> (dentro e fora do portal).
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="gov-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <Th>Ordem</Th><Th>Categoria</Th><Th>Pergunta</Th><Th>Atualizada</Th><Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma pergunta cadastrada.</td></tr>
                )}
                {[...items].sort((a, b) => a.ordem - b.ordem).map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <Td>{i.ordem}</Td>
                    <Td><span className="rounded-full bg-gov-blue-light px-2 py-0.5 text-[11px] font-semibold text-gov-blue-dark">{i.categoria}</span></Td>
                    <Td className="max-w-md">{i.pergunta}</Td>
                    <Td className="text-xs">{new Date(i.atualizadoEm).toLocaleDateString("pt-BR")}</Td>
                    <Td className="text-right">
                      <button onClick={() => editar(i)} className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-gov-blue hover:underline">
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button onClick={() => remover(i)} className="inline-flex items-center gap-1 text-xs font-semibold text-gov-danger hover:underline">
                        <Trash2 className="h-3 w-3" /> Excluir
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="gov-card h-fit">
            <h2 className="font-display text-lg mb-3">
              {editing ? "Editar pergunta" : "Nova pergunta"}
            </h2>
            {editing && (
              <div className="mb-3">
                <GovMessage tone="info">Editando pergunta existente.</GovMessage>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Categoria</label>
                <input value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} className={inp} placeholder="Ex.: Acesso, Recurso, Prazos" />
              </div>
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Pergunta</label>
                  <input value={draft.pergunta} onChange={(e) => setDraft({ ...draft, pergunta: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Ordem</label>
                  <input type="number" min={1} value={draft.ordem} onChange={(e) => setDraft({ ...draft, ordem: Number(e.target.value) || 1 })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Resposta</label>
                <textarea rows={5} value={draft.resposta} onChange={(e) => setDraft({ ...draft, resposta: e.target.value })} className={inp} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {editing && (
                  <button onClick={() => { setEditing(null); setDraft(EMPTY); }} className="rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-accent">
                    Cancelar
                  </button>
                )}
                <button onClick={salvar} className="inline-flex items-center gap-2 rounded-full bg-gov-blue px-4 py-2 text-sm font-semibold text-white hover:bg-gov-blue-dark">
                  <Plus className="h-4 w-4" /> {editing ? "Salvar alterações" : "Adicionar"}
                </button>
              </div>
            </div>
          </aside>
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

const inp = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-gov-blue";
