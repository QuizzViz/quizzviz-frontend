import { Metadata, Viewport } from 'next';
import { ToastProvider as ToastProvider} from '@/components/ui/toast-provider';

interface QuizLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    username: string;
    quizId: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; quizId: string }>;
}): Promise<Metadata> {
  const { username } = await params; // ← important!

  return {
    title: `${username}'s Quiz`,
    description: `Take ${username}'s quiz on QuizzViz`,
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
};

// Layout itself must also await params
export default async function QuizLayout({
  children,
  params,
}: QuizLayoutProps) {
  const { username, quizId } = await params; // ← await here too (optional but clean)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
      <ToastProvider />
    </div>
  );
}