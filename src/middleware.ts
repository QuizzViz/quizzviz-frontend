import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
    '/',
    '/about',
    '/pricing',
    '/not-allowed',
    '/sitemap.xml',
    '/robots.txt',
    '/mission',
    '/privacy-policy',
    '/terms',
    '/signin',
    '/signup',
    '/api(.*)',
    '/([^/]+)/take/quiz/([^/]+)'
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
  const url = request.nextUrl.clone();

  // Priority 1: Bots bypass everything
  if (isBot) {
    console.log(`Bot detected: ${ua}`);
    return NextResponse.next();
  }

  // Priority 2: Public routes bypass auth
  if (isPublicRoute(request)) {
    console.log(`Public route: ${pathname}`);
    return NextResponse.next();
  }

  // Priority 3: Protected routes - check auth
  try {
    const { userId, sessionClaims } = await auth();
    
    // If user is not signed in and the route is not public, redirect to sign-in
    if (!userId) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // If user is signed in and tries to access sign-in/up, redirect to dashboard
    if (userId && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Let the dashboard handle the onboarding state and redirections
    // No more automatic redirects based on onboarding status

    // User is authenticated - check for mobile restrictions
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
    
    // For middleware, we'll check the plan on the client side
    // as we can't access the user's plan in middleware directly
    if (pathname.startsWith('/quiz/') && isMobile) {
      // This is a mobile device trying to access a quiz
      // We'll let it through and handle the restriction in the component
      // where we have access to the user's plan
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};