import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rangeStart = searchParams.get('start');
  const rangeEnd = searchParams.get('end');

  if (!rangeStart || !rangeEnd || !/^\d{4}-\d{2}-\d{2}$/.test(rangeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(rangeEnd)) {
    return NextResponse.json({ error: 'start and end (YYYY-MM-DD) are required' }, { status: 400 });
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT
        DATE(r.date) as day,
        COUNT(r.id) as total_tweets,
        COUNT(DISTINCT r.user_id) as total_users
      FROM records r
      JOIN users u ON r.user_id = u.id
      WHERE DATE(r.date) BETWEEN ${rangeStart} AND ${rangeEnd} AND u.is_public = 1
      GROUP BY DATE(r.date)
      ORDER BY day ASC
    `;

    const days = (rows as any[]).map((row) => ({
      date: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day),
      total_tweets: Number(row.total_tweets),
      total_users: Number(row.total_users),
    }));

    return NextResponse.json({ start: rangeStart, end: rangeEnd, days });
  } catch (error: any) {
    console.error('Calendar API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar', details: error.message }, { status: 500 });
  }
}
