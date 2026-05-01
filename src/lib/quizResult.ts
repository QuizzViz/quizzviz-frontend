import { QuizUserResponse, CandidateAnalytics, ErrorResponse } from '@/types/quizResult';

const API_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL || '';

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
  static getTopicPercentages(result: QuizUserResponse['result']): { [key: string]: number } | undefined {
    return result.topic_percentages;
  }

  /**
   * Get quiz result for a specific candidate and quiz
   */
  static async getCandidateQuizResult(
    quizId: string,
    candidateEmail: string
  ): Promise<QuizUserResponse> {
    const url = `${API_BASE_URL}/quiz/${encodeURIComponent(quizId)}/candidate/${encodeURIComponent(candidateEmail)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
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
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
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

      // Calculate analytics
      const totalAttempts = allResults.length;
      const scores = allResults.map(result => result.result.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
      const highestScore = Math.max(...scores);
      const latestAttempt = Math.max(...allResults.map(result => result.attempt));

      // Calculate topic performance
      const topicPerformance: { [topic: string]: { total: number; average: number; highest: number } } = {};
      
      allResults.forEach(result => {
        const topicPercentages = this.getTopicPercentages(result.result);
        if (topicPercentages) {
          Object.entries(topicPercentages).forEach(([topic, percentage]) => {
            if (!topicPerformance[topic]) {
              topicPerformance[topic] = { total: 0, average: 0, highest: 0 };
            }
            topicPerformance[topic].total += percentage;
            topicPerformance[topic].highest = Math.max(topicPerformance[topic].highest, percentage);
          });
        }
      });

      // Calculate averages for each topic
      Object.keys(topicPerformance).forEach(topic => {
        topicPerformance[topic].average = topicPerformance[topic].total / totalAttempts;
      });

      return {
        username: allResults[0].username,
        email: allResults[0].user_email,
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        highest_score: highestScore,
        latest_attempt: latestAttempt,
        topic_performance: topicPerformance,
        attempts: allResults.sort((a, b) => b.attempt - a.attempt) // Sort by attempt number descending
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
