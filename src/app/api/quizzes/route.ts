import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}`;

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    { 
      error: error?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    { status: 500 }
  );
};

async function fetchQuizzes(userId: string, token: string) {
  const url = `${BACKEND_BASE_URL}/user/${encodeURIComponent(userId)}/quizzes`;
  
  console.log('Fetching quizzes:', { url, userId });

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    next: { revalidate: 0 } // Disable caching
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch quizzes');
  }

  return response.json();
}

async function createQuiz(userId: string, token: string, body: any) {
  if (!body) {
    throw new Error('Request body is required');
  }

  // Calculate percentages
  let codePercentage = 50;
  let theoryPercentage = 50;
  
  if (body.code_analysis_questions_percentage !== undefined) {
    codePercentage = Math.max(0, Math.min(100, Number(body.code_analysis_questions_percentage)));
    theoryPercentage = 100 - codePercentage;
  } else if (body.theory_questions_percentage !== undefined) {
    theoryPercentage = Math.max(0, Math.min(100, Number(body.theory_questions_percentage)));
    codePercentage = 100 - theoryPercentage;
  }

  const payload = {
    role: body.role || 'Software Engineer',
    techStack: body.techStack || [],
    difficulty: body.difficulty || 'Bachelors Level',
    num_questions: body.num_questions || 25,
    theory_questions_percentage: theoryPercentage,
    code_analysis_questions_percentage: codePercentage,
    user_id: userId,
    isPublished: false
  };

  // Validate tech stack
  if (!Array.isArray(payload.techStack) || payload.techStack.length === 0) {
    throw new Error('At least one technology is required in the tech stack');
  }

  const totalWeight = payload.techStack.reduce((sum, tech) => sum + (tech.weight || 0), 0);
  if (Math.abs(totalWeight - 100) > 1) {
    throw new Error('Tech stack weights must sum to 100%');
  }

  console.log('Creating quiz with payload:', payload);

  const response = await fetch(`${BACKEND_BASE_URL}/quizz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Failed to create quiz');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const auth = getAuth(request);
    const token = request.cookies.get('__session')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const effectiveUserId = auth.userId || userId;
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = await fetchQuizzes(effectiveUserId, token);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in GET /api/quizzes:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const auth = getAuth(request);
    const token = request.cookies.get('__session')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const effectiveUserId = auth.userId || userId;
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = await createQuiz(effectiveUserId, token, body);
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/quizzes:', error);
    return handleApiError(error);
  }
}

// Handle DELETE method for quizzes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const token = request.cookies.get('__session')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_BASE_URL}/quizz/${quizId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to delete quiz');
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error in DELETE /api/quizzes:', error);
    return handleApiError(error);
  }
}

// PUT method (not implemented)
export async function PUT() {
  return new NextResponse(null, { 
    status: 405,
    headers: { 'Allow': 'GET, POST, DELETE' }
  });
}
