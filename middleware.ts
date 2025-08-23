import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if there's a token in the query parameters
  const { searchParams, pathname } = new URL(request.url);
  const token = searchParams.get('token');
  
  // If there's a token, redirect to the SSO endpoint
  if (token) {
    console.log(`[SSO Middleware] Token detected on ${pathname}, redirecting to SSO endpoint`);
    
    // Create the SSO URL with the token
    const ssoUrl = new URL('/api/auth/sso', request.url);
    ssoUrl.searchParams.set('token', token);
    
    // Redirect to the SSO endpoint
    return NextResponse.redirect(ssoUrl);
  }
  
  // Continue with the request if no token
  return NextResponse.next();
}

export const config = {
  // Match all paths except API routes (to avoid infinite redirects) and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/sso (to avoid infinite redirect)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/sso|_next/static|_next/image|favicon.ico).*)',
  ],
};
