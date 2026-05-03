import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";

// Helper function to get company ID for a user
async function getCompanyId(userId: string, token: string): Promise<string> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/company/check?owner_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    if (!data.companies || data.companies.length === 0) {
      throw new Error('No company found for this user');
    }

    return data.companies[0].id;
  } catch (error) {
    console.error('Error fetching company ID:', error);
    throw new Error('Failed to get company information');
  }
}

// Helper function to get company info
async function getCompanyInfo(userId: string, token: string): Promise<{id: string; name: string; owner_email: string} | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/company/check?owner_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    if (!data.companies || data.companies.length === 0) {
      return null;
    }

    return {
      id: data.companies[0].id,
      name: data.companies[0].name,
      owner_email: data.companies[0].owner_email
    };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
}

const BACKEND_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/quizz-from-file`;

export async function POST(req: NextRequest) {
  try {
    // Get authentication details from Clerk
    const auth = getAuth(req);
    const { userId: authUserId } = auth;
    
    if (!authUserId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session'
      }, { status: 401 });
    }
    
    // Get the session token from cookies
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    
    const sessionToken = cookies.__session || '';
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No authentication token found in cookies'
      }, { status: 401 });
    }
    
    // Get company ID for the user
    const companyId = await getCompanyId(authUserId, sessionToken);

    // Parse form data
    const formData = await req.formData();
    
    // Extract required fields
    const file = formData.get('file') as File;
    const role = formData.get('role') as string;
    const experience = formData.get('experience') as string || "1-3";
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 10;
    const theoryQuestionsPercentage = parseInt(formData.get('theoryQuestionsPercentage') as string) || 50;
    const codeAnalysisQuestionsPercentage = parseInt(formData.get('codeAnalysisQuestionsPercentage') as string) || 50;
    const isPublish = formData.get('isPublish') === 'true';
    const isDeleted = formData.get('isDeleted') === 'true';

    // Validate required fields
    if (!file) {
      return NextResponse.json({ 
        error: 'Bad Request',
        details: 'File is required'
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ 
        error: 'Bad Request',
        details: 'Role is required'
      }, { status: 400 });
    }

    // Get company information
    const companyInfo = await getCompanyInfo(authUserId, sessionToken);
    
    if (!companyInfo) {
      return NextResponse.json({
        error: 'Company not found',
        details: 'Please create or join a company first'
      }, { status: 403 });
    }

    // Create FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('role', role);
    backendFormData.append('experience', experience);
    backendFormData.append('num_questions', numQuestions.toString());
    backendFormData.append('theory_questions_percentage', theoryQuestionsPercentage.toString());
    backendFormData.append('code_analysis_questions_percentage', codeAnalysisQuestionsPercentage.toString());
    backendFormData.append('company_id', companyId);
    backendFormData.append('is_publish', isPublish.toString());
    backendFormData.append('is_deleted', isDeleted.toString());

    console.log('Sending file-based quiz generation request:', {
      url: BACKEND_URL,
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${sessionToken}`
      },
      body: {
        role,
        experience,
        num_questions: numQuestions,
        company_id: companyId,
        file_size: file.size,
        file_type: file.type
      }
    });

    const backendResp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: backendFormData,
    });

    const contentType = backendResp.headers.get('content-type') || '';

    if (!backendResp.ok) {
      let errorData;
      try {
        errorData = await backendResp.json();
      } catch (e) {
        errorData = { error: await backendResp.text() };
      }
      
      // Check for non-software topic error
      if (backendResp.status === 400 && errorData.error?.includes('not a software development topic')) {
        return NextResponse.json({
          error: 'Please provide a software development related topic',
          details: errorData.error
        }, { status: 400 });
      }

      return NextResponse.json({
        error: 'Quiz Generation Failed',
        message: errorData?.error || 'Unknown error occurred',
        isTopicError: false
      }, { status: backendResp.status });
    }

    let responseData;
    try {
      responseData = await backendResp.json();
      
      if (responseData.error) {
        return NextResponse.json({
          error: 'Quiz Generation Failed',
          message: responseData.error,
          isTopicError: false
        }, { status: 400 });
      }
      
      return NextResponse.json(responseData, { status: 200 });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to parse quiz response:', errorMessage);
      return NextResponse.json({
        error: 'Invalid response format from quiz generation service',
        details: errorMessage
      }, { status: 500 });
    }
    
  } catch (err: any) {
    console.error('API error in /api/quiz/file:', err);
    return NextResponse.json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
