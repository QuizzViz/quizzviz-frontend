'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Trophy, TrendingUp, ExternalLink, Pencil } from 'lucide-react';
import { QuizForm } from '../QuizForm';

interface Option {
  A: string; B: string; C: string; D: string;
}

interface QuizQuestion {
  id: number | string;
  type: string;
  question: string;
  code_snippet?: string | null;
  options: Option;
  correct_answer: string;
  topic: string;
}

interface QuizDetail {
  quiz_id: string;
  company_id: string;
  company_name: string | null;
  role: string;
  experience: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz_type: string;
  is_publish: boolean;
  quiz: QuizQuestion[];
  quiz_public_link: string | null;
  quiz_key: string | null;
  max_attempts: number | null;
  quiz_time: number | null;
  created_at: string;
}

interface Stats {
  attempt_count: number;
  unique_candidates: number;
  highest_score: number | null;
  average_score: number | null;
  top_candidate: { username: string; user_email: string; score: number; created_at: string } | null;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function AdminQuizDetailPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const load = async () => {
    if (!quizId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(quizId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load quiz');
        return;
      }
      setQuiz(data.quiz);
      setStats(data.stats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [quizId]);

  if (isLoading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (error || !quiz) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error || 'Quiz not found.'}</p>
        <Link href="/admin/quizzes" className="text-green-400 text-sm mt-2 inline-block">Back to quizzes</Link>
      </div>
    );
  }

  const questions = Array.isArray(quiz.quiz) ? quiz.quiz : [];

  if (isEditing) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link href="/admin/quizzes" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to quizzes
        </Link>
        <h1 className="text-2xl font-semibold text-white mb-1">Edit quiz</h1>
        <p className="text-sm text-zinc-500 mb-6">{quiz.quiz_id}</p>
        <QuizForm
          mode="edit"
          initialData={{
            quiz_id: quiz.quiz_id,
            company_id: quiz.company_id,
            company_name: quiz.company_name,
            role: quiz.role,
            experience: quiz.experience,
            quiz_type: quiz.quiz_type,
            theory_questions_percentage: quiz.theory_questions_percentage,
            code_analysis_questions_percentage: quiz.code_analysis_questions_percentage,
            quiz: questions,
          }}
          onCancel={() => setIsEditing(false)}
          onSaved={async () => {
            setIsEditing(false);
            await load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to quizzes
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">{quiz.role}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {quiz.quiz_id} · {quiz.company_name || quiz.company_id} · {quiz.experience} yrs experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs rounded-full px-2.5 py-1 border ${quiz.quiz_type === 'non_technical' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
            {quiz.quiz_type === 'non_technical' ? 'Non-Technical' : 'Technical'}
          </span>
          {quiz.quiz_public_link ? (
            <span className="text-xs rounded-full px-2.5 py-1 bg-green-500/15 text-green-300 border border-green-500/30">Published</span>
          ) : (
            <span className="text-xs rounded-full px-2.5 py-1 bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Draft</span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
      </div>

      {quiz.quiz_public_link && (
        <a
          href={`/${quiz.company_id}/take/quiz/${quiz.quiz_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 mb-4"
        >
          View public quiz link <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <div className="grid grid-cols-4 gap-4 my-6">
        <StatCard label="Total attempts" value={String(stats?.attempt_count ?? 0)} icon={Users} />
        <StatCard label="Unique candidates" value={String(stats?.unique_candidates ?? 0)} icon={Users} />
        <StatCard label="Highest score" value={stats?.highest_score != null ? `${stats.highest_score.toFixed(1)}%` : '—'} icon={Trophy} />
        <StatCard label="Average score" value={stats?.average_score != null ? `${stats.average_score.toFixed(1)}%` : '—'} icon={TrendingUp} />
      </div>

      {stats?.top_candidate && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-100">
            Top scorer: <span className="font-semibold">{stats.top_candidate.username}</span> ({stats.top_candidate.user_email}) with{' '}
            <span className="font-semibold">{Number(stats.top_candidate.score).toFixed(1)}%</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs">
          Theory {quiz.theory_questions_percentage}%
        </span>
        {quiz.quiz_type !== 'non_technical' && (
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300 text-xs">
            Code {quiz.code_analysis_questions_percentage}%
          </span>
        )}
        <span className="text-xs text-zinc-500">{questions.length} questions</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id ?? idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Q{idx + 1} · {q.topic}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 border ${
                q.type === 'code_analysis' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : q.type === 'practical_scenario' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {q.type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-white text-sm mb-3 whitespace-pre-wrap">{q.question}</p>
            {q.code_snippet && (
              <pre className="bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto mb-3 font-mono">{q.code_snippet}</pre>
            )}
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div
                  key={opt}
                  className={`text-sm rounded-lg px-3 py-2 border ${
                    q.correct_answer === opt
                      ? 'bg-green-500/10 border-green-500/40 text-green-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="font-medium mr-1.5">{opt}.</span>{q.options?.[opt]}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
