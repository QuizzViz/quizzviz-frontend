import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

declare module '@clerk/nextjs/server' {
  interface SessionClaims {
    publicMetadata?: {
      onboardingComplete?: boolean;
      companyId?: string;
      planName?: string;
    };
  }
}

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

    // Type guard for public metadata
    interface PublicMetadata {
      onboardingComplete?: boolean;
      companyId?: string;
      planName?: string;
    }
    
    const publicMetadata = (sessionClaims?.publicMetadata || {}) as PublicMetadata;
    const onboardingComplete = publicMetadata.onboardingComplete === true;
    const hasCompany = !!publicMetadata.companyId;
    const hasBusinessPlan = publicMetadata.planName === 'Business';

    // Handle sign-in/signup redirects
    if (userId && (pathname === '/signin' || pathname === '/signup')) {
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Handle onboarding flow
    if (pathname === '/onboarding') {
      if (onboardingComplete && hasCompany) {
        if (hasBusinessPlan) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/pricing', request.url));
      }
      return NextResponse.next();
    }

    // Handle pricing page access
    if (pathname === '/pricing') {
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      if (hasBusinessPlan) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Handle dashboard access
    if (pathname.startsWith('/dashboard')) {
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      if (!hasCompany) {
        // Allow access to dashboard but show DashboardAccess component
        return NextResponse.next();
      }
      if (!hasBusinessPlan) {
        // Allow access to dashboard but show upgrade prompt
        return NextResponse.next();
      }
      // Full access to dashboard
      return NextResponse.next();
    }

    // User is authenticated - check for mobile restrictions
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
    
    // For middleware, we'll check the plan on the client side
    if (pathname.startsWith('/quiz/') && isMobile) {
      // Mobile restrictions would be handled here
      return NextResponse.next();
    }

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