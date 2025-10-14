"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      }`}
      data-testid="navbar"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => scrollToSection("hero")}
            data-testid="logo-brand"
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-y-1.5"> {/* Increased gap for better spacing */}
                <img 
                  src="/QuizzViz-logo.png" 
                  alt="QuizzViz Logo" 
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain self-center" // Larger size to match text height, self-center for precise vertical alignment
                />
                <span className="text-xl sm:text-2xl font-semibold text-foreground leading-none">QuizzViz</span> {/* Added leading-none to tighten line-height and align baseline */}
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center text-sm whitespace-nowrap">
            <div className="flex items-center gap-6 lg:gap-8 xl:gap-10">
              <Link href="/mission"><button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Mission
              </button></Link>
              <Link href="/pricing"><button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Pricing
              </button></Link>
              <Link href="/contact"><button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Contact
              </button></Link>
              <Link href="/dashboard"><button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Dashboard
              </button></Link>
            </div>
            <div className="hidden md:flex items-center gap-6 lg:gap-8 ml-6 md:ml-10 lg:ml-16 xl:ml-24">
             <Link href="https://calendly.com/syedshahmirsultan/new-meeting"><Button 
                className="bg-white text-black hover:bg-gray-200 hover:translate-x-1 transition-all duration-150 font-medium"
              >
                Book a Demo <ArrowRight className=" w-9 h-5" />
              </Button></Link>
              <div className="flex items-center gap-4">
                <Link href="/signin"><button 
                  className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                  data-testid="link-login"
                >
                  Login
                </button></Link>
                <Link href="/signup"><button 
                  className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                  data-testid="link-signup"
                >
                  Sign up
                </button></Link>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden glassmorphism rounded-lg mt-2 py-3" data-testid="mobile-menu">
            <div className="flex flex-col divide-y divide-border/50">
              <div className="flex flex-col py-2">
               <Link href="/mission"> <button className="px-4 py-2 text-left text-white hover:text-gray-200" data-testid="mobile-link-about">Mission</button></Link>
               <Link href="/pricing"><button className="px-4 py-2 text-left text-white hover:text-gray-200">Pricing</button></Link>
               <Link href="/contact"><button className="px-4 py-2 text-left text-white hover:text-gray-200">Contact Us</button></Link>
               <Link href="/dashboard"><button className="px-4 py-2 text-left text-white hover:text-gray-200">Dashboard</button></Link>
              </div>
              <div className="flex flex-col py-2">
                <Link href="https://calendly.com/syedshahmirsultan/new-meeting">
                <Button className="mx-4 my-1 w-[85%] h-[40%] bg-white text-black hover:bg-gray-200 font-medium hover:translate-x-2 duration-150">
                  Book a Demo <ArrowRight className="ml-2" />
                </Button></Link>
                <div className="flex items-center justify-between px-4 pt-2">
                  <Link href="/signin"><button  className="text-white hover:text-gray-200" data-testid="mobile-link-login">Login</button></Link>
                  <Link href="/signup"><button  className="text-white hover:text-gray-200" data-testid="mobile-link-signup">Sign up</button></Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}