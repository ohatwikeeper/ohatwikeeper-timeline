import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const IMG_CACHE_DIR = process.env.IMG_CACHE_DIR ?? path.join(process.cwd(), '.cache', 'img');
const IMG_CDN_BASE = 'https://img.ohatwikeeper.com/';
const CACHEABLE_HOSTS = ['pbs.twimg.com', 'abs.twimg.com'];

function isCacheable(url: string | null): boolean {
  if (!url) return false;
  try { return CACHEABLE_HOSTS.includes(new URL(url).hostname); } catch { return false; }
}

function registerUrl(key: string, url: string): void {
  try {
    const urlFile = path.join(IMG_CACHE_DIR, key + '.url');
    const dir = path.dirname(urlFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const current = fs.existsSync(urlFile) ? fs.readFileSync(urlFile, 'utf8').trim() : null;
    if (current !== url) fs.writeFileSync(urlFile, url);
  } catch { /* キャッシュ登録失敗は無視 */ }
}

export function toTweetImgUrl(url: string | null): string | null {
  if (!url || !isCacheable(url)) return url;
  const hash = createHash('md5').update(url).digest('hex');
  registerUrl(hash, url);
  return IMG_CDN_BASE + hash;
}

export function toAvatarUrl(userId: number, url: string | null): string | null {
  if (!url || !isCacheable(url)) return url;
  const key = 'av/' + userId;
  registerUrl(key, url);
  return IMG_CDN_BASE + key;
}

export function formatRecord<T extends { author: string | null; date: Date | null; user_id: number; image_url: string | null; users?: { x_icon?: string | null } | null }>(record: T) {
  const author = JSON.parse(record.author || '{}');
  const actualTime = new Date(record.date ? record.date.getTime() - 9 * 60 * 60 * 1000 : new Date());

  const rawAvatar = record.users?.x_icon
    || author.avatar_url?.replace('_normal', '_200x200')
    || null;
  author.avatar_url = toAvatarUrl(record.user_id, rawAvatar);

  return {
    ...record,
    image_url: toTweetImgUrl(record.image_url),
    author,
    relative_time: formatDistanceToNow(actualTime, { addSuffix: true, locale: ja }),
  };
}
