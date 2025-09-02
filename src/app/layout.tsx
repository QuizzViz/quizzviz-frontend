export const metadata = {
  title: "QuizzViz",
  description: "Intelligent Coding Quizz Generation",
};

import "./globals.css";
import Providers from "./providers";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
