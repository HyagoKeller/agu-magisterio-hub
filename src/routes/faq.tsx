import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, HelpCircle, Search } from "lucide-react";
import { AguLogo } from "@/components/AguLogo";
import { useFaq } from "@/lib/faq-store";
import { useAuth, homeForRole } from "@/lib/auth";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Dúvidas Frequentes — Portal Magistério AGU" },
      { name: "description", content: "Perguntas e respostas sobre o Portal Magistério da Advocacia-Geral da União." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const items = useFaq();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const categorias = useMemo(
    () => Array.from(new Set(items.map((i) => i.categoria))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items
      .filter((i) => (cat ? i.categoria === cat : true))
      .filter((i) =>
        !t ||
        i.pergunta.toLowerCase().includes(t) ||
        i.resposta.toLowerCase().includes(t)
      )
      .sort((a, b) => a.ordem - b.ordem || a.pergunta.localeCompare(b.pergunta));
  }, [items, q, cat]);

  const backHref = user ? homeForRole(user.role) : "/";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gov-blue-dark text-white text-xs">
        <div className="gov-container grid h-8 grid-cols-3 items-center">
          <a href="https://www.gov.br" className="font-display font-semibold justify-self-start hover:opacity-90">gov.br</a>
          <span className="justify-self-center font-semibold opacity-90">Advocacia-Geral da União</span>
          <span className="justify-self-end hidden sm:block opacity-90">Portal Magistério</span>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-gov-success via-gov-yellow to-gov-success" aria-hidden="true" />

      <header className="border-b border-border bg-card">
        <div className="gov-container flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <AguLogo size={44} />
            <div>
              <div className="font-display text-base font-semibold leading-tight text-gov-blue-dark">
                Portal Magistério AGU
              </div>
              <div className="text-xs text-muted-foreground">Dúvidas Frequentes (FAQ)</div>
            </div>
          </Link>
          <Link
            to={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" /> {user ? "Voltar ao portal" : "Ir para o login"}
          </Link>
        </div>
      </header>

      <section className="gov-container py-8">
        <div className="flex items-center gap-2 mb-2 text-gov-blue">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Central de Ajuda</span>
        </div>
        <h1 className="font-display text-3xl text-gov-blue-dark">Dúvidas? Acesse nossa FAQ</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Encontre respostas rápidas sobre acesso, abertura de solicitações, recursos e prazos
          do Portal Magistério AGU.
        </p>

        <div className="mt-6 gov-card">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar pergunta ou palavra-chave…"
                className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2.5 text-sm focus:border-gov-blue"
              />
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-md border border-input bg-card px-3 py-2.5 text-sm focus:border-gov-blue"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 && (
            <div className="gov-card text-sm text-muted-foreground">
              Nenhuma dúvida encontrada para sua busca.
            </div>
          )}
          {filtered.map((item) => (
            <details key={item.id} className="gov-card group">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-gov-blue mb-1">
                    {item.categoria}
                  </span>
                  <h2 className="font-display text-base text-gov-blue-dark">{item.pergunta}</h2>
                </div>
                <span aria-hidden className="text-gov-blue text-xl leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="gov-container py-4 text-[11px] text-muted-foreground">
          Coordenação-Geral de Assuntos Administrativos e Universitários — CGAU/AGU
        </div>
      </footer>
    </div>
  );
}
