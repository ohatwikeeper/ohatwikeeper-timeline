import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import type { NextResponse } from 'next/server';

const rawSecret = process.env.AUTH_SECRET;
if (!rawSecret) {
  throw new Error('AUTH_SECRET environment variable must be set');
}
const SECRET = new TextEncoder().encode(rawSecret);

const SESSION_COOKIE = 'timeline_session';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30日

export interface SessionUser {
  userId: number;
  xUsername: string | null;
  publicUuid: string;
  avatarUrl: string | null;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as number,
      xUsername: (payload.xUsername as string | null) ?? null,
      publicUuid: payload.publicUuid as string,
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
