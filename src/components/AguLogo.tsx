import logo from "@/assets/agu-logo.png";

interface Props {
  size?: number;
  className?: string;
}

export function AguLogo({ size = 40, className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gov-blue shadow-sm ring-1 ring-gov-blue-dark/20 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Logotipo da Advocacia-Geral da União (AGU)"
      role="img"
    >
      <img
        src={logo}
        alt=""
        className="h-full w-full object-contain"
        style={{ padding: Math.max(2, Math.round(size * 0.08)) }}
      />
    </span>
  );
}
