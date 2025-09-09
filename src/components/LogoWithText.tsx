import Image from 'next/image';
import Link from 'next/link';

interface LogoWithTextProps {
  className?: string;
}

export function LogoWithText({ className = '' }: LogoWithTextProps) {
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <div className="relative h-10 w-16 md:h-14 md:w-14 cursor-pointer">
        <Image 
          src="/QuizzViz-logo.png" 
          alt="QuizzViz Logo" 
          fill
          className="object-contain drop-shadow"
          priority
        />
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground">
        QuizzViz
      </span>
    </Link>
  );
}
