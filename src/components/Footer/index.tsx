"use client"
import { Logo } from "../logo";
import Link from "next/link";
import { Linkedin, Youtube, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand Section */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <Link href="/" className="inline-flex items-center group w-fit">
              <Logo size="sm" />
              <span className="text-2xl font-semibold text-foreground ml-2.5 group-hover:text-foreground/80 transition-colors">
                QuizzViz
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
We empower HR teams to assess programmers and help learners evaluate their own skill sets.            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 flex flex-col space-y-5">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Quick Links
            </h3>
            <nav className="flex flex-col space-y-3.5">
              <Link 
                href="/mission"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit hover:translate-x-0.5 transform"
              >
                Mission
              </Link>
              <Link 
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit hover:translate-x-0.5 transform"
                data-testid="footer-link-privacy"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit hover:translate-x-0.5 transform"
                data-testid="footer-link-terms"
              >
                Terms of Service
              </Link>
              <Link 
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit hover:translate-x-0.5 transform"
              >
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Social & Community */}
          <div className="lg:col-span-4 flex flex-col space-y-5">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Connect With Us
            </h3>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/quizzviz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center justify-center h-11 w-11 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50 transition-all duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@QuizzViz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex items-center justify-center h-11 w-11 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50 transition-all duration-200"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <a
              href="https://chat.whatsapp.com/EnBq8NIG0vkHmUmBvV34LK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/50 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 hover:border-foreground/30 transition-all duration-200 w-fit backdrop-blur-sm"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Join Community
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            2025 QuizzViz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}