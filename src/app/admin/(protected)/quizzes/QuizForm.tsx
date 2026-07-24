'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type QuestionType = 'theory' | 'code_analysis' | 'practical_scenario';

interface QuestionDraft {
  key: string;
  type: QuestionType;
  question: string;
  code_snippet: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  topic: string;
}

interface CompanyOption {
  company_id: string;
  name: string;
}

export interface QuizFormInitialData {
  quiz_id?: string;
  company_id: string;
  company_name?: string | null;
  role: string;
  experience: string;
  quiz_type: string;
  theory_questions_percentage?: number;
  code_analysis_questions_percentage?: number;
  quiz?: Array<{
    id?: number | string;
    type?: string;
    question: string;
    code_snippet?: string | null;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: string;
    topic?: string;
  }>;
}

function emptyQuestion(): QuestionDraft {
  return {
    key: Math.random().toString(36).slice(2),
    type: 'theory',
    question: '',
    code_snippet: '',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: 'A',
    topic: '',
  };
}

function toDrafts(initial?: QuizFormInitialData['quiz']): QuestionDraft[] {
  if (!initial || initial.length === 0) return [emptyQuestion()];
  return initial.map((q) => ({
    key: Math.random().toString(36).slice(2),
    type: (q.type as QuestionType) || 'theory',
    question: q.question || '',
    code_snippet: q.code_snippet || '',
    options: { A: q.options?.A || '', B: q.options?.B || '', C: q.options?.C || '', D: q.options?.D || '' },
    correct_answer: (q.correct_answer as 'A' | 'B' | 'C' | 'D') || 'A',
    topic: q.topic || '',
  }));
}

export function QuizForm({
  mode,
  initialData,
  onCancel,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initialData?: QuizFormInitialData;
  onCancel?: () => void;
  onSaved: (quizId: string) => void;
}) {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState(initialData?.company_id || '');
  const [companyQuery, setCompanyQuery] = useState(initialData?.company_name || initialData?.company_id || '');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [role, setRole] = useState(initialData?.role || '');
  const [experience, setExperience] = useState(initialData?.experience || '');
  const [quizType, setQuizType] = useState(initialData?.quiz_type || 'technical');
  const [theoryPct, setTheoryPct] = useState(initialData?.theory_questions_percentage ?? 70);
  const [codePct, setCodePct] = useState(initialData?.code_analysis_questions_percentage ?? 30);
  const [questions, setQuestions] = useState<QuestionDraft[]>(toDrafts(initialData?.quiz));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companyBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!companyQuery || companyQuery === initialData?.company_name || companyQuery === companyId) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/companies?q=${encodeURIComponent(companyQuery)}`);
        const data = await res.json();
        setCompanyOptions((data.companies || []).slice(0, 8));
      } catch {
        setCompanyOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (companyBoxRef.current && !companyBoxRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const updateQuestion = (key: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const updateOption = (key: string, opt: 'A' | 'B' | 'C' | 'D', value: string) => {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, options: { ...q.options, [opt]: value } } : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (key: string) => setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.key !== key) : prev));

  const isNonTechnical = quizType === 'non_technical';

  const validate = (): string | null => {
    if (!companyId.trim()) return 'Pick a company.';
    if (!role.trim()) return 'Role is required.';
    if (!experience.trim()) return 'Experience is required.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1} is missing its text.`;
      if (!q.options.A.trim() || !q.options.B.trim() || !q.options.C.trim() || !q.options.D.trim()) {
        return `Question ${i + 1} needs all 4 options filled in.`;
      }
      if (!q.topic.trim()) return `Question ${i + 1} needs a topic.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        company_id: companyId.trim(),
        role: role.trim(),
        experience: experience.trim(),
        quiz_type: quizType,
        theory_questions_percentage: Number(theoryPct) || 0,
        code_analysis_questions_percentage: isNonTechnical ? 0 : Number(codePct) || 0,
        questions: questions.map((q) => ({
          type: q.type,
          question: q.question.trim(),
          code_snippet: q.type === 'code_analysis' ? q.code_snippet : null,
          options: q.options,
          correct_answer: q.correct_answer,
          topic: q.topic.trim(),
        })),
      };

      const url = mode === 'create' ? '/api/admin/quizzes' : `/api/admin/quizzes/${encodeURIComponent(initialData!.quiz_id!)}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${mode === 'create' ? 'create' : 'save'} quiz`);
        return;
      }
      toast({
        title: mode === 'create' ? 'Quiz created' : 'Quiz saved',
        description: mode === 'create' ? 'The new draft quiz was created.' : 'Your changes were saved.',
        className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
      });
      onSaved(data.quiz_id || initialData?.quiz_id || '');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const typeBadgeClass = useMemo(() => ({
    theory: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    code_analysis: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    practical_scenario: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }), []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Quiz details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative" ref={companyBoxRef}>
            <label className="text-xs text-zinc-500 mb-1 block">Company</label>
            <input
              value={companyQuery}
              onChange={(e) => {
                setCompanyQuery(e.target.value);
                setCompanyId('');
                setShowCompanyDropdown(true);
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              placeholder="Search company by name or id..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            {showCompanyDropdown && companyOptions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                {companyOptions.map((c) => (
                  <button
                    type="button"
                    key={c.company_id}
                    onClick={() => {
                      setCompanyId(c.company_id);
                      setCompanyQuery(c.name);
                      setShowCompanyDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800"
                  >
                    {c.name} <span className="text-zinc-500 text-xs">{c.company_id}</span>
                  </button>
                ))}
              </div>
            )}
            {companyId && <p className="text-xs text-green-400 mt-1">Selected: {companyId}</p>}
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Experience</label>
            <input
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 2-4 years"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Quiz type</label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            >
              <option value="technical">Technical</option>
              <option value="non_technical">Non-Technical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Theory %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={theoryPct}
              onChange={(e) => setTheoryPct(Number(e.target.value))}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          {!isNonTechnical && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Code analysis %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={codePct}
                onChange={(e) => setCodePct(Number(e.target.value))}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Questions ({questions.length})</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900 text-sm px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </div>

        {questions.map((q, idx) => (
          <div key={q.key} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Q{idx + 1}</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.key, { type: e.target.value as QuestionType })}
                    className={`appearance-none text-xs rounded-full pl-2.5 pr-6 py-0.5 border bg-transparent ${typeBadgeClass[q.type]}`}
                  >
                    <option value="theory" className="bg-zinc-900 text-white">Theory</option>
                    <option value="code_analysis" className="bg-zinc-900 text-white">Code analysis</option>
                    <option value="practical_scenario" className="bg-zinc-900 text-white">Practical scenario</option>
                  </select>
                  <ChevronDown className="h-3 w-3 absolute right-1.5 top-1.5 pointer-events-none opacity-70" />
                </div>
                <button type="button" onClick={() => removeQuestion(q.key)} className="text-zinc-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(q.key, { question: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />

            {q.type === 'code_analysis' && (
              <textarea
                value={q.code_snippet}
                onChange={(e) => updateQuestion(q.key, { code_snippet: e.target.value })}
                placeholder="Code snippet (optional)"
                rows={3}
                className="w-full rounded-lg bg-black border border-zinc-800 px-3 py-2 text-zinc-300 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.key, { correct_answer: opt })}
                    title="Mark as correct answer"
                    className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium transition-colors ${
                      q.correct_answer === opt
                        ? 'bg-green-500/20 border-green-500/50 text-green-300'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    {opt}
                  </button>
                  <input
                    value={q.options[opt]}
                    onChange={(e) => updateOption(q.key, opt, e.target.value)}
                    placeholder={`Option ${opt}`}
                    className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">Click a letter to mark it as the correct answer.</p>

            <input
              value={q.topic}
              onChange={(e) => updateQuestion(q.key, { topic: e.target.value })}
              placeholder="Topic (e.g. React Hooks)"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create quiz' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

export default QuizForm;
