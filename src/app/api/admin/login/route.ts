import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createSessionToken, ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin login is not configured on the server' }, { status: 500 });
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
