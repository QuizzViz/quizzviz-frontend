import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';

// Types
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type PublishedQuiz = {
  quiz_key: string;
  quiz_id: string;
  user_id: string;
  quiz_public_link: string;
  max_attempts: number;
  quiz_time: number;
  quiz_expiration_time: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: any[];
  is_publish?: boolean; // Add optional is_publish property
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<PublishedQuiz>>
) {
  // Handle only GET and DELETE requests
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
    return;
  }

  try {
    // Authentication check
    const { userId, getToken } = getAuth(req);
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }

    // Get the session token
    const token = await getToken();
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication token not found' 
      });
      return;
    }

    // Extract route parameters
    const { userId: paramUserId, quizId } = req.query as { 
      userId: string; 
      quizId: string; 
    };

    if (!paramUserId || !quizId) {
      res.status(400).json({ 
        success: false,
        message: 'User ID and Quiz ID are required' 
      });
      return;
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      try {
        const deleteResponse = await fetch(
          `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${paramUserId}/quiz/${quizId}`,
          {
            method: 'DELETE',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Delete API error:', deleteResponse.status, errorText);
          res.status(deleteResponse.status).json({
            success: false,
            message: 'Failed to unpublish quiz',
            error: errorText
          });
          return;
        }

        res.status(204).end();
        return;
      } catch (error) {
        console.error('Error in DELETE handler:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error during unpublish',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }
    }

    // Handle GET request (original functionality)
    let user;
    try {
      const clerk = await clerkClient();
      user = await clerk.users.getUser(paramUserId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    const username = (user.username || user.firstName || 'user').toLowerCase().replace(/\s+/g, '');
    
    // Get the origin from the request headers
    const origin = req.headers.origin || req.headers.host 
      ? `${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}`  
      : '';
    
    // Fetch published quiz from external API using the username
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/public/quiz/${encodeURIComponent(`${origin}/${username}/take/quiz/${quizId}`)}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', response.status, errorText);
      res.status(response.status).json({ 
        success: false,
        message: 'Failed to fetch published quiz',
        error: errorText
      });
      return;
    }

    let quizData: PublishedQuiz = await response.json();
    
    // Check if the quiz has expired
    if (quizData.quiz_expiration_time) {
      const expirationDate = new Date(quizData.quiz_expiration_time);
      const now = new Date();
      console.log(`Time now: ${now}`);
      console.log(`Expiration time: ${expirationDate}`);
      
      if (now > expirationDate) {
        console.log(`Quiz ${quizId} has expired, unpublishing...`);
        
        try {
          // First, update the quiz in the quiz generation service
          const updateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/user/${paramUserId}/quizz/${quizId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
              },
              body: JSON.stringify({
                is_publish: false,
                ...quizData
              })
            }
          );

          if (!updateResponse.ok) {
            console.error('Failed to update quiz generation service:', await updateResponse.text());
            throw new Error('Failed to update quiz status');
          }

          // Then, call the unpublish endpoint
          const deleteResponse = await fetch(
            `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${paramUserId}/quiz/${quizId}`,
            {
              method: 'DELETE',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (deleteResponse.ok) {
            console.log(`Successfully unpublished expired quiz ${quizId}`);
            // Update the quiz data to reflect it's no longer published
            quizData = {
              ...quizData,
              is_publish: false,
              quiz_public_link: ''
            };

            // Send quiz expired email notification after successful unpublish
            try {
              const emailResponse = await fetch(
                `/app/api/send_email/quiz-expired`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    recipient_email: user.emailAddresses?.[0]?.emailAddress || '',
                    user_name: user.firstName,
                    quiz_title: quizData.role,
                    expiry_date: quizData.quiz_expiration_time
                  })
                }
              );
              
              if (!emailResponse.ok) {
                const error = await emailResponse.text();
                console.error('Failed to send quiz expired email:', error);
              } else {
                console.log('Successfully sent quiz expired email');
              }
            } catch (emailError) {
              console.error('Error sending quiz expired email:', emailError);
            }
          } else {
            const errorText = await deleteResponse.text();
            console.error('Failed to unpublish expired quiz:', errorText);
            throw new Error(`Failed to unpublish quiz: ${errorText}`);
          }
        } catch (error) {
          console.error('Error unpublishing expired quiz:', error);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: quizData
    });
    return;

  } catch (error) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}
