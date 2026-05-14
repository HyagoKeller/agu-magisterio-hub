import logo from "@/assets/agu-logo.png";

interface Props {
  size?: number;
  className?: string;
}

export function AguLogo({ size = 40, className = "" }: Props) {
  return (
    <img
      src={logo}
      alt="Logotipo da Advocacia-Geral da União (AGU)"
      width={size}
      height={size}
      className={`object-cover rounded-xl shadow-sm ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
