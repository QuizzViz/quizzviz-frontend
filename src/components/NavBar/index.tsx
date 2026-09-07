"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "/mission", label: "Mission" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
      data-testid="navbar"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link
            href="/"
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-0 shrink-0"
            data-testid="logo-brand"
          >
            <img
              src="/QuizzViz-logo.png"
              alt="QuizzViz Logo"
              className="h-11 w-11 sm:h-14 sm:w-14 object-contain"
            />
            <span className="text-xl sm:text-2xl font-semibold text-white leading-none">
              QuizzViz
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-5 pl-6 border-l border-white/10">
              <Link
                href="/signin"
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                data-testid="link-login"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                data-testid="link-signup"
              >
                Sign up
              </Link>
              <Link
                href="https://calendly.com/syedshahmirsultan/new-meeting"
                data-testid="link-book-demo"
              >
                <Button className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:scale-[1.03] transition-transform duration-200">
                  Book a demo
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu toggle */}
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
                <X className="w-5 h-5 text-white" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-white" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden rounded-xl border border-white/10 bg-background/95 backdrop-blur-md mt-2 mb-4 py-3"
            data-testid="mobile-menu"
          >
            <div className="flex flex-col divide-y divide-white/10">
              <div className="flex flex-col py-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors duration-200"
                    data-testid={`mobile-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-3">
                <Link
                  href="https://calendly.com/syedshahmirsultan/new-meeting"
                  className="mx-4"
                  data-testid="mobile-link-book-demo"
                >
                  <Button className="w-full justify-center rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-sm font-semibold text-white">
                    Book a demo
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <div className="flex items-center justify-between px-4">
                  <Link
                    href="/signin"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                    data-testid="mobile-link-login"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                    data-testid="mobile-link-signup"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
