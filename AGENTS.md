# AGENTS.md

このファイルは、このリポジトリで作業するコーディングエージェント向けの運用ルールです。

## プロジェクト概要

MyKitchen は、個人利用向けのレシピ管理 Web アプリです。現在の実装は、Vercel にデプロイ可能なスモークテスト用スキャフォールドであり、完成版のレシピ管理機能ではありません。

プロダクトの振る舞いを変更する前に、以下を確認してください。

- `requirement.md`: プロダクト要件とスコープ
- `architecture.md`: システムアーキテクチャと実装方針

## 現在の技術スタック

- Next.js App Router
- TypeScript strict mode
- React 19
- Auth.js v5 Google Provider
- `next-themes`
- `locales/ja.json` による日本語文言管理
- Vercel デプロイ前提

## 重要な規約

- secret はリポジトリに入れない。ローカルでは `.env.local`、本番では Vercel Environment Variables を使う。
- オーナー認証は `OWNER_GOOGLE_EMAILS` の verified Google email allowlist で判定する。
- 複数の owner email は、単一オーナー本人のメインアカウントと予備アカウント用途とする。要件変更なしに共同編集機能を入れない。
- 料理写真は公開 URL で配信する。Private Blob access は現行アーキテクチャの対象外。
- UI 部品と共通処理はルート直下の `components/` と `lib/` を使う。`app/components/` や `app/lib/` は再導入しない。
- Server Components では `getTranslations()` を使う。`useTranslation()` は将来の Client Component 用エイリアスとして残している。
- 現在のタスクに不要な runtime dependency は追加しない。

## 必須チェック

コード変更をコミットする前に以下を実行します。

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

ドキュメントだけの変更では、実行可能な仕様に触れていない限り `npm run typecheck` で十分です。

## デプロイメモ

Vercel の設定は以下を前提にします。

- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: default または `npm install`
- Output Directory: default

必要な本番環境変数は `.env.example` と `README.md` に記載しています。

## 編集方針

- 変更は小さく、目的に沿って行う。
- README は利用者向けに簡潔に保つ。
- AGENTS.md はエージェント作業に必要な運用情報に絞る。
- 実装判断がプロダクト要件や設計に影響する場合は、`requirement.md` と `architecture.md` も更新する。
- 実際のプロダクト画面が置き換えるまでは、スモークテストページをデプロイ確認用として維持する。
