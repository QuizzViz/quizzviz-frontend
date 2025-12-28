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
      secretKey,
      tech_stack = [] // Add tech_stack with default empty array
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

    // Prepare the request body for the external API
    const requestBody = {
      quiz_id,
      user_id: userId,
      title: title || topic || 'Untitled Quiz',
      topic: topic || 'General',
      difficulty: difficulty || 'medium',
      num_questions: totalQuestions,
      theory_questions_percentage: theoryPercentage,
      code_analysis_questions_percentage: codeAnalysisPercentage,
      quiz: questions,
      quiz_public_link: publicLink,
      quiz_key: secretKey,
      max_attempts: maxAttempts,
      quiz_time: timeLimit,
      quiz_expiration_time: expirationDate,
      is_publish: true, // Using is_publish to match backend field name
      tech_stack: Array.isArray(tech_stack) ? tech_stack : [] // Include tech_stack in the request
    };
    
    // Prepare the update payload for the quiz
    const updatePayload = {
      quiz_id,
      is_publish: true,
      public_link: publicLink,
      max_attempts: maxAttempts,
      quiz_time: timeLimit,
      quiz_expiration_time: expirationDate
    };

    // Update the quiz to mark it as published
    try {
      // Get the session token from the request cookies
      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...vals] = c.trim().split('=');
          return [key, vals.join('=')];
        })
      );
      
      const sessionToken = cookies.__session || '';
      
      if (!sessionToken) {
        console.error('No session token found in cookies');
        // Continue with the publish process even if we can't update the status
      } else {
        try {
          // Call the backend API directly to update the quiz status
          const backendUrl = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/user/${encodeURIComponent(userId)}/quizz/${encodeURIComponent(quiz_id)}`;
          
          console.log('Updating quiz status with URL:', backendUrl);
          console.log('Using session token:', sessionToken ? '***' : 'none');
          
          const updateResponse = await fetch(backendUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`,
              'Cookie': `__session=${sessionToken}`,
              'x-user-id': userId
            },
            credentials: 'include',
            body: JSON.stringify({
              is_publish: true,
              public_link: publicLink,
              max_attempts: maxAttempts,
              quiz_time: timeLimit,
              quiz_expiration_time: expirationDate,
              quiz_key: secretKey,
              tech_stack: Array.isArray(tech_stack) ? tech_stack : [] // Include tech_stack in the update
            })
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update quiz published status:', {
              status: updateResponse.status,
              statusText: updateResponse.statusText,
              error: errorText
            });
          } else {
            console.log('Successfully updated quiz published status');
          }
        } catch (error) {
          console.error('Error updating quiz status:', error);
          // Continue with publishing even if the update fails
        }
      }
    } catch (updateError) {
      console.error('Error updating quiz published status:', updateError);
      // Continue with publishing even if the update fails, but log the error
    }

    // Call the external API with proper authorization
    const response = await fetch(`${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/quizz`, {
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


