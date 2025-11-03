'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoWithTextProps {
  className?: string;
}

export function LogoWithText({ className = '' }: LogoWithTextProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide logo when scrolled down
      setIsVisible(window.scrollY === 0);
    };

    const handleSidebarToggle = () => {
      // Check if your specific sidebar is open
      const mobileSidebar = document.getElementById('mobile-sidebar');
      const sidebarOpen = mobileSidebar && !mobileSidebar.classList.contains('-translate-x-full');
      
      if (sidebarOpen) {
        setIsVisible(false); // Hide completely when sidebar opens
      } else if (window.scrollY === 0) {
        setIsVisible(true); // Show only when sidebar closed and at top
      }
    };

    // Listen for scroll
    window.addEventListener('scroll', handleScroll);
    
    // Listen for sidebar state changes
    const observer = new MutationObserver(handleSidebarToggle);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class', 'data-sidebar-open'] 
    });
    
    // Also observe for any sidebar elements being added/removed
    observer.observe(document.documentElement, { 
      childList: true, 
      subtree: true 
    });

    // Initial check
    handleSidebarToggle();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

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
        <span className="text-2xl font-bold tracking-tight text-foreground">
          QuizzViz
        </span>
      </Link>

      {/* Mobile Layout - Absolutely centered logo and text */}
      <Link 
        href="/" 
        className={`flex md:hidden items-center group fixed top-4 left-0 right-0 justify-center pointer-events-none z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center pointer-events-auto">
          <div className="relative h-11 w-11 cursor-pointer">
            <Image 
              src="/QuizzViz-logo.png" 
              alt="QuizzViz Logo" 
              fill
              className="object-contain drop-shadow"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            QuizzViz
          </span>
        </div>
      </Link>
    </div>
  );
}