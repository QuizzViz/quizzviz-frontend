import { ReactNode } from "react";
import Head from "next/head";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>Dashboard | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Manage and generate AI-powered coding quizzes. Review generation queue and your quiz library."
        />
      </Head>
      {children}
    </>
  );
}
