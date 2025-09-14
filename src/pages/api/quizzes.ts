import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_BASE_URL = 'https://quizzviz-backend-production.up.railway.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet();
      case 'POST':
        return handlePost();
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: any) {
    console.error(`API error in /api/quizzes (${req.method}):`, err);
    return res.status(500).json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  async function handleGet() {
    const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${encodeURIComponent(userIdStr)}/quizzes`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to fetch quizzes');
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  }

  async function handlePost() {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
    if (!userIdStr) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Prepare the quiz data for the backend
      const { user_id, ...quizData } = req.body;
      
      // Log the request for debugging
      console.log('Sending quiz generation request:', {
        url: `${BACKEND_BASE_URL}/quizz`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          ...quizData,
          user_id: userIdStr
        }
      });

      // Make request to generate the quiz
      const quizResponse = await fetch(
        `${BACKEND_BASE_URL}/quizz`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userIdStr
          },
          body: JSON.stringify({
            ...quizData,
            user_id: userIdStr
          })
        }
      );

      // Handle non-OK responses
      if (!quizResponse.ok) {
        let errorData;
        try {
          errorData = await quizResponse.json();
        } catch (e) {
          const errorText = await quizResponse.text().catch(() => 'Failed to create quiz');
          console.error('Backend error:', errorText);
          return res.status(quizResponse.status).json({ 
            error: 'Failed to generate quiz',
            details: errorText
          });
        }

        // Handle non-software related topic error specifically
        if (errorData?.error?.includes('not related to software')) {
          return res.status(400).json({
            error: 'Topic Not Software-Related',
            message: 'The topic you entered is not related to software development. Please choose a software-related topic such as:',
            suggestions: [
              'Programming languages (e.g., Python, JavaScript, Java)',
              'Web development (e.g., React, Node.js, CSS)', 
              'Databases (e.g., SQL, MongoDB, PostgreSQL)',
              'Software development concepts (e.g., OOP, Algorithms, Design Patterns)',
              'DevOps (e.g., Docker, Kubernetes, CI/CD)',
              'Cloud computing (e.g., AWS, Azure, GCP)'
            ],
            isTopicError: true
          });
        }

        console.error('Backend error:', errorData);
        return res.status(quizResponse.status).json({ 
          error: 'Failed to generate quiz',
          details: errorData.error || 'Unknown error occurred'
        });
      }

      // Parse the response
      let responseData;
      try {
        responseData = await quizResponse.json();
        console.log('Received quiz response:', responseData);
        
        // Check if the response contains an error field (even with 200 status)
        if (responseData.error) {
          // Handle non-software related topic error specifically
          if (responseData.error.includes('not related to software')) {
            return res.status(400).json({
              error: 'Topic Not Software-Related',
              message: responseData.error,
              suggestions: [
                'Programming languages (e.g., Python, JavaScript, Java)',
                'Web development (e.g., React, Node.js, CSS)',
                'Databases (e.g., SQL, MongoDB, PostgreSQL)',
                'Software development concepts (e.g., OOP, Algorithms, Design Patterns)',
                'DevOps (e.g., Docker, Kubernetes, CI/CD)',
                'Cloud computing (e.g., AWS, Azure, GCP)'
              ],
              isTopicError: true
            });
          }
          
          // For other errors in the response
          return res.status(400).json({
            error: 'Quiz Generation Failed',
            message: responseData.error,
            isTopicError: false
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to parse quiz response:', errorMessage);
        return res.status(500).json({
          error: 'Invalid response format from quiz generation service',
          details: errorMessage
        });
      }

      // Handle both 'quiz' and 'questions' array in the response
      const questions = responseData.quiz || [];
      
      if (!Array.isArray(questions)) {
        console.error('Invalid quiz format from backend:', responseData);
        return res.status(500).json({
          error: 'Generated quiz has invalid format',
          details: 'Expected quiz or questions array in the response',
          response: responseData
        });
      }
      
      // If questions array is empty, log a warning but don't fail
      if (questions.length === 0) {
        console.warn('Received empty questions array from backend');
      }

      // Return the generated quiz data
      return res.status(201).json({
        ...responseData,
        questions, // Ensure questions are in the 'questions' field
        quiz: questions, // Also include 'quiz' for backward compatibility
        user_id: userIdStr
      });
      
    } catch (error: any) {
      console.error('Error in quiz creation:', error);
      const errorMessage = error?.message || 'An unknown error occurred';
      return res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }
}
