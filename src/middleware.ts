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

  // Add security headers to prevent clickjacking
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Set security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 1. Bots bypass everything
  if (isBot) {
    return response;
  }

  // 2. Public routes bypass auth checks
  if (isPublicRoute(request)) {
    return response;
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
        return response;
      }
      
      // Authenticated users: redirect to dashboard (OAuth handled by Clerk)
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      redirectResponse.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return redirectResponse;
    }

    // If user is not signed in and trying to access protected route, redirect to signup
    if (!userId && !isPublicRoute(request)) {
      const signupRedirect = NextResponse.redirect(new URL('/signup', request.url));
      signupRedirect.headers.set('X-Frame-Options', 'DENY');
      signupRedirect.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
      signupRedirect.headers.set('X-Content-Type-Options', 'nosniff');
      signupRedirect.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return signupRedirect;
    }

    // Handle onboarding flow
    if (pathname === '/onboarding') {
      if (hasCompany) {
        const onboardingRedirect = NextResponse.redirect(new URL('/dashboard', request.url));
        onboardingRedirect.headers.set('X-Frame-Options', 'DENY');
        onboardingRedirect.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
        onboardingRedirect.headers.set('X-Content-Type-Options', 'nosniff');
        onboardingRedirect.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return onboardingRedirect;
      }
      return response;
    }

    // Handle dashboard access - let DashboardAccess component handle validation
    if (pathname.startsWith('/dashboard')) {
      return response;
    }

    // User is authenticated - allow access to other protected routes
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    const errorResponse = NextResponse.redirect(new URL('/error', request.url));
    errorResponse.headers.set('X-Frame-Options', 'DENY');
    errorResponse.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
    errorResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return errorResponse;
  }
});

export const config = {
  matcher: [
    '/((?!.*\\.|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};