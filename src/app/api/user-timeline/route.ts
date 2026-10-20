import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatRecord } from '@/lib/records';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicUuid = searchParams.get('uuid');
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 15;

  if (!publicUuid) {
    return NextResponse.json({ error: 'uuid is required' }, { status: 400 });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { public_uuid: publicUuid },
      select: { id: true, public_uuid: true, x_icon: true, x_username: true, is_public: true },
    });

    if (!user || !user.is_public) {
      return NextResponse.json({ error: 'User not found', records: [] });
    }

    const records = await prisma.records.findMany({
      where: { user_id: user.id },
      include: {
        users: { select: { public_uuid: true, x_icon: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedRecords = records.map(formatRecord);

    let profile = null;
    if (offset === 0) {
      const statsResult = await prisma.$queryRaw`
        SELECT
          COUNT(r.id) as total_tweets,
          SUM(r.likes) as total_likes,
          SUM(r.reposts) as total_reposts
        FROM records r
        WHERE r.user_id = ${user.id}
      `;
      const stats = (statsResult as any)[0];
      const safeStats = Object.fromEntries(
        Object.entries(stats).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
      );

      const latestAuthor = records[0]?.author ? JSON.parse(records[0].author) : {};
      const rawAvatar = user.x_icon || latestAuthor.avatar_url?.replace('_normal', '_200x200') || null;

      profile = {
        public_uuid: user.public_uuid,
        x_username: user.x_username,
        name: latestAuthor.name || user.x_username,
        avatar_url: formattedRecords[0]?.author?.avatar_url || rawAvatar,
        stats: safeStats,
      };
    }

    return NextResponse.json({ records: formattedRecords, profile, hasMore: records.length === limit });
  } catch (error: any) {
    console.error('User Timeline API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user timeline', details: error.message }, { status: 500 });
  }
}
