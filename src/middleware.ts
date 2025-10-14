// middleware.ts
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PLAN_TYPE } from './config/plans';

const publicRoutes = ['/', '/(api)(.*)', '/sign-in', '/sign-up', '/not-allowed']; // ADD ALL PUBLIC ROUTES HERE

export default clerkMiddleware(async (auth, request) => {
    
    // Check if the current route is one of the defined public routes.
    const isPublicRoute = publicRoutes.some(route => 
        request.nextUrl.pathname === route || 
        (route.endsWith('(.*)') && request.nextUrl.pathname.match(new RegExp(`^${route.replace('(.*)', '')}`)))
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    const ua = request.headers.get('user-agent')?.toLowerCase() || '';
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
    const userPlan = PLAN_TYPE // THIS LINE NEEDS TO BE DYNAMICALLY FETCHED

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