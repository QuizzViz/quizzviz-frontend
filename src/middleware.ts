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
    '/terms'
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

  // Priority 1: Bots bypass everything
  if (isBot) {
    console.log(`Bot detected: ${ua}`);
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Priority 2: Public routes bypass auth
  if (isPublicRoute(request)) {
    console.log(`Public route: ${pathname}`);
    return NextResponse.next();
  }

  // Priority 3: Protected routes - check auth
  try {
    const { userId } = await auth();
    
    if (!userId) {
      // Let Clerk handle the redirect to sign-in
      return NextResponse.next();
    }

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
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};