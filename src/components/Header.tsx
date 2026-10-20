'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Sun, Moon, Home, HelpCircle, LayoutDashboard, Calendar,
  Activity, LogOut, User, MoreHorizontal, Rss,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type HeaderProps = {
  onShowInfo?: () => void;
};

type SessionUser = {
  userId: number;
  xUsername: string | null;
  publicUuid: string;
  avatarUrl: string | null;
};

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

export function Header({ onShowInfo }: HeaderProps) {
  const { data, mutate } = useSWR<{ user: SessionUser | null }>('/api/auth/session', fetcher);
  const user = data?.user ?? null;
  const { theme, toggle } = useTheme();

  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(moreRef, () => setMoreOpen(false));
  useOutsideClick(userMenuRef, () => setUserMenuOpen(false));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserMenuOpen(false);
    mutate({ user: null });
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-opacity shrink-0">
          <i className="bx bxs-sun text-primary text-2xl sm:text-[1.75rem] shrink-0"></i>
          <h1 className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap">おはツイTimeline</h1>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/calender"
            className="p-2 hover:bg-muted rounded-full transition-colors text-secondary hover:text-primary"
            title="投稿カレンダー"
          >
            <Calendar className="w-5 h-5" />
          </Link>

          {/* その他メニュー: Info・稼働状況・おはツイKeeperリンクを集約 */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="p-2 hover:bg-muted rounded-full transition-colors text-secondary hover:text-primary"
              title="その他"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div
              className={cn(
                'absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden origin-top-right transition-all',
                moreOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
              )}
            >
              {onShowInfo && (
                <button
                  onClick={() => { onShowInfo(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Timelineとは？
                </button>
              )}
              <a
                href="https://status.ohatwikeeper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors"
              >
                <Activity className="w-4 h-4" />
                サービス稼働状況
              </a>
              <a
                href="https://ohatwikeeper.com"
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors border-t border-border"
              >
                <Home className="w-4 h-4" />
                おはツイKeeper
              </a>
            </div>
          </div>

          <button
            onClick={(e) => toggle(e.clientX, e.clientY)}
            className="p-2 hover:bg-muted rounded-full transition-colors text-secondary hover:text-primary"
            title="テーマ切り替え"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-muted rounded-full transition-colors"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full ring-2 ring-primary/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-bold">
                  {user.xUsername ? `@${user.xUsername}` : 'マイページ'}
                </span>
              </button>
              <div
                className={cn(
                  'absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden origin-top-right transition-all',
                  userMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
                )}
              >
                <Link
                  href={`/${user.publicUuid}`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors"
                >
                  <Rss className="w-4 h-4" />
                  自分のTimeline
                </Link>
                <a
                  href={`https://ohatwikeeper.com/${user.publicUuid}`}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  マイページ
                </a>
                <a
                  href="https://ohatwikeeper.com/dashboard"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  ダッシュボード
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors border-t border-border"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <a
              href="https://ohatwikeeper.com/login?r=timeline"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">ログイン</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
