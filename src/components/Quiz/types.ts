export interface QuizSummary {
  quiz_id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: string; // JSON string
  created_at?: string;
}

export interface QuizQuestion {
  id: number | string;
  type: string;
  question: string;
  code_snippet?: string | null;
  options?: Record<string, string> | null;
  correct_answer: string;
}

export interface PublishSettings {
  secretKey: string;
  timeLimit: number;
  maxAttempts: number;
  expirationDate: string;
  isSecretKeyRequired: boolean;
}

export interface QuestionFormData {
  id?: number | string;
  type: string;
  question: string;
  code_snippet?: string | null;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: "A" | "B" | "C" | "D";
}

export interface QuizPaginationProps {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  questionsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface QuizHeaderProps {
  quiz: QuizSummary | undefined;
  questionsCount: number;
  onAddQuestion: () => void;
  onPublish: () => void;
  isPublished: boolean;
  onDelete: () => void;
}

export interface QuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  onEdit: () => void;
  onDelete: () => void;
}

export interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => void;
  initialData: QuestionFormData;
  isSubmitting?: boolean;
}

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  quizId: string;
  settings: PublishSettings;
  onSettingsChange: (settings: PublishSettings) => void;
  isPublishing: boolean;
  origin: string;
  onCopyLink: () => void;
}
