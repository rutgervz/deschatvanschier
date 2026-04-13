import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  if (host.startsWith('ikbeslistmee.')) {
    const url = request.nextUrl.clone();
    if (url.pathname === '/' || url.pathname === '/mogelijkmaakdag') {
      url.pathname = '/mogelijkmaakdag/sleutels';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/mogelijkmaakdag'],
};
