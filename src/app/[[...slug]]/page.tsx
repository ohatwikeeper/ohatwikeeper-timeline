'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useSearchParams, useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle, ChevronLeft, ChevronRight, Heart, Repeat,
  Users, MessageSquare, Calendar, ArrowUp, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PostCard } from '@/components/PostCard';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function TimelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  // State for the current date being viewed
  const [date, setDate] = useState<Date>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length === 3 && parts[0].length === 4) {
        const dStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        const parsed = parseISO(dStr);
        if (isValid(parsed)) return parsed;
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Track if we are currently transitioning to a new date
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state ONLY when URL updates externally (e.g. Back button)
  useEffect(() => {
    const slug = params?.slug as string[] | undefined;
    if (slug && Array.isArray(slug) && slug.length === 3) {
      const [y, m, d] = slug;
      const dStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const parsed = parseISO(dStr);
      if (isValid(parsed) && format(parsed, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) {
        setDate(parsed);
      }
    }
  }, [params?.slug, date]);

  const handleDateChange = (newDate: Date) => {
    if (format(newDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) return;
    
    setIsTransitioning(true);
    setDate(newDate);
    const path = `/${format(newDate, 'yyyy/MM/dd')}`;
    
    // Use replaceState first for instant URL bar feedback
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', path);
    }
    
    // Then trigger router.push for Next.js internal transition
    router.push(path, { scroll: false });
    
    // If the data is already in cache or local, transition ends quickly.
    // We let SWR's isLoading handle the definitive loading state, 
    // but we can clear the transition state immediately as we've already 
    // updated the local 'date' state which drives the SWR key.
    setIsTransitioning(false);
  };

  const dateStr = format(date, 'yyyy-MM-dd');

  const pathname = usePathname();

  useEffect(() => {
    // Root path redirect to today's URL
    if (pathname === '/' || pathname === '') {
       if (!searchParams.get('date')) {
         const today = format(new Date(), 'yyyy/MM/dd');
         router.replace(`/${today}`);
       }
    }
  }, [pathname, searchParams, router]);

  const [showInfo, setShowInfo] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.records.length) return null;
    return `/api/timeline?date=${dateStr}&offset=${pageIndex * 15}`;
  };

  const { data, size, setSize, error, isLoading } = useSWRInfinite(getKey, fetcher);
  
  const allRecords = data ? data.flatMap(p => p.records) : [];
  const stats = data?.[0]?.stats || null;
  const isLoadingMore = isLoading || isTransitioning || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd = data && data[data.length - 1]?.records.length < 15;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite scroll logic
  const observerTarget = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          setSize(size + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [size, setSize, isLoadingMore, isReachingEnd]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header onShowInfo={() => setShowInfo(true)} />

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-5">
        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-6 bg-card border border-border rounded-xl p-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDateChange(subDays(date, 1))}
              className="p-3 hover:bg-muted rounded-lg transition-colors shrink-0"
              disabled={!mounted}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <div 
              key={mounted ? "mounted" : "unmounted"}
              className="flex flex-col items-center px-4 relative group hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-[120px]"
              onClick={() => {
                const el = document.getElementById('timeline-date-picker') as HTMLInputElement;
                if (el) {
                  try {
                    if (typeof el.showPicker === 'function') {
                      el.showPicker();
                    } else {
                      el.click(); // Trigger native picker via click fallback
                    }
                  } catch (e) {
                    el.click();
                  }
                }
              }}
            >
              <input 
                id="timeline-date-picker"
                type="date"
                value={mounted ? dateStr : ''}
                disabled={!mounted}
                onChange={(e) => {
                  if (e.target.value) {
                    const parsed = parseISO(e.target.value);
                    if (isValid(parsed)) {
                       handleDateChange(parsed);
                    }
                  }
                }}
                className="absolute w-full h-full opacity-0 cursor-pointer -z-0"
              />
              <span className="text-sm font-bold text-secondary uppercase tracking-widest leading-tight">
                {mounted ? format(date, 'yyyy') : '----'}
              </span>
              <span className="text-2xl font-black leading-tight whitespace-nowrap">
                {mounted ? format(date, 'MM / dd') : '-- / --'}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDateChange(addDays(date, 1))}
              className="p-3 hover:bg-muted rounded-lg transition-colors shrink-0"
              disabled={!mounted}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
          <button
            onClick={() => handleDateChange(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))}
            className="text-xs font-bold text-secondary hover:text-primary transition-colors underline underline-offset-4"
          >
            今日に戻る
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Posts', value: stats?.total_tweets || 0, icon: MessageSquare, color: 'text-blue-500' },
            { label: 'Users', value: stats?.total_users || 0, icon: Users, color: 'text-indigo-500' },
            { label: 'Likes', value: stats?.total_likes || 0, icon: Heart, color: 'text-rose-500' },
            { label: 'Reposts', value: stats?.total_reposts || 0, icon: Repeat, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-card border border-border p-3 rounded-xl flex items-center gap-2.5"
            >
              <stat.icon className={cn("w-4 h-4 shrink-0", stat.color)} />
              <div className="min-w-0">
                <div className="text-base font-black tabular-nums leading-none">{Number(stat.value).toLocaleString()}</div>
                <div className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {error && <div className="text-center p-8 text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20">エラーが発生しました</div>}

          {allRecords.map((record, idx) => (
            <PostCard key={record.id} record={record as any} delay={Math.min(idx % 15, 8) * 0.03} />
          ))}

          {isLoadingMore && (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingMore && allRecords.length === 0 && (
            <div className="text-center py-20 px-4 bg-card rounded-xl border border-dashed border-border">
              <Calendar className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-bold mb-2">投稿がありません</h3>
              <p className="text-secondary">この日はまだ「おはツイ」が登録されていないようです。</p>
            </div>
          )}

          <div ref={observerTarget} className="h-4" />
        </div>
      </main>

      <Footer />

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-2xl shadow-primary/30"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowInfo(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-8 relative"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <HelpCircle className="text-primary" />
                おはツイTimelineとは？
              </h2>
              <div className="space-y-4 text-secondary leading-relaxed">
                <p>「おはツイKeeper」に登録されたみんなのおはようツイートを一覧できるタイムラインです。</p>
                <div className="bg-muted p-4 rounded-2xl">
                  <p className="text-sm font-bold text-foreground mb-1">目的</p>
                  <p className="text-sm text-secondary">
                    ユーザー同士が気軽にお互いの投稿を見つけ、朝の挨拶をより楽しく賑やかにすることが目的です。
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-2xl">
                  <p className="text-sm font-bold text-foreground mb-1">参加方法</p>
                  <p className="text-sm text-secondary">
                    自分の「おはツイ」もここに表示させたい場合は、ダッシュボードからURLを登録してください！
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-8 w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
              >
                閉じる
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <TimelineContent />
    </Suspense>
  );
}
