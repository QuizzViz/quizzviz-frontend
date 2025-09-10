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
            {/* <Logo size="md" animate={true} /> */}
           <Link href="/"> <span className="inline-block text-xl sm:text-2xl font-semibold text-foreground">QuizzViz</span></Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center text-sm whitespace-nowrap">
            <div className="flex items-center gap-6 lg:gap-8 xl:gap-10">
              <button 
                onClick={() => scrollToSection("about")}
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                About
              </button>
              <button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Pricing
              </button>
              <button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Contact
              </button>
              <button 
                className="text-white hover:text-gray-200 transition-colors duration-200 px-2"
                data-testid="link-about"
              >
                Dashboard
              </button>
            </div>
            <div className="hidden md:flex items-center gap-6 lg:gap-8 ml-6 md:ml-10 lg:ml-16 xl:ml-24">
              <Button 
                className="bg-white text-black hover:bg-gray-200 hover:translate-x-1 transition-all duration-150 font-medium"
                data-testid="button-demo"
                onClick={() => scrollToSection("demo")}
              >
                Book a Demo <ArrowRight className=" w-9 h-5" />
              </Button>
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
                <button onClick={() => scrollToSection("about")} className="px-4 py-2 text-left text-white hover:text-gray-200" data-testid="mobile-link-about">About</button>
                <button onClick={() => scrollToSection("about")} className="px-4 py-2 text-left text-white hover:text-gray-200">Pricing</button>
                <button onClick={() => scrollToSection("about")} className="px-4 py-2 text-left text-white hover:text-gray-200">Contact Us</button>
                <button onClick={() => scrollToSection("about")} className="px-4 py-2 text-left text-white hover:text-gray-200">Dashboard</button>
              </div>
              <div className="flex flex-col py-2">
                <Button onClick={() => scrollToSection("demo")} className="mx-4 my-1 bg-white text-black hover:bg-gray-200 font-medium hover:translate-x-2 duration-150" data-testid="mobile-button-demo">
                  Book a Demo <ArrowRight className="ml-2" />
                </Button>
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
