const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

export function validateQuizPayload(body: any): string | null {
  if (!body.company_id || typeof body.company_id !== 'string') return 'company_id is required';
  if (!body.role || typeof body.role !== 'string') return 'role is required';
  if (!body.experience || typeof body.experience !== 'string') return 'experience is required';
  if (body.quiz_type !== 'technical' && body.quiz_type !== 'non_technical') return 'quiz_type must be technical or non_technical';
  if (!Array.isArray(body.questions) || body.questions.length === 0) return 'At least one question is required';
  for (const q of body.questions) {
    if (!q.question || typeof q.question !== 'string') return 'Every question needs question text';
    if (!q.options || VALID_OPTION_KEYS.some((k) => !q.options[k] || typeof q.options[k] !== 'string')) {
      return 'Every question needs all 4 options (A-D)';
    }
    if (!VALID_OPTION_KEYS.includes(q.correct_answer)) return 'Every question needs a valid correct_answer (A-D)';
    if (!q.topic || typeof q.topic !== 'string') return 'Every question needs a topic';
  }
  return null;
}

export function buildQuizContent(questions: any[]) {
  return questions.map((q, idx) => ({
    id: idx + 1,
    type: q.type || 'theory',
    question: q.question,
    code_snippet: q.code_snippet || null,
    options: q.options,
    correct_answer: q.correct_answer,
    topic: q.topic,
  }));
}
