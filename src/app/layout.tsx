export const metadata = {
  title: "QuizzViz",
  description: "Intelligent Coding Quizz Generation",
};

import "./globals.css";
import Providers from "./providers";
import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>   <div className="min-h-screen bg-background text-foreground">
        <Navbar />{children}
        <Footer/></div></Providers>
      </body>
    </html>
  );
}
