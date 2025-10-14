import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PLAN_TYPE } from './config/plans';

const isPublicRoute = createRouteMatcher([
    '/', 
    '/signin(.*)', 
    '/signup(.*)', 
    '/not-allowed',
]);


const searchEngineBots = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot',
  'ia_archiver'
];

export default clerkMiddleware(async (auth, request) => {
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const isSearchEngine = searchEngineBots.some(bot => ua.includes(bot));

  // Allow search engines to access all routes
  if (isSearchEngine) {
    return NextResponse.next();
  }
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
    
    const userPlan = PLAN_TYPE 

    if (
        userPlan === 'Business' &&
        isMobile &&
        /^\/[^/]+\/take\/quiz\/[^/]+$/.test(request.nextUrl.pathname)
    ) {
        return NextResponse.redirect(new URL('/not-allowed', request.url));
    }

    if (
        userPlan === 'Elite' &&
        isMobile &&
        /^\/quiz\/attempt\/[^/]+$/.test(request.nextUrl.pathname)
    ) {
        return NextResponse.redirect(new URL('/not-allowed', request.url));
    }
    
    return NextResponse.next();
});


export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};


