import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const authToken = searchParams.get('auth_token');

  if (authToken && pathname !== '/api/auth/sso') {
    const ssoUrl = new URL('/api/auth/sso', request.url);
    ssoUrl.searchParams.set('auth_token', authToken);
    ssoUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(ssoUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
