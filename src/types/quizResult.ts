export interface UserAnswer {
  question_id: string;
  selected_option: string | string[];
  is_correct: boolean;
  points_earned: number;
}

export interface QuizResult {
  id: number;
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  user_answers: UserAnswer[];
  result: {
    total_questions: number;
    correct_answers: number;
    score: number;
    passed: boolean;
    total_percentages?: number;
    topic_percentages?: { [key: string]: number };
  };
  attempt: number;
  created_at: string;
  updated_at: string;
}

export interface AttemptCheckResponse {
  username: string;
  email: string;
  quiz_id: string;
  attempts: number;
}

export interface QuizUserResponse {
  id: number;
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  user_answers: UserAnswer[];
  result: {
    total_questions: number;
    correct_answers: number;
    score: number;
    passed: boolean;
    total_percentages?: number;
    topic_percentages?: { [key: string]: number };
  };
  attempt: number;
  created_at: string;
  updated_at: string;
  // Additional fields for candidate-specific responses
  quiz_title?: string;
}

export interface CandidateAnalytics {
  username: string;
  email: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  latest_attempt: number;
  topic_performance: { [topic: string]: { total: number; average: number; highest: number } };
  attempts: QuizUserResponse[];
}

export interface ErrorResponse {
  detail: string | { [key: string]: any };
}
