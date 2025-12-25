import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { getCompanyId } from '@/lib/company';

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

async function fetchQuizzes(token: string, company_id: string) {
  const url = `${BACKEND_BASE_URL}/user/${company_id}/quizzes`;
  
  console.log('Fetching quizzes:', { url, company_id });

  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    next: { revalidate: 0 } // Disable caching
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Failed to fetch quizzes:', errorData);
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch quizzes');
  }

  return response.json();
}

async function createQuiz(company_id: string, token: string, body: any) {
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
    role: body.role,
    techStack: body.techStack || [],
    difficulty: body.difficulty || 'Bachelors Level',
    num_questions: body.num_questions || 25,
    theory_questions_percentage: theoryPercentage,
    code_analysis_questions_percentage: codePercentage,
    company_id: company_id,
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
    const { getToken, userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Get company_id from query params or fetch it
    const { searchParams } = new URL(request.url);
    let company_id = searchParams.get('companyId');

    // If no companyId provided, try to get it from the company check endpoint
    if (!company_id) {
      const companyResult = await getCompanyId(request);
      if ('error' in companyResult) {
        return companyResult.error;
      }
      company_id = companyResult.company_id;
    }

    console.log('GET /api/quizzes - Using company_id:', company_id);

    const quizzes = await fetchQuizzes(token, company_id);
    return NextResponse.json(quizzes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get company ID first
    const companyResult = await getCompanyId(request);
    if ('error' in companyResult) {
      return companyResult.error;
    }
    const { company_id } = companyResult;

    const { userId, getToken } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Add company_id to the request body
    body.company_id = company_id;
    const data = await createQuiz(company_id, token, body);
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
    
    const { getToken, userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
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