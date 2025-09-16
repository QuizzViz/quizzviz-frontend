import { clerkMiddleware } from '@clerk/nextjs/server';
 
// Basic Clerk middleware configuration
export default clerkMiddleware();
 
// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
