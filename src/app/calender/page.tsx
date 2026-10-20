'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, isLeapYear, startOfDay, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayStat = { date: string; total_tweets: number; total_users: number };
type TooltipState = { x: number; y: number; date: string; stat: DayStat | null };

function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 1) return count > 0 ? 4 : 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVEL_CLASS: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-primary/25',
  2: 'bg-primary/50',
  3: 'bg-primary/75',
  4: 'bg-primary',
};

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const firstYear = 2022; // サービス開始年

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = useMemo(() => startOfDay(new Date()), []);

  const startStr = `${year}-01-01`;
  const endStr = `${year}-12-31`;

  const { data, isLoading } = useSWR(`/api/calendar?start=${startStr}&end=${endStr}`, fetcher);

  const statsByDate = useMemo(() => {
    const map = new Map<string, DayStat>();
    (data?.days as DayStat[] | undefined)?.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  const maxCount = useMemo(() => {
    let max = 0;
    statsByDate.forEach((d) => { if (d.total_tweets > max) max = d.total_tweets; });
    return max;
  }, [statsByDate]);

  // 1/1〜12/31を週単位の列(53週分)に変換。1週目は日曜始まりの空セルで埋める
  const weeks = useMemo(() => {
    const dayCount = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
    const jan1 = new Date(year, 0, 1);
    const leadingBlanks = getDay(jan1); // 0(日)〜6(土)
    const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
    for (let i = 0; i < dayCount; i++) {
      cells.push(new Date(year, 0, 1 + i));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const result: (Date | null)[][] = [];
    for (let col = 0; col < cells.length / 7; col++) {
      const week: (Date | null)[] = [];
      for (let row = 0; row < 7; row++) {
        week.push(cells[col * 7 + row]);
      }
      result.push(week);
    }
    return result;
  }, [year]);

  const totalInRange = useMemo(() => {
    let tweets = 0;
    statsByDate.forEach((d) => { tweets += d.total_tweets; });
    return tweets;
  }, [statsByDate]);

  const activeDays = statsByDate.size;

  const canGoPrev = year > firstYear;
  const canGoNext = year < today.getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">投稿カレンダー</h2>
          <p className="text-sm text-secondary">
            日ごとの「おはツイ」登録数を草カレンダーで見られます。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 gap-2"
        >
          <div className="bg-card border border-border p-3 rounded-xl flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-base font-black tabular-nums leading-none">{isLoading ? '—' : totalInRange.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate">{year}年の投稿数</div>
            </div>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl flex items-center gap-2.5">
            <Users className="w-4 h-4 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <div className="text-base font-black tabular-nums leading-none">{isLoading ? '—' : activeDays.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate">投稿があった日数</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">投稿アクティビティ</h3>
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => canGoPrev && setYear((y) => y - 1)}
                disabled={!canGoPrev}
                className="p-1.5 hover:bg-card rounded-full transition-colors disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <h4 className="text-sm font-black tabular-nums w-12 text-center">{year}</h4>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => canGoNext && setYear((y) => y + 1)}
                disabled={!canGoNext}
                className="p-1.5 hover:bg-card rounded-full transition-colors disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {!mounted || isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <div className="inline-flex gap-[3px] min-w-full">
                    <div className="flex flex-col gap-[3px] pr-3 text-[10px] font-semibold text-secondary/70 shrink-0 w-8">
                      {WEEKDAY_LABELS.map((label, i) => (
                        <span key={label} className="h-[15px] leading-[15px]">{i % 2 === 1 ? label : ''}</span>
                      ))}
                    </div>
                    <div className="flex gap-[3px]">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[3px]">
                          {week.map((day, di) => {
                            if (!day) {
                              return <div key={di} className="w-[15px] h-[15px]" />;
                            }
                            const dStr = format(day, 'yyyy-MM-dd');
                            const stat = statsByDate.get(dStr);
                            const count = stat?.total_tweets || 0;
                            const level = levelFor(count, maxCount);
                            const future = isAfter(day, today);
                            return (
                              <motion.div
                                key={dStr}
                                whileHover={future ? {} : { scale: 1.35 }}
                                transition={{ duration: 0.12 }}
                                onMouseEnter={(e) => {
                                  if (future) return;
                                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                                  setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date: dStr, stat: stat || null });
                                }}
                                onMouseMove={(e) => {
                                  if (future) return;
                                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                                  setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date: dStr, stat: stat || null });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                                className={cn(
                                  'w-[15px] h-[15px] rounded-[4px] cursor-default ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.04] hover:ring-primary/60 transition-[box-shadow]',
                                  future ? 'opacity-20 pointer-events-none' : LEVEL_CLASS[level],
                                )}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute top-0 right-0 bottom-1 w-8 bg-gradient-to-l from-card to-transparent" />
              </div>

              <div className="flex items-center justify-end gap-1.5 text-[11px] text-secondary/80 pt-1">
                <span>少</span>
                <div className="flex gap-[3px]">
                  {[0, 1, 2, 3, 4].map((lv) => (
                    <div key={lv} className={cn('w-[13px] h-[13px] rounded-[4px]', LEVEL_CLASS[lv])} />
                  ))}
                </div>
                <span>多</span>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />

      {tooltip && (
        <div
          className="fixed z-[200] pointer-events-none bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-2xl -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-bold text-foreground whitespace-nowrap">
            {format(new Date(tooltip.date), 'yyyy年M月d日', { locale: ja })}
          </div>
          <div className="text-secondary whitespace-nowrap">
            投稿 {tooltip.stat?.total_tweets || 0}件 / {tooltip.stat?.total_users || 0}人
          </div>
        </div>
      )}
    </div>
  );
}
