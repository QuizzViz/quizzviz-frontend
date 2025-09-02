import { useState, useEffect } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

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
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50" : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => scrollToSection("hero")}
            data-testid="logo-brand"
          >
            <Logo size="md" animate={true} />
            <span className="text-2xl font-semibold text-foreground">QuizzViz</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection("about")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="link-about"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection("login")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="link-login"
            >
              Login
            </button>
            <Button 
              onClick={() => scrollToSection("signup")}
              className="bg-white text-black hover:bg-gray-200 font-medium"
              data-testid="button-signup"
            >
              Signup
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
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
          <div className="md:hidden glassmorphism rounded-lg mt-2 py-4" data-testid="mobile-menu">
            <div className="flex flex-col space-y-4 px-4">
              <button 
                onClick={() => scrollToSection("about")}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left"
                data-testid="mobile-link-about"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection("login")}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left"
                data-testid="mobile-link-login"
              >
                Login
              </button>
              <Button 
                onClick={() => scrollToSection("signup")}
                className="bg-white text-black hover:bg-gray-200 font-medium w-full"
                data-testid="mobile-button-signup"
              >
                Signup
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
