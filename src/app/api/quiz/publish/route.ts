import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request);

  try {
    const requestData = await request.json();
    console.log('Received publish request data:', JSON.stringify(requestData, null, 2));

    // ────────────────────────────────────────────────
    // Extract companyId from body (this is the main change)
    // ────────────────────────────────────────────────
    const { companyId } = requestData;

    if (!companyId) {
      return NextResponse.json(
        { message: 'companyId is required in request body' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────
    // Process tech stack (unchanged logic, just keeping it)
    // ────────────────────────────────────────────────
    const tech_stack = requestData.tech_stack || requestData.techStack || [];
    let techStackArray: Array<{ name: string; weight: number }> = [];

    try {
      if (typeof tech_stack === 'string') {
        try {
          const parsed = JSON.parse(tech_stack);
          if (Array.isArray(parsed)) {
            techStackArray = parsed.map(item => ({
              name: String(item.name || item.value || '').trim(),
              weight: Math.max(0, Math.min(100, Number(item.weight) || 0))
            })).filter(item => item.name);
          }
        } catch {
          // fallback: comma-separated
          techStackArray = tech_stack.split(',')
            .map(item => ({ name: item.trim(), weight: 0 }))
            .filter(item => item.name);
        }
      } else if (Array.isArray(tech_stack)) {
        techStackArray = tech_stack.map(item => {
          if (typeof item === 'string') {
            return { name: item.trim(), weight: 0 };
          }
          return {
            name: String(item?.name || item?.value || '').trim(),
            weight: Math.max(0, Math.min(100, Number(item?.weight) || 0))
          };
        }).filter(item => item.name);
      }

      // Normalize weights to sum ≈ 100
      const totalWeight = techStackArray.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight > 0) {
        const scale = 100 / totalWeight;
        techStackArray = techStackArray.map(item => ({
          ...item,
          weight: Math.round(item.weight * scale * 100) / 100
        }));
      } else if (techStackArray.length > 0) {
        const equalWeight = 100 / techStackArray.length;
        techStackArray = techStackArray.map(item => ({
          ...item,
          weight: Math.round(equalWeight * 100) / 100
        }));
      }

      // Fix rounding error on last item
      if (techStackArray.length > 0) {
        const finalTotal = techStackArray.reduce((sum, item) => sum + item.weight, 0);
        if (Math.abs(finalTotal - 100) > 0.01) {
          const last = techStackArray[techStackArray.length - 1];
          last.weight += 100 - finalTotal;
          last.weight = Math.round(last.weight * 100) / 100;
        }
      }
    } catch (err) {
      console.error('Error processing tech stack:', err);
      techStackArray = [];
    }

    console.log('Processed tech stack:', JSON.stringify(techStackArray, null, 2));

    // ────────────────────────────────────────────────
    // Destructure remaining fields
    // ────────────────────────────────────────────────
    const {
      quiz_id,
      settings = {},
      questions = [],
      title = '',
      publicLink = '',
      topic = '',
      role = '',
      difficulty = 'Bachelors Level',
      timeLimit = 30,
      maxAttempts = 1,
      expirationDate,
      isPublic,
      secretKey = ''
    } = requestData;

    // Basic validation
    if (!quiz_id) {
      return NextResponse.json({ message: 'Missing quiz_id' }, { status: 400 });
    }

    if (!questions.length) {
      return NextResponse.json({ message: 'Quiz must have at least one question' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ message: 'Missing role field' }, { status: 400 });
    }

    if (!publicLink) {
      return NextResponse.json({ message: 'Public link is required' }, { status: 400 });
    }

    // Get Clerk token
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Calculate question type stats
    const totalQuestions = questions.length;
    const theoryCount = questions.filter((q: any) => q.type === 'theory').length;
    const codeAnalysisCount = questions.filter((q: any) => q.type === 'code_analysis').length;

    const theoryPercentage = Math.round((theoryCount / totalQuestions) * 100);
    const codeAnalysisPercentage = Math.round((codeAnalysisCount / totalQuestions) * 100);

    // Format expiration
    const formattedExpirationDate = expirationDate
      ? new Date(expirationDate).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // ────────────────────────────────────────────────
    // Prepare body for external publish API
    // ────────────────────────────────────────────────
    const requestBody = {
      quiz_id,
      company_id: companyId,          // ← now using companyId from body
      role,
      tech_stack: techStackArray,
      difficulty,
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

    console.log('Sending to publish API:', JSON.stringify({
      ...requestBody,
      quiz: `[${requestBody.quiz.length} questions]`,
      tech_stack: requestBody.tech_stack
    }, null, 2));

    // ────────────────────────────────────────────────
    // Optional: Update quiz status in your backend
    // (using companyId instead of userId)
    // ────────────────────────────────────────────────
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
        const backendUrl = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/user/${encodeURIComponent(companyId)}/quizz/${encodeURIComponent(quiz_id)}`;

        console.log('Updating quiz status →', backendUrl);

        const updateResponse = await fetch(backendUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'Cookie': `__session=${sessionToken}`,
            'x-user-id': companyId   // ← also updated here
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
          console.warn('Failed to update quiz published status', await updateResponse.text());
        } else {
          console.log('Quiz publish status updated successfully');
        }
      }
    } catch (err) {
      console.error('Error while updating quiz status:', err);
      // non-blocking — continue even if this fails
    }

    // ────────────────────────────────────────────────
    // Call the external publish service
    // ────────────────────────────────────────────────
    const publishResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/quizz`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text().catch(() => 'Unknown error');
      console.error('Publish service failed:', errorText);
      return NextResponse.json(
        { message: 'Failed to publish quiz', error: errorText },
        { status: publishResponse.status }
      );
    }

    const responseData = await publishResponse.json();

    return NextResponse.json({
      success: true,
      message: responseData.message || 'Quiz published successfully',
      data: responseData,
      publicUrl: publicLink
    });

  } catch (error) {
    console.error('Publish endpoint error:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}