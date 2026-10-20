<div align="center">

# おはツイKeeper タイムライン

**「おはツイ」の記録を時系列で見られる Web サイト**

[サイトを見る](https://timeline.ohatwikeeper.com) ・ [おはツイKeeper 本体](https://ohatwikeeper.com) ・ [ライセンス](./LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-All_Rights_Reserved-red)

</div>

> [!IMPORTANT]
> このリポジトリは **閲覧専用(source-available ではなく "view-only")** です。
> コードの複製・改変・再配布・商用/非商用を問わない利用は許可されていません。詳細は [LICENSE](./LICENSE) を参照してください。
> Issue(バグ報告・要望)と Pull Request は歓迎します。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 概要

おはツイKeeper が記録した「おはツイ」を、タイムライン形式で閲覧できるサイトです。
本リポジトリは、その **公式サイトのソースコード** を公開したものです。

- 公式サイト: https://timeline.ohatwikeeper.com
- おはツイKeeper 本体: https://ohatwikeeper.com

## 技術スタック

- **Next.js 16(App Router)+ React 19 + TypeScript**
- **データベース**: Prisma 7 + MySQL(MariaDB アダプタ)
- **UI**: Tailwind CSS 4
- **ユーティリティ**: date-fns

## ディレクトリ構成

```text
src/
├─ app/         ルーティング(ページ・API)
├─ components/  共通コンポーネント(Header / Footer / PostCard)
└─ lib/         DB 接続・セッション・記録の取得
prisma/         スキーマ
public/         静的アセット
```

## 開発(メンテナ向け)

動作確認には、おはツイKeeper のデータを持つ MySQL が必要です。外部の方が単独で完全に動かすことは想定していません。

```bash
npm ci
cp .env.example .env   # 値を設定
npm run dev            # 開発サーバー
npm run build          # 本番ビルド
```

### 環境変数(`.env.example`)

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | MySQL の接続文字列 |
| `AUTH_SECRET` | セッション署名用の秘密鍵(必須) |
| `IMG_CACHE_DIR` | 画像 URL キャッシュの保存先。空なら `./.cache/img` |

**秘密情報はコミットしないでください。** `.env` は Git の管理外です。

## セキュリティ

脆弱性を発見した場合は [SECURITY.md](./SECURITY.md) に従って非公開で報告してください。

## ライセンス

Copyright (c) 2026 おはツイKeeper (ohatwikeeper) / 狐ノ瀬つづり. All rights reserved.
閲覧のみ許可します。詳細は [LICENSE](./LICENSE)。
