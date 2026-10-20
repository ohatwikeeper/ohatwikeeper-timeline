'use client';

import { motion } from 'motion/react';
import { Heart, Repeat, ExternalLink } from 'lucide-react';

function addUtm(url: string): string {
  if (!url || url.includes('utm_source=')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'utm_source=ohatwikeeper.com';
}

export type PostRecord = {
  id: number;
  url: string;
  text: string | null;
  likes: number | null;
  reposts: number | null;
  image_url: string | null;
  relative_time: string;
  author: { name?: string; screen_name?: string; avatar_url?: string | null } | null;
  users?: { public_uuid?: string | null } | null;
};

type PostCardProps = {
  record: PostRecord;
  delay?: number;
  hideProfileLink?: boolean;
};

export function PostCard({ record, delay = 0, hideProfileLink = false }: PostCardProps) {
  const publicUuid = record.users?.public_uuid ?? undefined;
  const screenName = record.author?.screen_name;
  const profileUrl = !hideProfileLink && publicUuid ? `https://ohatwikeeper.com/${publicUuid}` : undefined;
  const xUrl = screenName ? addUtm(`https://x.com/${screenName}`) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
    >
      <div className="p-3.5 flex gap-2.5">
        <div className="shrink-0">
          {profileUrl ? (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={record.author?.avatar_url || ''}
                alt=""
                className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
              />
            </a>
          ) : (
            <img
              src={record.author?.avatar_url || ''}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {profileUrl ? (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[15px] truncate hover:underline">{record.author?.name}</a>
            ) : (
              <span className="font-bold text-[15px] truncate">{record.author?.name}</span>
            )}
            {xUrl ? (
              <a href={xUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary truncate hover:text-primary transition-colors">@{screenName}</a>
            ) : (
              <span className="text-xs text-secondary truncate">@{screenName}</span>
            )}
            <span className="text-xs text-secondary/70 shrink-0 ml-auto whitespace-nowrap">{record.relative_time}</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed mb-2 text-[14px]">{record.text}</p>

          {record.image_url && (
            <div className="mb-2 rounded-lg overflow-hidden border border-border bg-muted/50">
              <img
                src={record.image_url}
                alt=""
                className="w-full h-auto object-contain max-h-[440px]"
              />
            </div>
          )}

          <div className="flex items-center gap-1 -ml-2">
            <a
              href={addUtm(`https://x.com/intent/like?tweet_id=${record.url.split('/').pop()}`)}
              target="_blank" rel="noopener"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tabular-nums">{Number(record.likes).toLocaleString()}</span>
            </a>
            <a
              href={addUtm(`https://x.com/intent/retweet?tweet_id=${record.url.split('/').pop()}`)}
              target="_blank" rel="noopener"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-secondary hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tabular-nums">{Number(record.reposts).toLocaleString()}</span>
            </a>
            <a
              href={addUtm(record.url)}
              target="_blank" rel="noopener"
              className="ml-auto p-1.5 text-secondary hover:text-primary transition-colors hover:bg-primary/10 rounded-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
