"use client"
import { Logo } from "../logo";
import Link from "next/link";

export function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-secondary border-t border-border py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
         <Link href="/"> <div className="flex items-center mb-4 md:mb-0" data-testid="footer-brand">
            <Logo size="sm" />
            <span className="text-lg font-medium text-foreground">QuizzViz</span>
            <span className="text-muted-foreground ml-2">© 2025</span>
          </div></Link>
          
          <div className="flex flex-wrap justify-center md:justify-end space-x-8 text-sm">
            <button 
              onClick={() => scrollToSection("about")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="footer-link-about"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection("privacy")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="footer-link-privacy"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => scrollToSection("terms")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="footer-link-terms"
            >
              Terms
            </button>
            <button 
              onClick={() => scrollToSection("contact")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              data-testid="footer-link-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
