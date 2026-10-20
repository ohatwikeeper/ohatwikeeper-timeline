import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "おはツイTimeline",
  description: "おはツイKeeperに登録されたみんなのおはようツイートを見て、一日を始めよう！",
  openGraph: {
    title: "おはツイTimeline",
    description: "おはツイKeeperに登録されたみんなのおはようツイートを見て、一日を始めよう！",
    url: "https://timeline.ohatwikeeper.com",
    siteName: "おはツイTimeline",
    images: [
      {
        url: "https://timeline.ohatwikeeper.com/timeline_ogpbig.png",
        width: 1408,
        height: 736,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おはツイTimeline",
    description: "おはツイKeeperに登録されたみんなのおはようツイートを見て、一日を始めよう！",
    images: ["https://timeline.ohatwikeeper.com/timeline_ogpbig.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* ダークモードのチラつき防止: レンダリング前にlocalStorageを読んでdata-themeを設定 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}})();`,
          }}
        />
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
        <script defer src="https://umami.lapius7.com/script.js" data-website-id="9dbf2a05-da47-45b9-8824-4094246112ab"></script>
        <script
          src="https://analytics.lapius7.com/api/script.js"
          data-site-id="71eb9ed5bd29"
          defer
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
