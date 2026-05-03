# MyKitchen

MyKitchen は、個人利用向けのレシピ管理 Web アプリです。現在はレシピ機能を作り込む前段階として、Vercel にデプロイできる Next.js の最小構成を用意しています。

## 現在のスコープ

このスキャフォールドで確認できるもの:

- Next.js App Router + TypeScript
- Auth.js Google OAuth ルート
- `OWNER_GOOGLE_EMAILS` によるオーナー許可リスト
- JWT セッション
- `next-themes` による `light` / `dark` / `system` テーマ切替
- `locales/ja.json` による日本語文言管理
- Vercel 設定
- GitHub Actions CI
- `/` のスモークテストページ
- `/api/health` のヘルスチェック
- sitemap / robots ルート
- 画像アップロードと日次メンテナンス cron のスタブ

プロダクト要件とアーキテクチャは以下にまとめています。

- [requirement.md](./requirement.md)
- [architecture.md](./architecture.md)

## ローカル開発

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 検証

push 前に以下を実行します。

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

GitHub Actions でも push / pull request 時に同じ検証を実行します。

## 環境変数

ローカル開発では `.env.example` を `.env.local` にコピーして値を設定します。

```bash
AUTH_SECRET="replace-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
OWNER_GOOGLE_EMAILS="owner@example.com,backup-owner@example.com"

DATABASE_URL="file:./dev.db"
CRON_SECRET=""
BLOB_READ_WRITE_TOKEN=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SENTRY_DSN=""
```

Vercel Production では、同じキーを Project Settings の Environment Variables に設定します。`AUTH_URL` と `NEXT_PUBLIC_APP_URL` には本番 URL を入れてください。

## Google OAuth 設定

Google Cloud Console で OAuth client を作成し、以下の redirect URI を登録します。

- ローカル: `http://localhost:3000/api/auth/callback/google`
- 本番: `https://<your-domain>/api/auth/callback/google`

書き込みを許可する Google アカウントは、カンマ区切りのメールアドレスで指定します。

```bash
OWNER_GOOGLE_EMAILS="primary@example.com,backup@example.com"
```

Google OAuth profile の verified email がこのリストに一致する場合だけサインインできます。複数指定は、単一オーナー本人のメインアカウントと予備アカウントを想定しています。共同編集者リストではありません。

## Vercel デプロイ

1. このリポジトリを Vercel に Next.js project として import する
2. 上記の環境変数を設定する
3. Framework Preset が `Next.js` になっていることを確認する
4. `main` ブランチからデプロイする

GitHub organization 配下の private repository は、Vercel Hobby ではデプロイできません。その場合は repository を public にする、個人アカウント配下の private repository に移す、または Vercel Pro を利用してください。

## 主要ルート

| Route | 用途 |
|---|---|
| `/` | フレームワーク / 認証 / テーマ / i18n のスモークテストページ |
| `/api/health` | JSON ヘルスチェック |
| `/api/auth/[...nextauth]` | Auth.js Google OAuth |
| `/api/upload/recipe-image` | 認証必須のアップロードトークン発行スタブ |
| `/api/cron/daily-maintenance` | cron secret で保護された日次メンテナンススタブ |
| `/sitemap.xml` | 自動生成 sitemap |
| `/robots.txt` | 自動生成 robots |

//test