# アイスホッケー スタッツ管理アプリ 設計ドキュメント（MVP / Notion同期版）

このドキュメントは「現行ソースに一致する最新版仕様」を前提に、Notionで管理しやすい構成へ再整理したもの。Notionのページ構成へそのまま貼り分け可能な粒度で整理する。

---

## 1. サマリー

- 目的: 試合中・試合後のスタッツ管理を現場で安全・簡単に行う
- 対象: チームスタッフ（入力担当）、選手/監督（閲覧）
- 実装: Next.js（App Router） + Supabase
- 運用: 1ユーザー=1チーム所属、ロールは staff / viewer

---

## 2. 目的と非ゴール

### 2-1. 目的

- 試合中のリアルタイム入力をモバイルで実現
- 試合後の転記/修正の手間削減
- シーズン通算の可視化

### 2-2. 非ゴール（MVP）

- 複数チームの同時管理
- 高度分析（Corsi, xG等）
- 公開ランキングや外部共有

---

## 3. 役割と権限

### 3-1. ロール

- staff: 自チームの CRUD（試合/選手/スタッツ/メンバー）
- viewer: 閲覧のみ
- 未ログイン: アクセス不可

### 3-2. 運用前提

- 1ユーザー=1チーム所属
- 招待コード（1回限り）によるチーム参加

---

## 4. ユースケース（MVP）

- staff が試合作成 → 試合中にスタッツ入力
- staff が試合後修正で確定
- viewer が試合詳細/通算を閲覧
- staff が招待コード（1回限り）を共有
- staff が viewer を staff へ昇格

---

## 5. 主要フロー

### 5-1. チーム作成

1. `/signup` の「チーム作成」タブで登録
2. `teams` 作成 + `team_members` に staff 登録
3. 招待コードを発行・表示
4. 作成ユーザーは自動ログインを試行

### 5-2. 招待コード参加

1. `/signup` の「参加」タブで招待コードを入力
2. `team_members` に viewer 登録
3. ログイン後にダッシュボードへ

### 5-3. 試合ライブ入力

1. 試合詳細から「ライブ」へ
2. スケーター: G/A/SOG/BLK/PIM をクリック入力
3. ゴーリー: SA/GA のみ入力
4. 変更は即時 upsert

### 5-4. 試合後修正

1. 試合詳細から「修正」へ
2. スケーター/ゴーリーをまとめて編集
3. 保存時に全件 upsert

### 5-5. 試合確定/再開封

1. 試合詳細で「確定」を押すと `workflow_status = finalized`
2. finalized の試合はライブ入力/試合後修正をロックする
3. staff は「再開封」で `in_progress` に戻せる

### 5-6. 通算スタッツ

1. シーズンを選択
2. 該当ゲームを集計し一覧表示

---

## 6. 画面一覧とルーティング

### 6-1. 認証

- `/login`
- `/signup`
- `/forgot-password`

### 6-2. ダッシュボード

- `/dashboard`: チーム情報 + 運用サマリ + クイックアクション
- 運用サマリ（MVP）
  - 入力未開始の試合数
  - 定義: `player_stats` と `goalie_stats` がどちらも0件の試合
  - 要対応アラート（2日超の未確定試合 / finalized後のゴーリー整合性エラー）
- `/dashboard/audit`: 監査ログ（staffのみ）
- `/dashboard/operations`: 運用メニュー（staffのみ）

### 6-3. 試合・選手

- `/dashboard/games`: 試合一覧（検索/シーズン/日付/OT フィルタ）
- `/dashboard/games/[gameId]`: 試合詳細（CSV出力）
- `/dashboard/games/[gameId]/live`: ライブ入力（staff）
- `/dashboard/games/[gameId]/edit`: 試合後修正（staff）
- `/dashboard/players`: 選手管理（検索/ポジション/ステータス）

### 6-4. 通算

- `/dashboard/stats/players`: 通算スタッツ（CSV出力）
- `/dashboard/stats/glossary`: 用語集

---

## 7. データモデル（MVP）

### 7-1. テーブル

- `teams`（id, name, join_code, season_label）
- `invite_codes`（team_id, code, created_by, created_at, used_by, used_at）
- `team_members`（team_id, user_id, role, is_active, created_at）
- `players`（team_id, name, number, position, is_active）
- `games`（team_id, season, game_date, opponent, venue, period_minutes, has_overtime, workflow_status）
- `player_stats`（game_id, player_id, goals, assists, shots, blocks, pim）
- `goalie_stats`（game_id, player_id, shots_against, saves, goals_against）

### 7-2. リレーション

- teams 1:N team_members / players / games / invite_codes
- games 1:N player_stats / goalie_stats
- players 1:N player_stats / goalie_stats

### 7-3. 制約・インデックス

- `team_members` unique (team_id, user_id)
- `player_stats` unique (game_id, player_id)
- `goalie_stats` unique (game_id, player_id)
- `players` index (team_id, number)
- `games` index (team_id, season, game_date)
- `games.period_minutes` check (15 or 20)
- `player_stats` check (全項目が0以上)
- `goalie_stats` check (`saves <= shots_against`, `goals_against <= shots_against`, `saves + goals_against <= shots_against`)
- `players` check (`number > 0`, `position in ('F','D','G')`)

---

## 8. スタッツ定義と計算

### 8-1. スケーター

- GP, G, A, P, PIM, SOG, SH%, BLK

### 8-2. ゴーリー

- SA, Saves, GA, SV%, GAA

### 8-3. 計算式

- P = G + A
- SH% = G / SOG
- SV% = Saves / SA
- GAA = GA / 出場試合数

### 8-4. 保存方針

- DB は生値のみ保存
- 派生値は UI で算出

---

## 9. API 仕様（MVP）

### 9-1. `POST /api/auth/signup`

- 目的: 招待コード参加（viewer 登録）
- 入力: email, password, joinCode
- 出力: ok, error

### 9-2. `POST /api/team/create`

- 目的: チーム作成 + staff 登録 + 初回招待コード発行
- 入力: email, password, teamName, seasonLabel
- 出力: ok, joinCode, error

### 9-3. `GET /api/team-members/list`

- 目的: team_members の一覧取得（staffのみ）
- 入力: teamId
- 出力: members[], error

### 9-4. `POST /api/team-members/promote`

- 目的: viewer → staff 昇格（staffのみ）
- 入力: teamId, userId
- 出力: ok, error

### 9-5. `POST /api/invites/create`

- 目的: 招待コードを1つ発行（staffのみ）
- 入力: teamId
- 出力: ok, inviteCode, error

### 9-6. `GET /api/export/games/[gameId]`

- 目的: 単一試合の詳細CSV出力（viewer/staff）
- 出力: `text/csv`

### 9-7. `GET /api/export/stats/season?season=...`

- 目的: 指定シーズン通算CSV出力（viewer/staff）
- 出力: `text/csv`

---

## 10. 権限設計（RLS 概要）

- 未ログインは全テーブルアクセス不可
- team_members に紐づく team_id のみアクセス可
- staff: 自チームの CRUD
- viewer: 自チームの read のみ
- finalized 試合では `player_stats` / `goalie_stats` の更新を拒否

---

## 11. バリデーション

- チーム名: 必須、50文字以内推奨
- シーズン: `YYYY-YY` 形式
- 選手名: 必須、50文字以内推奨
- 背番号: 正の整数、チーム内の現役選手で重複不可（UIチェック）
- 試合日: 必須、日付形式
- ピリオド時間: 15 or 20
- スタッツ値: 0以上の整数
- ゴーリー整合性: `GA <= SA`, `Saves <= SA`, `Saves + GA <= SA`

---

## 12. エラーハンドリング

- 失敗時はトースト通知 + フォーム下のエラーメッセージ
- viewer が編集操作した場合は権限エラー
- API エラーはユーザー向け文言へ変換

---

## 13. ログ・監視

- 重要操作（チーム作成、参加、権限昇格）はサーバーログ出力
- DB側で `audit_logs` を保持（誰が/いつ/どのレコードを変更したか）
- 監査ログ画面で action/entity/date/変更キーを確認可能
- Sentry を導入済み（ブラウザ/サーバー例外の収集）
- ダッシュボード/運用画面に要対応アラートを表示

---

## 14. テスト（MVP）

### 14-1. E2E（Playwright）

- スモーク: `/login` / `/signup` / `/forgot-password`
- 認証済み: ログイン → `/dashboard`
- 試合管理: ログイン → 試合作成 → 一覧表示 → 試合削除
- 実行: `pnpm test:e2e`
- 必要環境変数: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`

### 14-2. CI

- GitHub Actions で `pnpm test:e2e`
- 認証済みフローは環境変数が無ければスキップ

---

## 15. 実運用に向けた追加観点（残タスク）

ここは「実運用するなら最優先で詰める箇所」。

### 15-0. 運用手順書

- 詳細な運用手順は `docs/operations.md` に集約する

### 15-1. セキュリティ

- Supabase の環境変数を CI / 本番 / ローカルで分離
- service role key はサーバー専用、クライアントには出さない
- 招待コードのローテーション運用（漏洩時の再発行フロー）

### 15-2. 監視・障害対応

- 障害時の問い合わせ導線（連絡先・一次対応フロー）
- 閾値ベース通知（例: 連続保存失敗のSlack通知）

### 15-3. バックアップ

- Free プラン前提では自動バックアップが使えないため、週1回の手動バックアップを運用ルールとする
- 復旧目標は「直近1週間まで戻せること」
- 手動バックアップは Supabase Dashboard のエクスポート機能で取得し、安全な場所に保管する

### 15-4. 運用ルール

- staff 昇格の運用ルール（誰が承認するか）
- 招待コードの共有範囲（1回限り・誰に配るか）
- 選手の除籍/復帰手順

---


## 16. MVP Acceptance Criteria

- Auth 動作（login/logout/signup）
- staff が選手・試合を作成/編集できる
- ライブ入力が保存される
- 試合後修正が上書き保存される
- 通算スタッツが表示できる
- viewer は閲覧のみ

---

## 17. Future（拡張候補）

- グラフ表示（得点推移、SV%推移）
- OAuthログイン
- 複数チーム管理
- 公式スコア/結果記録
- ライブ入力のタイマー・Undo

---

## 18. オープン項目

- 背番号の重複を強制的に禁止するか
- シーズンの厳密管理（`seasons` テーブル導入）
- 試合単位のイベントログをDBに保存するか
