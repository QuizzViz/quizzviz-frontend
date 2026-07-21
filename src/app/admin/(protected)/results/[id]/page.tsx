'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from 'lucide-react';

interface Option { A: string; B: string; C: string; D: string; }

interface QuizQuestion {
  id: number | string;
  type: string;
  question: string;
  code_snippet?: string | null;
  options: Option;
  correct_answer: string;
  topic: string;
}

interface UserAnswer {
  question_id: string;
  answer: string;
  is_correct: boolean;
}

interface Attempt {
  id: number;
  quiz_id: string;
  company_id: string;
  company_name: string | null;
  username: string;
  user_email: string;
  attempt: number;
  user_answers: UserAnswer[];
  result: { score?: number; correct_answers?: number; total_questions?: number; time_taken?: number };
  created_at: string;
}

interface QuizInfo {
  quiz_id: string;
  role: string;
  experience: string;
  num_questions: number;
  quiz_type: string;
  quiz: QuizQuestion[];
}

export default function AdminAttemptDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [highestScore, setHighestScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/results/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load attempt');
          return;
        }
        setAttempt(data.attempt);
        setQuiz(data.quiz);
        setHighestScore(data.highest_score);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (error || !attempt) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error || 'Attempt not found.'}</p>
        <Link href="/admin/results" className="text-green-400 text-sm mt-2 inline-block">Back to attempts</Link>
      </div>
    );
  }

  const score = attempt.result?.score ?? 0;
  const questions = quiz?.quiz && Array.isArray(quiz.quiz) ? quiz.quiz : [];
  const answersByQuestionId = new Map(
    (attempt.user_answers || []).map((a) => [String(a.question_id), a])
  );
  const correctCount = attempt.result?.correct_answers ?? (attempt.user_answers || []).filter((a) => a.is_correct).length;
  const totalCount = attempt.result?.total_questions ?? questions.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/results" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to attempts
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">{attempt.username}</h1>
          <p className="text-sm text-zinc-500 mt-1">{attempt.user_email} · {attempt.company_name || attempt.company_id}</p>
        </div>
        <span className={`text-lg font-bold rounded-full px-4 py-1.5 ${score >= 70 ? 'bg-green-500/15 text-green-300' : score >= 40 ? 'bg-yellow-500/15 text-yellow-300' : 'bg-red-500/15 text-red-300'}`}>
          {score.toFixed?.(1) ?? score}%
        </span>
      </div>

      {quiz && (
        <p className="text-sm text-zinc-500 mb-6">
          Quiz: <Link href={`/admin/quizzes/${encodeURIComponent(quiz.quiz_id)}`} className="text-green-400 hover:text-green-300">{quiz.role}</Link>
          {' '}· {quiz.quiz_id} · attempt #{attempt.attempt} · {new Date(attempt.created_at).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Correct answers</div>
          <div className="text-xl font-semibold text-white">{correctCount} / {totalCount}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">This attempt's score</div>
          <div className="text-xl font-semibold text-white">{score.toFixed?.(1) ?? score}%</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-xs text-yellow-400/80 mb-1 flex items-center gap-1"><Trophy className="h-3 w-3" /> Highest score for this quiz</div>
          <div className="text-xl font-semibold text-yellow-200">{highestScore != null ? `${highestScore.toFixed(1)}%` : '—'}</div>
        </div>
      </div>

      <h2 className="text-lg font-medium text-white mb-4">Question-by-question breakdown</h2>
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const ans = answersByQuestionId.get(String(q.id));
          const userAnswer = ans?.answer;
          const isCorrect = ans?.is_correct ?? (userAnswer === q.correct_answer);
          return (
            <div key={q.id ?? idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Q{idx + 1} · {q.topic}</span>
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" /> Incorrect</span>
                )}
              </div>
              <p className="text-white text-sm mb-3 whitespace-pre-wrap">{q.question}</p>
              {q.code_snippet && (
                <pre className="bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto mb-3 font-mono">{q.code_snippet}</pre>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isTheCorrectOne = q.correct_answer === opt;
                  const isUserPick = userAnswer === opt;
                  let cls = 'bg-zinc-900 border-zinc-800 text-zinc-400';
                  if (isTheCorrectOne) cls = 'bg-green-500/10 border-green-500/40 text-green-300';
                  if (isUserPick && !isTheCorrectOne) cls = 'bg-red-500/10 border-red-500/40 text-red-300';
                  return (
                    <div key={opt} className={`text-sm rounded-lg px-3 py-2 border flex items-center justify-between ${cls}`}>
                      <span><span className="font-medium mr-1.5">{opt}.</span>{q.options?.[opt]}</span>
                      {isUserPick && <span className="text-[10px] uppercase tracking-wide opacity-80 ml-2 flex-shrink-0">their pick</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-sm text-zinc-500">Original quiz questions are unavailable (quiz may have been deleted).</p>
        )}
      </div>
    </div>
  );
}
