import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { userId, getToken } = getAuth(request);
  
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  try {
    const requestData = await request.json();
    console.log('Received publish request data:', JSON.stringify(requestData, null, 2));
    
    // Handle tech_stack - convert to the format expected by the API
    const tech_stack = requestData.tech_stack || requestData.techStack || [];
    const techStackArray = typeof tech_stack === 'string' 
      ? tech_stack.split(',').map((item: string) => ({ 
          name: item.trim(), 
          weight: 1 
        })).filter((item: any) => item.name)
      : Array.isArray(tech_stack) 
        ? tech_stack.map((item: any) => 
            typeof item === 'string' 
              ? { name: item, weight: 1 }
              : { name: item.name || item, weight: item.weight || 1 }
          ).filter((item: any) => item.name)
        : [];

    const {
      quiz_id,
      settings = {},
      questions = [],
      title = '',
      publicLink = '',
      topic = '',
      role = '', 
      difficulty = 'medium',
      timeLimit = 30,
      maxAttempts = 1,
      expirationDate,
      isPublic,
      secretKey = ''
    } = requestData;

    // Validate required fields
    if (!quiz_id) {
      return NextResponse.json(
        { message: 'Missing quiz_id' },
        { status: 400 }
      );
    }

    if (!questions.length) {
      return NextResponse.json(
        { message: 'Quiz must have at least one question' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { message: 'Missing role field' },
        { status: 400 }
      );
    }

    // Get the authentication token
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Calculate question type percentages
    const totalQuestions = questions.length;
    const theoryCount = questions.filter((q: any) => q.type === 'theory').length;
    const codeAnalysisCount = questions.filter((q: any) => q.type === 'code_analysis').length;
    
    const theoryPercentage = Math.round((theoryCount / totalQuestions) * 100);
    const codeAnalysisPercentage = Math.round((codeAnalysisCount / totalQuestions) * 100);

    // Use the publicLink directly from the request
    if (!publicLink) {
      return NextResponse.json(
        { message: 'Public link is required' },
        { status: 400 }
      );
    }

    // Format expiration date to ISO string
    const formattedExpirationDate = expirationDate 
      ? new Date(expirationDate).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Prepare the request body for the external API
    const requestBody = {
      quiz_id,
      user_id: userId,
      role: role, // CRITICAL: Include role field
      tech_stack: techStackArray, // Format as array of objects with name and weight
      difficulty: difficulty || 'medium',
      num_questions: totalQuestions,
      theory_questions_percentage: theoryPercentage,
      code_analysis_questions_percentage: codeAnalysisPercentage,
      quiz: questions,
      quiz_public_link: publicLink,
      quiz_key: secretKey,
      max_attempts: maxAttempts,
      quiz_time: timeLimit,
      quiz_expiration_time: formattedExpirationDate
    };
    
    console.log('Sending to external API:', JSON.stringify({
      ...requestBody,
      quiz: `[${requestBody.quiz.length} questions]`,
      tech_stack: requestBody.tech_stack
    }, null, 2));
    
    // Update the quiz to mark it as published
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...vals] = c.trim().split('=');
          return [key, vals.join('=')];
        })
      );
      
      const sessionToken = cookies.__session || '';
      
      if (sessionToken) {
        try {
          const backendUrl = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/user/${encodeURIComponent(userId)}/quizz/${encodeURIComponent(quiz_id)}`;
          
          console.log('Updating quiz status with URL:', backendUrl);
          
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
              quiz_expiration_time: formattedExpirationDate,
              quiz_key: secretKey
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
        }
      }
    } catch (updateError) {
      console.error('Error updating quiz published status:', updateError);
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
      return NextResponse.json(
        { 
          message: 'Failed to publish quiz',
          error: errorData
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    
    return NextResponse.json({ 
      success: true,
      message: responseData.message || 'Quiz published successfully',
      data: responseData,
      publicUrl: publicLink
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}