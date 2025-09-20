import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, getToken } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const {
      quiz_id,
      settings,
      questions,
      title,
      publicLink,
      topic,
      difficulty,
      timeLimit,
      maxAttempts,
      expirationDate,
      isPublic,
      secretKey 
    } = req.body;

    if (!quiz_id || !settings || !questions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the authentication token
    const token = await getToken();
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Calculate question type percentages
    const totalQuestions = questions.length;
    const theoryCount = questions.filter((q: any) => q.type === 'theory').length;
    const codeAnalysisCount = questions.filter((q: any) => q.type === 'code_analysis').length;
    
    const theoryPercentage = Math.round((theoryCount / totalQuestions) * 100);
    const codeAnalysisPercentage = Math.round((codeAnalysisCount / totalQuestions) * 100);

    // Use the publicLink directly from the PublishModal
    if (!publicLink) {
      return res.status(400).json({ message: 'Public link is required' });
    }

    // Format the request body using the values from PublishModal
    const requestBody = {
      quiz_id,
      user_id: userId,
      title,
      topic: topic, // From the page where quiz was created
      difficulty: difficulty, // From the page where quiz was created
      num_questions: totalQuestions,
      theory_questions_percentage: theoryPercentage,
      code_analysis_questions_percentage: codeAnalysisPercentage,
      quiz: questions,
      quiz_public_link: publicLink, // Directly from PublishModal
      quiz_key: secretKey, // Use the secretKey from the request body
      max_attempts: maxAttempts, // From PublishModal
      quiz_time: timeLimit, // From PublishModal
      quiz_expiration_time: expirationDate // From PublishModal
    };

    // Call the external API with proper authorization
    const response = await fetch('https://quizzviz-publish-quiz.up.railway.app/publish/quizz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => 'Unknown error');
      console.error('Publish API error:', errorData);
      return res.status(response.status).json({ 
        message: 'Failed to publish quiz',
        error: errorData
      });
    }

    const responseData = await response.json();
    
    return res.status(200).json({ 
      success: true,
      message: responseData.message || 'Quiz published successfully',
      data: responseData,
      publicUrl: publicLink
    });

  } catch (error) {
    console.error('Publish error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
