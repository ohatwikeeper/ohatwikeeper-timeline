import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host) {
    return `${request.headers.get('x-forwarded-proto') || 'https'}://${host}`;
  }
  return new URL(request.url).origin;
}

function noStoreRedirect(destination: string): NextResponse {
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = resolveOrigin(request);
  const token = searchParams.get('auth_token');
  const redirectPath = searchParams.get('redirect') || '/';
  const destination = redirectPath.startsWith('/') ? origin + redirectPath : origin;

  if (!token) {
    return noStoreRedirect(destination);
  }

  const tokenRow = await prisma.cross_domain_tokens.findFirst({
    where: { token, expires_at: { gt: new Date() } },
  });

  if (!tokenRow) {
    return noStoreRedirect(destination);
  }

  // 使い捨てトークン: 検証成功時点で即削除
  const [user] = await Promise.all([
    prisma.users.findUnique({
      where: { id: tokenRow.user_id },
      select: { id: true, public_uuid: true, x_username: true, x_icon: true },
    }),
    prisma.cross_domain_tokens.delete({ where: { id: tokenRow.id } }),
  ]);

  if (!user) {
    return noStoreRedirect(destination);
  }

  const sessionToken = await createSessionToken({
    userId: user.id,
    xUsername: user.x_username,
    publicUuid: user.public_uuid,
    avatarUrl: user.x_icon ? user.x_icon.replace('_normal', '_200x200') : null,
  });

  const response = noStoreRedirect(destination);
  setSessionCookie(response, sessionToken);
  return response;
}
