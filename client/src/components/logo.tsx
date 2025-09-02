import logoPath from "@assets/Gemini_Generated_Image_pvxj0mpvxj0mpvxj_1756831893216.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

export function Logo({ size = "md", animate = false, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  return (
    <div 
      className={`${sizeClasses[size]} relative ${animate ? "logo-3d" : ""} ${className}`}
      data-testid="logo-container"
    >
      <img
        src={logoPath}
        alt="QuizzViz Logo"
        className="w-full h-full object-contain drop-shadow-lg"
        data-testid="logo-image"
      />
    </div>
  );
}
