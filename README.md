# Hockey Stats（アイスホッケー スタッツ管理アプリ）

試合中のリアルタイム入力と、試合後の修正・集計を一つのUIで完結できるMVPです。  
スタッフが記録、選手は閲覧のみという運用に合わせて、RLSで安全にデータを分離します。

## 主要機能
- 試合作成 / 一覧 / 詳細
- ライブ入力（Skater + Goalie SA/GA）
- 試合後の修正
- シーズン通算スタッツ（Skaters / Goalies）
- 権限管理（staff / viewer）
- スタッツ定義のツールチップ
- トースト通知

## 技術スタック
- Next.js (App Router)
- Supabase (Auth / DB / RLS)
- TypeScript
- Tailwind CSS
- shadcn/ui

## 仕様書
- `docs/spec.md`

## 画面イメージ
※ 追加予定（スクリーンショットを後日掲載）

## ローカル起動
```bash
pnpm install
pnpm dev
```

## 環境変数
`.env.local` に以下を設定してください。
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## スクリプト
- `pnpm dev` 開発サーバー起動
- `pnpm build` ビルド
- `pnpm start` 本番起動
- `pnpm format` フォーマット

## デプロイ
Vercelを想定しています。  
環境変数をセットしてデプロイしてください。
