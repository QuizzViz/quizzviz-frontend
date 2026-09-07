import { ComponentType, FC, SVGProps } from "react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface IconGlowProps {
  icon: LucideIcon;
  size?: string;
  glowSize?: string;
  glow?: boolean;
  active?: boolean;
  strokeWidth?: number;
  className?: string;
}

const IconGlow: FC<IconGlowProps> = ({
  icon: Icon,
  size = "w-6 h-6",
  glowSize = "w-11 h-11",
  glow = true,
  active = true,
  strokeWidth = 1.75,
  className = "",
}) => {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      {glow && (
        <span
          aria-hidden="true"
          className={`absolute rounded-full bg-gradient-to-br from-green-500/30 via-blue-500/25 to-purple-500/25 blur-lg transition-opacity duration-300 ${glowSize} ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <Icon
        className={`relative ${size}`}
        stroke="url(#brand-icon-gradient)"
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </span>
  );
};

export default IconGlow;