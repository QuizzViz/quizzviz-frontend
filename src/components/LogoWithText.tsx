'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoWithTextProps {
  className?: string;
  showArrow?: boolean;
  onBack?: () => void;
}

export function LogoWithText({ 
  className = '', 
  showArrow = false, 
  onBack 
}: LogoWithTextProps) {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative h-6 w-6 flex-shrink-0">
          <Image 
            src="/QuizzViz-logo.png" 
            alt="QuizzViz Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-lg font-semibold text-white">
          QuizzViz
        </span>
      </Link>
      
      {showArrow && (
        <button 
          onClick={onBack}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}