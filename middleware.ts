import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  if (host.startsWith('ikbeslistmee.')) {
    if (!request.nextUrl.pathname.startsWith('/mogelijkmaakdag/sleutels') &&
        !request.nextUrl.pathname.startsWith('/api/') &&
        !request.nextUrl.pathname.startsWith('/_next/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/mogelijkmaakdag/sleutels';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
