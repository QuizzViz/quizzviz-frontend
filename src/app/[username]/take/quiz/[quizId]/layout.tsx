import { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/toast-provider';

interface PageParams {
  username: string;
  quizId: string;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const firstName = params.username
  
  return {
    title: `${firstName}'s Quiz`,
    description: `Take ${firstName}'s quiz on QuizzViz`,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

interface QuizLayoutProps {
  children: React.ReactNode;
  params: {
    username: string;
    quizId: string;
  };
}

export default function QuizLayout({
  children,
  params
}: QuizLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
      <ToastProvider />
    </div>
  );
}
