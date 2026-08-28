import { NextResponse } from 'next/server';

// Microsoft Entra ID SSO isn't configured yet (no Azure app registration /
// client credentials exist in this environment, and the actual OAuth flow
// will be implemented by the Django backend). Configuration lives at
// /settings/sso; until that's wired up, send visitors back to sign-in
// instead of 404ing on the login page's "Continue with Microsoft" button.
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
