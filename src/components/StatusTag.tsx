import type { SolicitacaoStatus } from "@/lib/types";

const map: Record<SolicitacaoStatus, { label: string; className: string }> = {
  PENDENTE: {
    label: "Em andamento",
    className: "bg-gov-blue-light text-gov-blue-dark border-gov-blue/30",
  },
  APROVADA: {
    label: "Aprovada",
    className: "bg-[oklch(0.94_0.06_145)] text-gov-success border-gov-success/40",
  },
  RECUSADA: {
    label: "Recusada",
    className: "bg-[oklch(0.95_0.05_27)] text-gov-danger border-gov-danger/40",
  },
};

export function StatusTag({ status }: { status: SolicitacaoStatus }) {
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.className}`}
    >
      {m.label}
    </span>
  );
}

export function GovTag({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "success" | "danger" | "warning" | "neutral";
}) {
  const tones = {
    info: "bg-gov-blue-light text-gov-blue-dark border-gov-blue/30",
    success: "bg-[oklch(0.94_0.06_145)] text-gov-success border-gov-success/40",
    danger: "bg-[oklch(0.95_0.05_27)] text-gov-danger border-gov-danger/40",
    warning: "bg-[oklch(0.96_0.1_92)] text-[oklch(0.45_0.13_70)] border-gov-yellow",
    neutral: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
