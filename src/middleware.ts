import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PLAN_TYPE } from './config/plans';

// 🧩 Wrap your existing Clerk middleware
export default clerkMiddleware(async (auth, request) => {

 

  // 👇 Custom logic starts here
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);

  // Example: assume user plan is stored in sessionClaims, e.g., sessionClaims.plan
  const userPlan = PLAN_TYPE

  // ✅ Block Business plan users on mobile for this dynamic route
  if (
    userPlan === 'Business' &&
    isMobile &&
    /^\/[^/]+\/take\/quiz\/[^/]+$/.test(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL('/not-allowed', request.url));
  }

  // Continue normally
  return NextResponse.next();
});

// ✅ Keep your existing Clerk matcher untouched
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
