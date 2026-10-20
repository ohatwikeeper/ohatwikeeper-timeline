import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatRecord } from '@/lib/records';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 15;

  try {
    const searchStart = new Date(`${dateStr}T00:00:00Z`);
    const searchEnd = new Date(`${dateStr}T23:59:59Z`);

    const records = await prisma.records.findMany({
      where: {
        date: { gte: searchStart, lte: searchEnd },
        users: { is_public: true },
      },
      include: {
        users: {
          select: { public_uuid: true, x_icon: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedRecords = records.map(formatRecord);

    let stats = null;
    if (offset === 0) {
      const statsResult = await prisma.$queryRaw`
        SELECT
          COUNT(r.id) as total_tweets,
          SUM(r.likes) as total_likes,
          SUM(r.reposts) as total_reposts,
          COUNT(DISTINCT r.user_id) as total_users
        FROM records r
        JOIN users u ON r.user_id = u.id
        WHERE DATE(r.date) = ${dateStr} AND u.is_public = 1
      `;
      stats = (statsResult as any)[0];
    }

    const safeStats = stats ? Object.fromEntries(
      Object.entries(stats).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
    ) : null;

    return NextResponse.json({ records: formattedRecords, stats: safeStats, hasMore: records.length === limit });
  } catch (error: any) {
    console.error('Timeline API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline', details: error.message }, { status: 500 });
  }
}
