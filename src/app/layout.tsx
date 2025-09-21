
// layout.tsx
import "./globals.css";
import Providers from "./providers";
import React from "react";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

// import ConditionalNavbar from "@/components/ConditionalNavbar";

const siteUrl = "https://www.quizzviz.com";


// Viewport configuration should be exported separately
export const viewport = {
  themeColor: '#ffffff', // Or your brand color
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuizzViz – AI Powered Coding Quiz Generator",
    template: "%s | QuizzViz",
  },
  description:
    "QuizzViz helps companies create high-quality, real-world coding quizzes in minutes. Fast, reliable, and built for professionals.",
  applicationName: "QuizzViz",
  generator: "Next.js",
  keywords: [
    "coding quizzes",
    "developer assessments",
    "technical hiring",
    "programming quiz generator",
    "ai quiz generator",
    "ai quiz",
    "ai quiz platform",
    "hiring platform",
    "hiring",
    "enterprise quizzes",
    "enterprise coding quizzes",
    "AI coding quiz generator for interviews",
    "AI Coding Quiz Generator for hiring",
    "AI Coding Quiz Generator for technical hiring",
    "AI Coding Quiz Generator for technical assessments",
    "AI Coding Quiz Generator for technical interviews",
    "AI Coding Quiz Generator for technical assessments",
    "AI Coding Quiz Generator for hiring Programmers",  
    "coding interview",
    "react",
    "nextjs"
  ],
  referrer: "origin-when-cross-origin",
  authors: [{ name: "QuizzViz" }],
  creator: "QuizzViz",
  publisher: "QuizzViz",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "QuizzViz – AI Powered Technical Quiz Generator",
    description:
      "Build enterprise-grade coding quizzes in minutes with QuizzViz. Intelligent, fast, and professional quiz generation.",
    url: siteUrl,
    siteName: "QuizzViz",
    images: [
      {
        url: `${siteUrl}/QuizzViz-logo.png`,
        width: 1200,
        height: 630,
        alt: "QuizzViz Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizzViz – AI Powered Technical Quiz Generator",
    description:
      "Build enterprise-grade coding quizzes in minutes with QuizzViz. Intelligent, fast, and professional quiz generation.",
    images: [`${siteUrl}/favicon.ico`],
    creator: "@QuizzViz",
    site: "@QuizzViz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for WebSite */}
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "QuizzViz",
      alternateName: "Quizz Viz",
      url: "https://www.quizzviz.com",
      logo: "https://www.quizzviz.com/QuizzViz-logo.png",
      image: "https://www.quizzviz.com/QuizzViz-logo.png",
      description:
        "QuizzViz – AI Powered Technical Quiz Generator",
    }),
  }}
/>

      </head>
      <body>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            {/* <ConditionalNavbar /> */}
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
