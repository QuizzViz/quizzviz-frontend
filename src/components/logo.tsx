
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

export function Logo({ size = "md", animate = false, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-44 h-44"
  };

  return (
    <div 
      className={`${sizeClasses[size]} relative ${animate ? "logo-3d" : ""} ${className}`}
      data-testid="logo-container"
    >
      <img
        src={'/QuizzViz-Logo.png'}
        alt="QuizzViz Logo"
        className="w-full h-full object-contain drop-shadow-lg"
        data-testid="logo-image"
      />
    </div>
  );
}
