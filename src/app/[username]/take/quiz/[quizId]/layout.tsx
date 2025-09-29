import { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/toast-provider';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const firstName = params.username
    .split(/[-_]/)[0]
    .charAt(0).toUpperCase() + 
    params.username.split(/[-_]/)[0].slice(1).toLowerCase();
  
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

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
      <ToastProvider />
    </div>
  );
}
