import Image from 'next/image';
import Link from 'next/link';

interface LogoWithTextProps {
  className?: string;
}

export function LogoWithText({ className = '' }: LogoWithTextProps) {
  return (
    <div className={`relative z-50 ${className}`}>
      {/* Desktop Layout - Logo left, text right */}
      <Link href="/" className="hidden md:flex items-center group">
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
      </Link>

      {/* Mobile Layout - Absolutely centered logo and text */}
      <Link href="/" className="flex md:hidden items-center group fixed top-4 left-0 right-0 justify-center pointer-events-none z-40">
        <div className="flex items-center pointer-events-auto">
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
    </div>
  );
}