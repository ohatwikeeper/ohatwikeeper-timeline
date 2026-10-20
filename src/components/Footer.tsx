function addUtm(url: string): string {
  if (!url || url.includes('utm_source=')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'utm_source=ohatwikeeper.com';
}

const LINKS = [
  { href: 'https://discord.ohatwikeeper.com', label: 'お問い合わせ (Discord)', icon: 'bx bxl-discord-alt' },
  { href: 'mailto:contact@ohatwikeeper.com', label: 'お問い合わせ (メール)', icon: 'bx bx-envelope' },
  { href: 'https://question.ohatwikeeper.com', label: '質問箱', icon: 'bx bx-question-mark' },
  { href: 'https://ohatwikeeper.com/dev', label: '開発者について', icon: 'bx bx-user-circle' },
  { href: 'https://ohatwikeeper.com/policy', label: 'プライバシーポリシー', icon: null },
  { href: addUtm('https://x.com/ohatwikeeper'), label: 'X', icon: 'bx bxl-twitter' },
  { href: 'https://status.ohatwikeeper.com', label: 'サービス稼働状況', icon: 'bx bx-pulse' },
];

export function Footer() {
  return (
    <footer className="max-w-4xl mx-auto p-8 text-center text-sm text-secondary border-t border-border mt-20">
      <p>© {new Date().getFullYear()} おはツイKeeper by 狐ノ瀬つづり all rights reserved.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            {link.icon && <i className={link.icon}></i>}
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
