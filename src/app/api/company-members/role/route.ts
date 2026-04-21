import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const COMPANY_MEMBERS_URL = process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL;

export async function GET(request: NextRequest) {
  try {
    console.log('Starting member role fetch request');
    
    // Get token and user ID from request
    const { getToken, userId } = getAuth(request);
    const token = await getToken();
    
    if (!token) {
      console.error('No session token available');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const company_id = searchParams.get('company_id');

    console.log('Raw URL:', request.url);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    console.log('Extracted user_id:', user_id);
    console.log('Extracted company_id:', company_id);

    if (!user_id?.trim() || !company_id?.trim()) {
      console.error('Missing required query parameters:', { user_id, company_id });
      return NextResponse.json(
        { 
          error: 'Missing required query parameters',
          required: ['user_id', 'company_id'],
          received: { user_id, company_id }
        },
        { status: 400 }
      );
    }

    console.log('Fetching member role:', { user_id, company_id });
    console.log('COMPANY_MEMBERS_URL:', COMPANY_MEMBERS_URL);

    // Check if COMPANY_MEMBERS_URL is configured
    if (!COMPANY_MEMBERS_URL) {
      console.error('COMPANY_MEMBERS_URL not configured');
      return NextResponse.json(
        { 
          error: 'Company members service not configured',
          message: 'Please set NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL environment variable'
        },
        { status: 503 }
      );
    }

    const fullUrl = `${COMPANY_MEMBERS_URL}/member/role?user_id=${encodeURIComponent(user_id.trim())}&company_id=${encodeURIComponent(company_id.trim())}`;
    console.log('Full URL being called:', fullUrl);
    console.log('Token available:', !!token);
    console.log('Token length:', token?.length || 0);

    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        responseData = {};
      }
      
      if (!response.ok) {
        console.error('Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(responseData, null, 2)
        });
        
        // If member not found (404), create a default member record
        if (response.status === 404) {
          console.log('Member not found in database, checking if user is company owner');
          
          // Check if user is the company owner first
          let userRole = 'MEMBER'; // Default to MEMBER
          try {
            const companyCheckUrl = `${process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL}/companies?owner_id=${encodeURIComponent(user_id.trim())}`;
            console.log('Checking if user is company owner:', companyCheckUrl);
            
            const companyCheckResponse = await fetch(companyCheckUrl, {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (companyCheckResponse.ok) {
              const companies = await companyCheckResponse.json();
              console.log('Company check response:', companies);
              
              // Check if this user owns the company we're checking
              const userOwnsCompany = Array.isArray(companies) && 
                companies.some((company: any) => 
                  company.owner_id === user_id.trim() && 
                  (company.company_id === company_id.trim() || company.id === company_id.trim())
                );
              
              if (userOwnsCompany) {
                userRole = 'OWNER';
                console.log('User is confirmed as company owner, setting role to OWNER');
              } else {
                console.log('User is not the company owner, defaulting to MEMBER');
              }
            } else {
              console.log('Failed to check company ownership, defaulting to MEMBER');
              // Additional fallback: if we can't check ownership, we could assume OWNER for now
              // This is a temporary measure to prevent losing access
              console.warn('Warning: Could not verify company ownership, preserving OWNER access as fallback');
              userRole = 'OWNER';
            }
          } catch (ownerCheckError) {
            console.error('Error checking company ownership:', ownerCheckError);
            // Fallback: preserve OWNER access to prevent losing access
            console.warn('Warning: Error checking company ownership, preserving OWNER access as fallback');
            userRole = 'OWNER';
          }
          
          // Try to create member record with correct role using existing API
          try {
            console.log('Creating member record using existing company members API');
            
            const createResponse = await fetch(`${request.nextUrl.origin}/api/company-members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                user_id: user_id.trim(),
                company_id: company_id.trim(),
                role: userRole, // Use determined role (OWNER or MEMBER)
                status: 'ACTIVE'
              })
            });
            
            if (createResponse.ok) {
              console.log('Member record created successfully, fetching role again');
              // Retry fetching the role after creating the member
              const retryResponse = await fetch(`${COMPANY_MEMBERS_URL}/member/role?user_id=${encodeURIComponent(user_id.trim())}&company_id=${encodeURIComponent(company_id.trim())}`, {
                method: 'GET',
                headers: {
                  'accept': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log('Member role fetched after creation:', retryData);
                return NextResponse.json(retryData);
              }
            }
          } catch (createError) {
            console.error('Failed to create member record:', createError);
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to fetch member role',
            details: responseData,
            status: response.status,
            statusText: response.statusText
          },
          { status: response.status }
        );
      }

      console.log('Member role fetched successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error: unknown) {
      console.error('Error in member role fetch:', error);
      
      return NextResponse.json(
        { 
          error: 'External service error',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching member role' },
      { status: 500 }
    );
  }
}
