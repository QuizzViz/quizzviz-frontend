import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PLAN_TYPE } from './config/plans';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/', 
    '/signin(.*)', 
    '/signup(.*)', 
    '/not-allowed',
    '/sitemap.xml',
    '/robots.txt'
]);

// Comprehensive bot detection
const searchEngineBots = [
  'googlebot',
  'google-inspectiontool', // Google Search Console
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

  // CRITICAL: Let all bots bypass Clerk completely
  if (isBot) {
    console.log(`Bot detected: ${ua}`);
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  
  // Allow public routes to bypass authentication
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Get auth information (only for non-bots, non-public routes)
  const { userId } = await auth();
  
  // Mobile device detection
  const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
  
  // Apply plan-based restrictions only for authenticated users
  if (userId) {
    const userPlan = PLAN_TYPE;

    // Business plan mobile restrictions
    if (
      userPlan === 'Business' &&
      isMobile &&
      /^\/[^/]+\/take\/quiz\/[^/]+$/.test(pathname)
    ) {
      return NextResponse.redirect(new URL('/not-allowed', request.url));
    }

    // Elite plan mobile restrictions
    if (
      userPlan === 'Elite' &&
      isMobile &&
      /^\/quiz\/attempt\/[^/]+$/.test(pathname)
    ) {
      return NextResponse.redirect(new URL('/not-allowed', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};