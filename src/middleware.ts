import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/not-allowed',
  '/sitemap.xml',
  '/robots.txt',
  '/mission',
  '/privacy-policy',
  '/terms',
  '/api(.*)',
  '/([^/]+)/take/quiz/([^/]+)',
  '/pricing',           // Public route
  '/onboarding',        // Public route (handled client-side)
  '/contact',           // Public route
  '/invite/(.*)',       // Public route for email links
  '/auth/callback',      // Auth callback for redirects
  '/accept_invite',      // Public route for invites
]);

// Bot detection
const searchEngineBots = [
  'googlebot',
  'google-inspectiontool',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot',
  'ia_archiver',
  'applebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot'
];

export default clerkMiddleware(async (auth, request) => {
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot = searchEngineBots.some(bot => ua.includes(bot));
  const { pathname } = request.nextUrl;

  // 1. Bots bypass everything
  if (isBot) {
    console.log(`Bot detected: ${ua}`);
    return NextResponse.next();
  }

  // 2. Public routes bypass auth checks
  if (isPublicRoute(request)) {
    console.log(`Public route: ${pathname}`);
    return NextResponse.next();
  }

  // 3. Protected routes - check authentication and handle redirects
  try {
    const { userId, sessionClaims } = await auth();
    
    // Type guard for public metadata
    interface PublicMetadata {
      onboardingComplete?: boolean;
      companyId?: string;
      planName?: string;
    }
    
    const publicMetadata = (sessionClaims?.publicMetadata || {}) as PublicMetadata;
    const onboardingComplete = publicMetadata.onboardingComplete === true;
    const hasCompany = !!publicMetadata.companyId;

    // Handle signin/signup pages specifically
    if (pathname === '/signin' || pathname === '/signup') {
      if (!userId) {
        // Unauthenticated users can access signin/signup
        return NextResponse.next();
      }
      
      // Authenticated users: check for OAuth intent
      const { searchParams } = request.nextUrl;
      const message = searchParams.get('message');
      const email = searchParams.get('email');
      
      // Allow access if there's a message or email parameter (OAuth redirect)
      if (message || email) {
        return NextResponse.next();
      }
      
      // Otherwise redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is not signed in and trying to access protected route, redirect to signup
    if (!userId && !isPublicRoute(request)) {
      return NextResponse.redirect(new URL('/signup', request.url));
    }

    // Handle onboarding flow
    if (pathname === '/onboarding') {
      if (hasCompany) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Handle dashboard access - let DashboardAccess component handle validation
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.next();
    }

    // User is authenticated - allow access to other protected routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
});

export const config = {
  matcher: [
    '/((?!.*\\.|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};