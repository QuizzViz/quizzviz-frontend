import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface QuizPageProps {
  params: {
    username: string;
    quizId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function QuizPage({ params }: QuizPageProps) {
  const { username, quizId } = params;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="text-xl sm:text-2xl font-semibold text-foreground">
              QuizzViz
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 pt-8">
      

      </main>
    </div>
  );
}