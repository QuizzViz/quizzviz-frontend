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
          error: 'Failed to fetch company',
          details: error.detail || error.message || 'Unknown error' 
        }), { status: response.status })
      };
    }

    const data = await response.json();
    return { company_id: data.id };
    
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
