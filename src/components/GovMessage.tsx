import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Tone = "info" | "success" | "warning" | "danger";

const map = {
  info: { Icon: Info, cls: "border-gov-blue/40 bg-gov-blue-light text-gov-blue-dark" },
  success: { Icon: CheckCircle2, cls: "border-gov-success/40 bg-[oklch(0.94_0.06_145)] text-gov-success" },
  warning: { Icon: AlertTriangle, cls: "border-gov-yellow bg-[oklch(0.96_0.1_92)] text-[oklch(0.4_0.12_70)]" },
  danger: { Icon: AlertCircle, cls: "border-gov-danger/40 bg-[oklch(0.95_0.05_27)] text-gov-danger" },
};

export function GovMessage({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
}) {
  const { Icon, cls } = map[tone];
  return (
    <div role="status" className={`flex gap-3 rounded-md border-l-4 px-4 py-3 ${cls}`}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
}
