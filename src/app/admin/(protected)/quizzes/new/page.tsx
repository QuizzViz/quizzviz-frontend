'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { QuizForm } from '../QuizForm';

export default function NewQuizPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to quizzes
      </Link>
      <h1 className="text-2xl font-semibold text-white mb-1">New quiz</h1>
      <p className="text-sm text-zinc-500 mb-6">Manually create a generated (draft) quiz. It won&apos;t be publicly reachable until it&apos;s published through the normal publish flow.</p>

      <QuizForm
        mode="create"
        onSaved={(quizId) => router.push(`/admin/quizzes/${encodeURIComponent(quizId)}`)}
      />
    </div>
  );
}
