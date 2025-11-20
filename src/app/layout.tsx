import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";
import Providers from "./providers";
import React from "react";
import type { Metadata, Viewport } from "next";

const siteUrl = 'https://quizzviz.com';

// Viewport configuration
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuizzViz – Generate and Proctor Coding Quizzes for Faster Hiring and Learning",
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
    "ai quiz platform",
    "hiring platform",
    "enterprise coding quizzes",
    "AI coding quiz generator for interviews",
    "technical assessments",
    "technical interviews",
    "AI Coding Quiz Generator for technical assessments",
    "AI Coding Quiz Generator for hiring Programmers",
    "coding interview",
    "react",
    "nextjs",
  ],
  referrer: "origin-when-cross-origin",
  authors: [{ name: "QuizzViz" }],
  creator: "QuizzViz",
  publisher: "QuizzViz",
  category: "technology",
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "QuizzViz – Generate and Proctor Coding Quizzes for Faster Hiring and Learning",
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
    title: "QuizzViz – Generate and Proctor Coding Quizzes for Faster Hiring and Learning",
    description:
      "Build enterprise-grade coding quizzes in minutes with QuizzViz. Intelligent, fast, and professional quiz generation.",
    images: [`${siteUrl}/QuizzViz-logo.png`],
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

  // 👇 Server-rendered JSON-LD schema for Google
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "QuizzViz",
        alternateName: "Quizz Viz",
        url: siteUrl,
        logo: `${siteUrl}/QuizzViz-logo.png`,
        image: `${siteUrl}/QuizzViz-logo.png`,
        description:
          "QuizzViz is an AI-powered coding quiz generator that helps companies create professional, real-world coding quizzes in minutes.",
        sameAs: [
          "https://www.linkedin.com/company/quizzviz",
          "https://x.com/QuizzViz",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "QuizzViz",
        url: siteUrl,
        logo: `${siteUrl}/QuizzViz-logo.png`,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ]),
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
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.manifest.json" />
      </head>
      <body>
        <div className="min-h-screen bg-background text-foreground">
          <Providers>{children}</Providers>
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
