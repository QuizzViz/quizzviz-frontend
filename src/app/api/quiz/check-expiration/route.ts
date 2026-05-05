import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getCompanyId } from '@/lib/company';
import { isQuizExpired } from '@/utils/timezoneUtils';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL;
const PUBLISH_SERVICE_URL = process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL;

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    {
      error: error?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    },
    { status: 500 }
  );
};

async function sendExpirationEmail(userEmail: string, userName: string, quizTitle: string, expirationTime: string) {
  try {
    const response = await fetch('/api/send_email/quiz-expired', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_email: userEmail,
        user_name: userName,
        quiz_title: quizTitle,
        expiry_date: expirationTime
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send expiration email:', error);
      return false;
    }

    console.log('Successfully sent expiration email to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending expiration email:', error);
    return false;
  }
}

async function unpublishQuiz(companyId: string, quizId: string, token: string) {
  try {
    // Update quiz generation service to set is_publish to false
    const updateResponse = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizz/${quizId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          is_publish: false,
          public_link: null,
          quiz_key: null
        })
      }
    );

    if (!updateResponse.ok) {
      console.error('Failed to update quiz generation service:', await updateResponse.text());
      return false;
    }

    // Unpublish from publish service
    const deleteResponse = await fetch(
      `${PUBLISH_SERVICE_URL}/publish/user/${companyId}/quiz/${quizId}`,
      {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!deleteResponse.ok) {
      console.error('Failed to unpublish from publish service:', await deleteResponse.text());
      return false;
    }

    console.log(`Successfully unpublished expired quiz ${quizId}`);
    return true;
  } catch (error) {
    console.error('Error unpublishing quiz:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Get company ID
    const companyResult = await getCompanyId(request);
    if ('error' in companyResult) {
      return companyResult.error;
    }
    const companyId = companyResult.company_id;

    // Get all quizzes for the company
    const quizzesResponse = await fetch(`${BACKEND_BASE_URL}/user/${companyId}/quizzes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });

    if (!quizzesResponse.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    const quizzes = await quizzesResponse.json();
    const now = new Date();
    let processedCount = 0;
    let expiredCount = 0;
    const errors: string[] = [];

    // Process each quiz
    for (const quiz of quizzes) {
      try {
        processedCount++;
        
        // Check if quiz is published and has expiration time
        if (!quiz.is_publish || !quiz.quiz_expiration_time) {
          continue;
        }

        // Check if quiz has expired (timezone-aware)
        if (isQuizExpired(quiz.quiz_expiration_time)) {
          console.log(`Processing expired quiz: ${quiz.quiz_id} (${quiz.role || quiz.topic})`);
          expiredCount++;

          // Unpublish the quiz
          const unpublishSuccess = await unpublishQuiz(companyId, quiz.quiz_id, token);
          
          if (unpublishSuccess) {
            // Send expiration email - we need to get user info from the quiz owner
            // For now, use a generic approach since user info might not be in quiz object
            await sendExpirationEmail(
              'user@example.com', // This would need to be fetched from user service
              'Quiz Owner',
              quiz.role || quiz.topic || 'Quiz',
              quiz.quiz_expiration_time
            );
          } else {
            errors.push(`Failed to unpublish quiz ${quiz.quiz_id}`);
          }
        }
      } catch (error) {
        const errorMsg = `Error processing quiz ${quiz.quiz_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} quizzes, found ${expiredCount} expired quizzes`,
      processed: processedCount,
      expired: expiredCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    return handleApiError(error);
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
