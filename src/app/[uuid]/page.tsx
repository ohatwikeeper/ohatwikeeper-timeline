'use client';

import { useState, useEffect, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'motion/react';
import { Heart, Repeat, MessageSquare, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PostCard } from '@/components/PostCard';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserTimelinePage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const [notFoundState, setNotFoundState] = useState(false);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && (previousPageData.error || !previousPageData.records?.length)) return null;
    return `/api/user-timeline?uuid=${uuid}&offset=${pageIndex * 15}`;
  };

  const { data, size, setSize, error, isLoading } = useSWRInfinite(getKey, fetcher);

  useEffect(() => {
    if (data?.[0]?.error === 'User not found') setNotFoundState(true);
  }, [data]);

  const allRecords = data ? data.flatMap((p) => p.records || []) : [];
  const profile = data?.[0]?.profile;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isReachingEnd = data && data[data.length - 1]?.records?.length < 15;

  const observerTarget = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          setSize(size + 1);
        }
      },
      { threshold: 1.0 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [size, setSize, isLoadingMore, isReachingEnd]);

  if (notFoundState) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-black mb-2">ユーザーが見つかりません</h1>
            <p className="text-secondary">存在しないか、非公開に設定されています。</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const profileUrl = uuid ? `https://ohatwikeeper.com/${uuid}` : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-5">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 md:p-8"
        >
          {!profile && isLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={profile?.avatar_url || ''}
                  alt=""
                  className="w-16 h-16 rounded-full ring-2 ring-primary/30 shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-black truncate">{profile?.name}</h1>
                  {profile?.x_username && (
                    <p className="text-sm text-secondary truncate">@{profile.x_username}</p>
                  )}
                </div>
                {profileUrl && (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto p-2 text-secondary hover:text-primary transition-colors hover:bg-muted rounded-full shrink-0"
                    title="おはツイKeeperのプロフィールを見る"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
              {profile?.stats && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black tabular-nums">{Number(profile.stats.total_tweets).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-rose-500 mb-1">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black tabular-nums">{Number(profile.stats.total_likes || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black tabular-nums">{Number(profile.stats.total_reposts || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Reposts</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        <div className="space-y-2">
          {error && <div className="text-center p-8 text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20">エラーが発生しました</div>}

          {allRecords.map((record, idx) => (
            <PostCard key={record.id} record={record} delay={Math.min(idx % 15, 8) * 0.03} hideProfileLink />
          ))}

          {isLoadingMore && (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingMore && allRecords.length === 0 && !isLoading && (
            <div className="text-center py-20 px-4 bg-card rounded-xl border border-dashed border-border">
              <h3 className="text-xl font-bold mb-2">投稿がありません</h3>
              <p className="text-secondary">このユーザーの「おはツイ」はまだ登録されていないようです。</p>
            </div>
          )}

          <div ref={observerTarget} className="h-4" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
