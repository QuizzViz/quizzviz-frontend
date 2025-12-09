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
    
    // Handle tech_stack - ensure it's an array of {name: string, weight: number}
    const tech_stack = requestData.tech_stack || requestData.techStack || [];
    let techStackArray: Array<{name: string, weight: number}> = [];

    try {
      // If it's a string, try to parse it as JSON
      if (typeof tech_stack === 'string') {
        try {
          const parsed = JSON.parse(tech_stack);
          if (Array.isArray(parsed)) {
            techStackArray = parsed.map(item => ({
              name: String(item.name || item.value || '').trim(),
              weight: Math.max(0, Math.min(100, Number(item.weight) || 0))
            })).filter(item => item.name);
          }
        } catch (e) {
          // If parsing fails, treat as comma-separated list with equal weights
          techStackArray = tech_stack.split(',')
            .map((item: string) => ({
              name: item.trim(),
              weight: 0
            }))
            .filter((item: any) => item.name);
        }
      } 
      // If it's already an array
      else if (Array.isArray(tech_stack)) {
        techStackArray = tech_stack.map(item => {
          if (typeof item === 'string') {
            return { 
              name: item.trim(), 
              weight: 0 
            };
          }
          return {
            name: String(item?.name || item?.value || '').trim(),
            weight: Math.max(0, Math.min(100, Number(item?.weight) || 0))
          };
        }).filter(item => item.name);
      }

      // Normalize weights to sum to 100 if there are any non-zero weights
      const totalWeight = techStackArray.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight > 0) {
        const scale = 100 / totalWeight;
        techStackArray = techStackArray.map(item => ({
          ...item,
          weight: Math.round(item.weight * scale * 100) / 100 // Round to 2 decimal places
        }));
      } else if (techStackArray.length > 0) {
        // If all weights are 0, distribute equally
        const equalWeight = 100 / techStackArray.length;
        techStackArray = techStackArray.map(item => ({
          ...item,
          weight: Math.round(equalWeight * 100) / 100
        }));
      }
      
      // Adjust last item to ensure total is exactly 100 due to rounding
      if (techStackArray.length > 0) {
        const finalTotal = techStackArray.reduce((sum, item) => sum + item.weight, 0);
        if (Math.abs(finalTotal - 100) > 0.01) { // Allow for floating point imprecision
          techStackArray[techStackArray.length - 1].weight += 100 - finalTotal;
          techStackArray[techStackArray.length - 1].weight = 
            Math.round(techStackArray[techStackArray.length - 1].weight * 100) / 100;
        }
      }

    } catch (error) {
      console.error('Error processing tech stack:', error);
      techStackArray = [];
    }

    console.log('Processed tech stack:', JSON.stringify(techStackArray, null, 2));

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
    console.log(`Path: ${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/quizz`)
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