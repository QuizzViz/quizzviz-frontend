import { QuizUserResponse, CandidateAnalytics, ErrorResponse, TopicPercentage } from '@/types/quizResult';

const API_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL || '';

// Helper function to get auth token from cookies (same as useCachedFetch)
const getAuthToken = () => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, ...values] = cookie.trim().split('=');
    if (key && values.length > 0) {
      acc[key] = values.join('=');
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.__session || null;
};

export class QuizResultAPI {
  /**
   * Helper function to safely extract total percentages from result
   */
  static getTotalPercentages(result: QuizUserResponse['result']): number | undefined {
    return result.total_percentages;
  }

  /**
   * Helper function to safely extract topic percentages from result
   */
  static getTopicPercentages(result: QuizUserResponse['result']): TopicPercentage[] | undefined {
    return result.topic_percentages;
  }

  /**
   * Helper function to convert topic percentages array to key-value object for analytics
   */
  static convertTopicPercentagesToObject(topicPercentages: TopicPercentage[]): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    topicPercentages.forEach(topic => {
      result[topic.name] = topic.percentage;
    });
    return result;
  }

  /**
   * Recalculate topic performance from original quiz data to fix incorrect stored topic percentages
   */
  static async recalculateTopicPerformance(quizId: string, userAnswers: any[]): Promise<TopicPercentage[]> {
    try {
      // Fetch the original quiz data from publish service
      const publishServiceUrl = process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL || '';
      const response = await fetch(`${publishServiceUrl}/publish/quiz/${quizId}`);
      
      if (!response.ok) {
        console.warn('Could not fetch quiz data for topic recalculation, falling back to stored data');
        return [];
      }
      
      const quizData = await response.json();
      
      if (!quizData.quiz || !Array.isArray(quizData.quiz)) {
        console.warn('Invalid quiz data structure, falling back to stored data');
        return [];
      }

      // Group questions by topic and calculate performance
      interface QuestionWithAnswer {
        question: any;
        userAnswer: any;
        isCorrect: boolean;
      }

      const questionsByTopic = quizData.quiz.reduce((acc: Record<string, QuestionWithAnswer[]>, question: any, index: number) => {
        // Bucket questions without a valid topic name under "General" instead
        // of dropping them — otherwise the topic-wise total undercounts the
        // real question total shown elsewhere on the page.
        const trimmed = question.topic?.trim();
        const topicName = (!trimmed || trimmed === 'Unknown Topic') ? 'General' : trimmed;

        if (!acc[topicName]) {
          acc[topicName] = [];
        }
        
        // Find the corresponding user answer
        const userAnswer = userAnswers[index];
        acc[topicName].push({
          question,
          userAnswer,
          isCorrect: userAnswer?.selected_option === question.correct_answer
        });
        
        return acc;
      }, {});

      // Calculate topic percentages
      const topicPercentages: TopicPercentage[] = Object.entries(questionsByTopic as Record<string, QuestionWithAnswer[]>).map(([topicName, topicQuestions]) => {
        const correctInTopic = topicQuestions.filter((q: QuestionWithAnswer) => q.isCorrect).length;
        const totalInTopic = topicQuestions.length;
        const percentage = totalInTopic > 0 ? Math.round((correctInTopic / totalInTopic) * 100) : 0;

        return {
          name: topicName,
          percentage,
          total_questions: totalInTopic,
          correct_questions: correctInTopic
        };
      });

      return topicPercentages;
    } catch (error) {
      console.error('Error recalculating topic performance:', error);
      return [];
    }
  }

  /**
   * Get quiz result for a specific candidate and quiz
   */
  static async getCandidateQuizResult(
    quizId: string,
    candidateEmail: string
  ): Promise<QuizUserResponse> {
    const url = `${API_BASE_URL}/quiz/${encodeURIComponent(quizId)}/candidate/${encodeURIComponent(candidateEmail)}`;
    
    // Get auth token and add to headers
    const authToken = getAuthToken();
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };
    
    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({ detail: 'Unknown error' }));
      const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      throw new Error(errorMessage || `Failed to fetch candidate quiz result: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all quiz results for a specific candidate
   */
  static async getCandidateAllResults(
    candidateEmail: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<QuizUserResponse[]> {
    const url = new URL(`${API_BASE_URL}/candidate/${encodeURIComponent(candidateEmail)}`);
    url.searchParams.append('skip', skip.toString());
    url.searchParams.append('limit', limit.toString());
    
    // Get auth token and add to headers
    const authToken = getAuthToken();
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };
    
    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({ detail: 'Unknown error' }));
      const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      throw new Error(errorMessage || `Failed to fetch candidate all results: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get comprehensive analytics for a candidate across all quizzes
   */
  static async getCandidateAnalytics(
    candidateEmail: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<CandidateAnalytics> {
    try {
      const allResults = await this.getCandidateAllResults(candidateEmail, skip, limit);
      
      if (allResults.length === 0) {
        throw new Error('No quiz results found for this candidate');
      }

      // Convert to QuizUserResponse format
      const formattedResults: QuizUserResponse[] = allResults.map(result => ({
        id: result.id,
        quiz_id: result.quiz_id,
        owner_id: result.owner_id,
        username: result.username,
        user_email: result.user_email,
        user_answers: result.user_answers || [],
        result: {
          total_questions: result.result?.total_questions || 0,
          correct_answers: result.result?.correct_answers || 0,
          score: result.result?.score || 0,
          passed: result.result?.passed || false,
          total_percentages: result.result?.total_percentages,
          topic_percentages: result.result?.topic_percentages || [],
          role: result.result?.role,
          time_taken: result.result?.time_taken,
          quiz_experience: result.result?.quiz_experience,
        },
        attempt: result.attempt || 1,
        created_at: result.created_at,
        updated_at: result.updated_at,
      }));

      // Calculate analytics
      const totalAttempts = formattedResults.length;
      const scores = formattedResults.map(result => result.result.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
      const highestScore = Math.max(...scores);
      const latestAttempt = Math.max(...formattedResults.map(result => result.attempt));

      // Calculate topic performance with recalculation for existing data
      const topicPerformance: { [topic: string]: { total: number; average: number; highest: number } } = {};
      
      // Process each result and recalculate topics if needed
      for (const result of formattedResults) {
        let topicPercentages = this.getTopicPercentages(result.result);
        
        // If stored topic data seems incorrect (0% for topics that should have data), try to recalculate
        if (!topicPercentages || topicPercentages.length === 0 || 
            topicPercentages.some(tp => tp.percentage === 0 && tp.total_questions > 0)) {
          try {
            topicPercentages = await this.recalculateTopicPerformance(result.quiz_id, result.user_answers);
          } catch (error) {
            console.warn('Failed to recalculate topics for quiz', result.quiz_id, error);
            // Fall back to stored data
            topicPercentages = this.getTopicPercentages(result.result);
          }
        }
        
        if (topicPercentages) {
          topicPercentages.forEach(topic => {
            if (!topicPerformance[topic.name]) {
              topicPerformance[topic.name] = { total: 0, average: 0, highest: 0 };
            }
            topicPerformance[topic.name].total += topic.percentage;
            topicPerformance[topic.name].highest = Math.max(topicPerformance[topic.name].highest, topic.percentage);
          });
        }
      }

      // Calculate averages for each topic
      Object.keys(topicPerformance).forEach(topic => {
        topicPerformance[topic].average = topicPerformance[topic].total / totalAttempts;
      });

      return {
        username: formattedResults[0].username,
        email: formattedResults[0].user_email,
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        highest_score: highestScore,
        latest_attempt: latestAttempt,
        topic_performance: topicPerformance,
        attempts: formattedResults.sort((a, b) => b.attempt - a.attempt) // Sort by attempt number descending
      };
    } catch (error) {
      throw new Error(`Failed to get candidate analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export candidate data to CSV format
   */
  static exportToCSV(analytics: CandidateAnalytics): string {
    const headers = ['Name', 'Email', 'Total Attempts', 'Average Score', 'Highest Score', 'Latest Attempt'];
    const row = [
      analytics.username,
      analytics.email,
      analytics.total_attempts.toString(),
      `${analytics.average_score}%`,
      `${analytics.highest_score}%`,
      analytics.latest_attempt.toString()
    ];

    let csv = headers.join(',') + '\n';
    csv += row.join(',') + '\n\n';

    // Add topic performance
    csv += 'Topic Performance\n';
    csv += 'Topic,Average Percentage,Highest Percentage\n';
    
    Object.entries(analytics.topic_performance).forEach(([topic, performance]) => {
      csv += `"${topic}",${performance.average.toFixed(2)}%,${performance.highest.toFixed(2)}%\n`;
    });

    // Add detailed attempts
    csv += '\nDetailed Attempts\n';
    csv += 'Attempt,Quiz ID,Score,Passed,Date\n';
    
    analytics.attempts.forEach(attempt => {
      csv += `${attempt.attempt},"${attempt.quiz_id}",${attempt.result.score}%,${attempt.result.passed ? 'Yes' : 'No'}","${new Date(attempt.created_at).toLocaleDateString()}"\n`;
    });

    return csv;
  }

  /**
   * Download candidate data as CSV file
   */
  static downloadCSV(analytics: CandidateAnalytics): void {
    const csv = this.exportToCSV(analytics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${analytics.username.replace(/\s+/g, '_')}_quiz_results.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
