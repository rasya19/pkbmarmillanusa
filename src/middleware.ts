import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Jangan proses buat domain utama & localhost
  const excluded = ['www', 'rsch', 'localhost']
  if (excluded.includes(subdomain) || hostname.includes('vercel.app')) {
    return NextResponse.next()
  }

  // Rewrite: fallah.rsch.my.id/Siswa → /Siswa?school=fallah
  const url = request.nextUrl.clone()
  url.searchParams.set('school', subdomain)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)'],
}
