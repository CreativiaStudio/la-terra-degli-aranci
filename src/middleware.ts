import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/session';

// Helper per determinare la destinazione principale per ciascun ruolo
function getHomeUrlForRole(role: UserRole, clientId?: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'segreteria':
      return '/segreteria';
    case 'planner':
      return '/planner';
    case 'wedding':
      return `/cliente?mode=wedding&id=${clientId || 'demo1'}`;
    case 'privato':
      return `/cliente?mode=privato&id=${clientId || 'demo2'}`;
    case 'storico':
      return `/cliente?mode=storico&id=${clientId || 'demo4'}`;
    default:
      return '/login';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Verifica HTTP Basic Auth per retrocompatibilità e automazioni admin
  const basicAuth = req.headers.get('authorization');
  let isBasicAuthAdmin = false;
  let basicAuthProvided = false;

  if (basicAuth && basicAuth.startsWith('Basic ')) {
    basicAuthProvided = true;
    try {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');
      const expectedUser = process.env.ADMIN_USERNAME || 'admin';
      const expectedPwd = process.env.ADMIN_PASSWORD || 'Roberto2026!';

      if (user === expectedUser && pwd === expectedPwd) {
        isBasicAuthAdmin = true;
      }
    } catch {
      // Ignora credenziali malformate
    }
  }

  // 2. Estrai e verifica token di sessione da cookie (Web Crypto Edge-Safe)
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // Ruolo attivo: Basic Auth prioritario su admin, altrimenti sessione cookie
  const currentRole: UserRole | null = isBasicAuthAdmin ? 'admin' : (session?.role || null);
  const isAuthenticated = !!currentRole;

  // 3. Gestione della rotta /login
  if (pathname === '/login') {
    const hasAction = req.nextUrl.searchParams.has('action');
    if (isAuthenticated && !hasAction) {
      const targetUrl = getHomeUrlForRole(currentRole!, session?.clientId);
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // Helper per reindirizzare a /login salvando il redirect target
  const redirectToLogin = () => {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  };

  // 4. Protezione /admin/:path* e /api/admin/:path*
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', 'admin');
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Se è un endpoint API admin
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { error: 'Accesso Negato: Richiesta autorizzazione amministratore' },
        { status: isAuthenticated ? 403 : 401 }
      );
    }

    // Se l'utente ha fornito Basic Auth non valida su /admin
    if (basicAuthProvided && !isBasicAuthAdmin) {
      return new NextResponse('Accesso Negato: Credenziali non valide', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Area Riservata - La Terra degli Aranci"',
        },
      });
    }

    // Se autenticato con altro ruolo, reindirizza alla propria area
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    // Utente non autenticato -> redirect a login
    return redirectToLogin();
  }

  // 5. Protezione /segreteria/:path* (ammessi segreteria e admin)
  if (pathname.startsWith('/segreteria')) {
    if (currentRole === 'segreteria' || currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole);

      // Isolamento Finanziario Assoluto (Vincolo R2):
      // Inietta l'header di blocco per la segreteria
      if (currentRole === 'segreteria') {
        requestHeaders.set('x-financial-data-access', 'blocked');
      }

      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 6. Protezione /planner/:path* (ammessi planner e admin)
  if (pathname.startsWith('/planner')) {
    if (currentRole === 'planner' || currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 7. Protezione /cliente/:path* (ammessi wedding, privato, storico e admin)
  if (pathname.startsWith('/cliente')) {
    const isClientRole = currentRole === 'wedding' || currentRole === 'privato' || currentRole === 'storico';

    if (isClientRole || currentRole === 'admin') {
      // Auto-risoluzione parametri se l'utente naviga su /cliente senza query params
      if (pathname === '/cliente' && !search && isClientRole) {
        const clientRedirectUrl = getHomeUrlForRole(currentRole, session?.clientId);
        return NextResponse.redirect(new URL(clientRedirectUrl, req.url));
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/segreteria/:path*',
    '/planner/:path*',
    '/cliente/:path*',
    '/login',
  ],
};
