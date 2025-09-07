// layout.tsx
import "./globals.css";
import Providers from "./providers";
import React from "react";
import { Navbar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuizzViz – Create Professional Coding Quizzes in Minutes",
  description:
    "QuizzViz helps companies create high-quality, real-world coding quizzes in under 3 minutes. Fast, reliable, and built for professionals.",
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    title: "QuizzViz – Create Professional Coding Quizzes in Minutes",
    description:
      "Build enterprise-grade coding quizzes in minutes with QuizzViz. Intelligent, fast, and professional quiz generation.",
    url: "https://www.quizzviz.com",
    siteName: "QuizzViz",
    images: [
      {
        url: "https://www.quizzviz.com/QuizzViz-logo.png",
        width: 1200,
        height: 630,
        alt: "QuizzViz Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
