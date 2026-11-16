import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/session';

const CLIENT_COOKIE_NAME = 'tda_client_session';

// Verifica Edge-Safe del cookie Magic Link tda_client_session (b64.hmacBase64Url)
async function verifyClientSessionEdge(cookieValue: string): Promise<{ email: string; clientId?: string } | null> {
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const secret = process.env.MAGIC_SECRET || 'tda_magic_link_secret_key_2026';

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(b64));
    const bytes = new Uint8Array(mac);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const expected = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (sig !== expected) return null;

    const jsonStr = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

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

  // 2. Estrai e verifica token di sessione da cookie (Staff & Client Magic Link)
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  const clientCookie = req.cookies.get(CLIENT_COOKIE_NAME)?.value;
  const clientSession = clientCookie ? await verifyClientSessionEdge(clientCookie) : null;

  const currentRole: UserRole | null = isBasicAuthAdmin ? 'admin' : (session?.role || null);
  const isStaffOrUserAuthenticated = !!currentRole;
  const isAnyAuthenticated = isStaffOrUserAuthenticated || !!clientSession;

  // Helper per reindirizzare a /login salvando il redirect target
  const redirectToLogin = (customRedirect?: string) => {
    const loginUrl = new URL('/login', req.url);
    const target = customRedirect ?? (pathname + search);
    if (target && target !== '/') {
      loginUrl.searchParams.set('redirect', target);
    }
    return NextResponse.redirect(loginUrl);
  };

  // 3. Blindatura Home Root '/': deve mostrare la mascherina di login (/login) ai non autenticati
  if (pathname === '/') {
    if (isStaffOrUserAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }
    if (clientSession) {
      return NextResponse.redirect(
        new URL(`/cliente?mode=wedding&id=${clientSession.clientId || ''}`, req.url)
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Gestione della rotta /login
  if (pathname === '/login') {
    const hasAction = req.nextUrl.searchParams.has('action');
    if (isStaffOrUserAuthenticated && !hasAction) {
      const targetUrl = getHomeUrlForRole(currentRole!, session?.clientId);
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // 5. Protezione /admin/:path* e /api/admin/:path*
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', 'admin');
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { error: 'Accesso Negato: Richiesta autorizzazione amministratore' },
        { status: isStaffOrUserAuthenticated ? 403 : 401 }
      );
    }

    if (basicAuthProvided && !isBasicAuthAdmin) {
      return new NextResponse('Accesso Negato: Credenziali non valide', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Area Riservata - La Terra degli Aranci"',
        },
      });
    }

    if (isStaffOrUserAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 6. Protezione /segreteria/:path* (ammessi segreteria e admin)
  if (pathname.startsWith('/segreteria')) {
    if (currentRole === 'segreteria' || currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole);
      if (currentRole === 'segreteria') {
        requestHeaders.set('x-financial-data-access', 'blocked');
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isStaffOrUserAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 7. Protezione /planner/:path* (ammessi planner e admin)
  if (pathname.startsWith('/planner')) {
    if (currentRole === 'planner' || currentRole === 'admin') {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isStaffOrUserAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 8. Protezione /cliente/:path* (escluso /cliente/login che deve restare pubblico per Magic Link)
  if (pathname.startsWith('/cliente')) {
    if (pathname === '/cliente/login' || pathname.startsWith('/cliente/login/')) {
      return NextResponse.next();
    }

    const isClientRole = currentRole === 'wedding' || currentRole === 'privato' || currentRole === 'storico';

    if (isClientRole || currentRole === 'admin' || clientSession) {
      if (pathname === '/cliente' && !search && (isClientRole || clientSession)) {
        const cid = session?.clientId || clientSession?.clientId || '';
        const target = isClientRole
          ? getHomeUrlForRole(currentRole!, cid)
          : `/cliente?mode=wedding&id=${cid}`;
        return NextResponse.redirect(new URL(target, req.url));
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', currentRole || 'wedding');
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isStaffOrUserAuthenticated) {
      return NextResponse.redirect(new URL(getHomeUrlForRole(currentRole!, session?.clientId), req.url));
    }

    return redirectToLogin();
  }

  // 9. Protezione /preventivi/:path* (ammessi staff, client autenticato o link firmato ?sig=)
  if (pathname.startsWith('/preventivi')) {
    if (pathname.startsWith('/preventivi/modifica')) {
      return NextResponse.next();
    }
    const hasSig = req.nextUrl.searchParams.has('sig');
    if (
      currentRole === 'admin' ||
      currentRole === 'planner' ||
      currentRole === 'segreteria' ||
      clientSession ||
      hasSig
    ) {
      return NextResponse.next();
    }
    return redirectToLogin();
  }

  // 10. Protezione API sensibili: /api/ai-concierge
  if (pathname.startsWith('/api/ai-concierge')) {
    if (!isAnyAuthenticated) {
      return NextResponse.json(
        { error: 'Accesso Negato: Sessione richiesta' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 11. Protezione avvio OAuth Google Calendar (/api/auth/google) -> solo admin
  if (pathname === '/api/auth/google') {
    if (currentRole !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso Negato: Solo direzione' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 12. Protezione /api/cron/keep-alive -> richiede CRON_SECRET se configurato o admin
  if (pathname.startsWith('/api/cron/keep-alive')) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}` && currentRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/admin/:path*',
    '/segreteria/:path*',
    '/planner/:path*',
    '/cliente/:path*',
    '/preventivi/:path*',
    '/api/ai-concierge',
    '/api/auth/google',
    '/api/cron/keep-alive',
    '/login',
  ],
};
