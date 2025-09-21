import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const firstName = params.username
    .split(/[-_]/)[0]
    .charAt(0).toUpperCase() + 
    params.username.split(/[-_]/)[0].slice(1).toLowerCase();
  
  return {
    title: `${firstName} Quiz`,
  };
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
      {/* Footer removed from this layout */}
    </div>
  );
}
