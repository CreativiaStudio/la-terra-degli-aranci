import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Applica la protezione solo alle rotte che iniziano con /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');
    
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      const expectedUser = process.env.ADMIN_USERNAME || 'admin';
      const expectedPwd = process.env.ADMIN_PASSWORD || 'Roberto2026!';

      if (user === expectedUser && pwd === expectedPwd) {
        return NextResponse.next(); // Accesso consentito
      }
    }

    // Se l'autorizzazione fallisce o manca, chiedi le credenziali tramite browser
    return new NextResponse('Accesso Negato: Area Riservata', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Area Riservata - La Terra degli Aranci"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
