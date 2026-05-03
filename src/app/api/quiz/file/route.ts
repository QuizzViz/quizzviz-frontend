import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { getCompanyId } from '@/lib/company';


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
    
    // Parse form data first to get company_id
    const formData = await req.formData();
    const companyIdFromForm = formData.get('company_id') as string;
    
    // Validate company ID directly since we already have it from form data
    if (!companyIdFromForm) {
      return NextResponse.json({
        error: 'Company ID is required',
        details: 'Company ID must be provided in form data'
      }, { status: 400 });
    }
    
    const companyId = companyIdFromForm;

    
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

    // Company info is already validated by getCompanyId, no need for additional check

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
    
    console.log('Backend FormData contents:');
    for (let [key, value] of backendFormData.entries()) {
      console.log(`  ${key}:`, value);
    }

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
    console.error('Error details:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      status: err?.status
    });
    return NextResponse.json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
