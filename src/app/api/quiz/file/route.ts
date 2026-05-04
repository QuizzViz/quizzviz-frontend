import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { getCompanyId } from '@/lib/company';


const BACKEND_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/quizz-from-file`;

export async function POST(req: NextRequest) {
  try {
    // Get authentication details from Clerk
    const auth = getAuth(req);
    const { userId: authUserId, getToken } = auth;
    
    if (!authUserId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session'
      }, { status: 401 });
    }
    
    // Use Clerk's getToken() instead of reading cookies manually
    const sessionToken = await getToken();
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No authentication token found'
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
    const files = formData.getAll('files') as File[];
    const role = formData.get('role') as string;
    const experience = formData.get('experience') as string || "1-3";
    const numQuestions = parseInt(formData.get('num_questions') as string) || 10;
    const theoryQuestionsPercentage = parseInt(formData.get('theory_questions_percentage') as string) || 50;
    const codeAnalysisQuestionsPercentage = parseInt(formData.get('code_analysis_questions_percentage') as string) || 50;
    const isPublish = formData.get('is_publish') === 'true';
    const isDeleted = formData.get('is_deleted') === 'true';

    // Validate required fields
    if (!files || files.length === 0) {
      return NextResponse.json({ 
        error: 'Bad Request',
        details: 'At least one file is required'
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ 
        error: 'Bad Request',
        details: 'Role is required'
      }, { status: 400 });
    }

    // Company info is already validated by getCompanyId, no need for additional check

    // ✅ FIX: Send non-file params as URL query parameters
    const params = new URLSearchParams({
      role,
      experience,
      num_questions: numQuestions.toString(),
      theory_questions_percentage: theoryQuestionsPercentage.toString(),
      code_analysis_questions_percentage: codeAnalysisQuestionsPercentage.toString(),
      company_id: companyId,
      is_publish: isPublish.toString(),
      is_deleted: isDeleted.toString(),
    });

    const BACKEND_URL_WITH_PARAMS = `${BACKEND_URL}?${params.toString()}`;

    // ✅ FIX: Send all files in FormData
    const backendFormData = new FormData();
    files.forEach((file, index) => {
      backendFormData.append('file', file);  // Backend expects 'file' (singular)
    });

    // Debug: Log FormData contents (should contain all files now)
    console.log('Backend FormData contents:');
    for (const [key, value] of backendFormData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    console.log(`Total files being sent: ${files.length}`);

    console.log('Sending file-based quiz generation request:', {
      url: BACKEND_URL_WITH_PARAMS,
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${sessionToken}`
      },
      queryParams: {
        role,
        experience,
        num_questions: numQuestions,
        company_id: companyId,
        theory_questions_percentage: theoryQuestionsPercentage,
        code_analysis_questions_percentage: codeAnalysisQuestionsPercentage,
        is_publish: isPublish,
        is_deleted: isDeleted
      },
      files: files.map(f => ({
        file_size: f.size,
        file_type: f.type,
        file_name: f.name
      }))
    });
    
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Backend URL:', BACKEND_URL_WITH_PARAMS);
    console.log('Session token exists:', !!sessionToken);
    console.log('Query parameters:', params.toString());
    console.log('FormData entries:');
    for (let [key, value] of backendFormData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - name: ${value.name}, size: ${value.size}, type: ${value.type}`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }

    const backendResp = await fetch(BACKEND_URL_WITH_PARAMS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
        // Do NOT set Content-Type — let fetch set multipart boundary automatically
      },
      body: backendFormData,
    });

    console.log('Backend response status:', backendResp.status);
    console.log('Backend response headers:', Object.fromEntries(backendResp.headers.entries()));

    const contentType = backendResp.headers.get('content-type') || '';

    if (!backendResp.ok) {
      let errorData;
      try {
        errorData = await backendResp.json();
        console.error('Backend error response:', errorData);
      } catch (e) {
        const errorText = await backendResp.text();
        errorData = { error: errorText };
        console.error('Backend error text:', errorText);
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
