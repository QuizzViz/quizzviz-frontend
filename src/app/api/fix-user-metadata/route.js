import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { getToken, userId } = getAuth(request);
    const token = await getToken();
    
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { companyId, companyName, planName } = await request.json();

    // Update user metadata via Clerk API
    const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        unsafe_metadata: {
          companyId,
          companyName,
          planName
        }
      })
    });

    if (!clerkResponse.ok) {
      const error = await clerkResponse.json();
      return NextResponse.json(
        { error: 'Failed to update Clerk metadata', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User metadata updated successfully',
      updated: {
        companyId,
        companyName,
        planName
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
