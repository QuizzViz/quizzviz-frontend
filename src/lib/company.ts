import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from 'next/server';

const COMPANY_SERVICE_URL = process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL;

if (!COMPANY_SERVICE_URL) {
  console.error('NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL is not defined in environment variables');
  throw new Error('Company service URL is not configured. Please check your environment variables.');
}

export interface CompanyDetails {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export async function getCompanyId(request: NextRequest): Promise<{ company_id: string } | { error: Response }> {
  try {
    const { userId, getToken } = getAuth(request);
    
    if (!userId) {
      return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
    }

    const token = await getToken();
    
    if (!token) {
      return { error: new Response(JSON.stringify({ error: 'Unauthorized - No token' }), { status: 401 }) };
    }

    const response = await fetch(`${COMPANY_SERVICE_URL}/companies?owner_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { 
        error: new Response(JSON.stringify({ 
          error: 'Failed to fetch company',
          details: error.detail || error.message || 'Unknown error' 
        }), { status: response.status })
      };
    }

    const responseData = await response.json();
    console.log('Company data received:', JSON.stringify(responseData, null, 2));
    
    // First, try to parse the response data
    let data;
    try {
      // Check if the response is a string that needs to be parsed
      data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    } catch (e) {
      console.error('Error parsing company data:', e);
      data = responseData; // Use as is if parsing fails
    }
    
    // Log the parsed data for debugging
    console.log('Parsed company data:', JSON.stringify(data, null, 2));
    
    let companyId: string | undefined;
    
    // Handle case where data is an array (direct response from /companies?owner_id=)
    if (Array.isArray(data) && data.length > 0) {
      companyId = data[0]?.company_id || data[0]?.id;
      console.log('Found company ID in array response:', companyId);
    }
    // Handle case where data is an object with a companies array
    else if (data && typeof data === 'object' && Array.isArray(data.companies) && data.companies.length > 0) {
      companyId = data.companies[0]?.company_id || data.companies[0]?.id;
      console.log('Found company ID in data.companies array:', companyId);
    }
    // Handle case where company_id is at the root
    else if (data?.company_id) {
      companyId = data.company_id;
      console.log('Found company ID at root level (company_id):', companyId);
    }
    // Handle case where id is at the root
    else if (data?.id) {
      companyId = data.id;
      console.log('Found company ID at root level (id):', companyId);
    }
    
    if (!companyId) {
      const errorMsg = 'No valid company ID found in response';
      console.error(errorMsg, { responseData, parsedData: data });
      return { 
        error: new Response(JSON.stringify({ 
          error: errorMsg,
          details: 'The company service response did not contain a valid company ID',
          responseData: data,
          rawResponse: responseData
        }, null, 2), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }
    
    console.log('Successfully extracted company ID:', companyId);
    return { company_id: companyId };
    
  } catch (error) {
    console.error('Error fetching company ID:', error);
    return { 
      error: new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500 })
    };
  }
}

export async function getCompanyDetails(userId: string, token: string): Promise<{ data: CompanyDetails } | { error: Response }> {
  try {
    if (!userId || !token) {
      return { 
        error: new Response(JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'User ID and token are required'
        }), { status: 400 })
      };
    }

    const response = await fetch(`${COMPANY_SERVICE_URL}/companies/owner/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { 
        error: new Response(JSON.stringify({ 
          error: 'Failed to fetch company details',
          details: error.detail || error.message || 'Unknown error'
        }), { status: response.status })
      };
    }

    const data: CompanyDetails = await response.json();
    return { data };
    
  } catch (error) {
    console.error('Error fetching company details:', error);
    return { 
      error: new Response(JSON.stringify({ 
        error: 'Internal server error while fetching company details',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500 })
    };
  }
}
