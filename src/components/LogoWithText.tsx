import Image from 'next/image';
import Link from 'next/link';

interface LogoWithTextProps {
  className?: string;
}

export function LogoWithText({ className = '' }: LogoWithTextProps) {
  return (
    <Link href="/" className={`flex items-center group relative z-50 ${className}`}>
      {/* Desktop Layout - Logo left, text right */}
      <div className="hidden md:flex items-center">
        <div className="relative h-14 w-14 cursor-pointer">
          <Image 
            src="/QuizzViz-logo.png" 
            alt="QuizzViz Logo" 
            fill
            className="object-contain drop-shadow"
            priority
          />
        </div>
        <span className="ml-3 text-2xl font-bold tracking-tight text-foreground">
          QuizzViz
        </span>
      </div>

      {/* Mobile Layout - Centered logo and text with proper positioning */}
      <div className="flex md:hidden items-center justify-center w-full absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2">
        <div className="relative h-10 w-10 cursor-pointer">
          <Image 
            src="/QuizzViz-logo.png" 
            alt="QuizzViz Logo" 
            fill
            className="object-contain drop-shadow"
            priority
          />
        </div>
        <span className="ml-2 text-xl font-bold tracking-tight text-foreground">
          QuizzViz
        </span>
      </div>
    </Link>
  );
}