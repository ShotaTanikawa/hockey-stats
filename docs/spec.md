# アイスホッケー スタッツ管理アプリ 設計ドキュメント（強化版 / MVP）

## 0. このドキュメントの目的
- アイスホッケーのチームが「試合中・試合後のスタッツ管理」を効率的かつ安全に行うための Web アプリ（MVP版）の仕様を明文化する。
- 実装担当・PM・現場スタッフが同じ認識を持てるよう、機能・権限・データ・運用フローを具体化する。
- 実装は Next.js（App Router）+ Supabase を前提とする。

---

## 1. コンセプトとゴール
### 1-1. 目的
- 試合中のスタッツをスマホ／タブレットからリアルタイム入力できる。
- 試合後の転記作業・確認作業の手間とミスを減らす。
- シーズンを通じてチームや選手のスタッツを簡単に振り返れる。

### 1-2. 主要な解決課題
- 紙メモの書き漏れや数え間違い。
- アシスト/ブロック等の定義が人によってブレる。
- 試合後の集計・共有が手間。

### 1-3. 非ゴール（MVPではやらない）
- 複数チーム所属の同時管理。
- 統計の高度分析（Corsi, xG など）。
- 大会/リーグ跨ぎのランキング共有。

---

## 2. 想定ユーザー・権限
### 2-1. 役割
- staff：自チームの CRUD（試合・選手・スタッツ・メンバー）
- viewer：閲覧のみ
- 未ログイン：アクセス不可

### 2-2. 利用デバイス
- モバイルファースト（試合中はスマホ／タブレット）
- 試合後修正や通算確認は PC も想定

---

## 3. ユースケース（MVP）
- staff が試合を作成し、試合中にスタッツを入力する。
- 試合後に最終的なスタッツを修正・確定する。
- viewer が試合詳細・通算スタッツを閲覧する。
- staff が join_code を共有し、メンバーが viewer として参加する。
- staff が viewer を staff に昇格する。

---

## 4. 主要フロー
### 4-1. チーム作成フロー
1. `/signup` の「チーム作成」タブで登録。
2. `teams` を作成し、作成ユーザーは `team_members` に staff 登録。
3. `join_code` を発行し画面に表示。
4. 作成ユーザーは自動ログインを試行。

### 4-2. join_code 参加フロー
1. `/signup` の「参加」タブで join_code を入力。
2. `team_members` に viewer として登録。
3. ログイン後にダッシュボードへ遷移。

### 4-3. 試合ライブ入力フロー
1. staff が試合詳細から「ライブ」を開く。
2. スケーターは G/A/SOG/BLK/PIM をクリック入力。
3. ゴーリーは SA/GA のみ入力。
4. 変更は即時 upsert される。

### 4-4. 試合後修正フロー
1. staff が試合詳細から「修正」を開く。
2. 全選手分のスケーター・ゴーリースタッツを編集。
3. 保存時に全件 upsert で確定。

### 4-5. 通算スタッツ閲覧フロー
1. シーズンを選択。
2. 該当シーズンのゲームを取得し、集計して表示。

---

## 5. データモデル（MVP）
### 5-1. テーブル定義（概要）
- `teams`（id, name, join_code, season_label）
- `team_members`（team_id, user_id, role, is_active, created_at）
- `players`（team_id, name, number, position, is_active）
- `games`（team_id, season, game_date, opponent, venue, period_minutes, has_overtime）
- `player_stats`（game_id, player_id, goals, assists, shots, blocks, pim）
- `goalie_stats`（game_id, player_id, shots_against, saves, goals_against）

### 5-2. リレーション
- teams 1:N team_members
- teams 1:N players
- teams 1:N games
- games 1:N player_stats / goalie_stats
- players 1:N player_stats / goalie_stats

### 5-3. 推奨制約・インデックス
- `team_members` unique (team_id, user_id)
- `player_stats` unique (game_id, player_id)
- `goalie_stats` unique (game_id, player_id)
- `players` index (team_id, number)
- `games` index (team_id, season, game_date)

---

## 6. 権限設計（RLS 概要）
### 6-1. 共通
- 未ログインは全テーブルアクセス不可。
- team_members に紐づく team_id のみアクセス可能。

### 6-2. staff
- 自チームの CRUD を許可。
- viewer 昇格 API の実行を許可。

### 6-3. viewer
- 自チームの read のみ許可。

---

## 7. スタッツ定義と計算
### 7-1. スケーター
- GP, G, A, P, PIM, SOG, SH%, BLK

### 7-2. ゴーリー
- SA, Saves, GA, SV%, GAA

### 7-3. 計算式
- P = G + A
- SH% = G / SOG
- SV% = Saves / SA
- GAA = GA / 出場試合数

### 7-4. 保存方針
- DB は生値のみ保存。
- 派生値は UI 側で算出。

---

## 8. 画面一覧とルーティング
### 8-1. 認証系
- `/login`：ログイン
- `/signup`：参加 / チーム作成
- `/forgot-password`：パスワード再発行

### 8-2. ダッシュボード
- `/dashboard`：チーム情報 + 運用サマリ + クイックアクション
- 運用サマリ（MVP）：
  - 入力未開始の試合数
  - 定義：`player_stats` と `goalie_stats` がどちらも0件の試合を未入力とみなす

### 8-3. 試合・選手
- `/dashboard/games`：試合一覧（検索/シーズン/日付/OT フィルタ）
- `/dashboard/games/[gameId]`：試合詳細
- `/dashboard/games/[gameId]/live`：ライブ入力（staff）
- `/dashboard/games/[gameId]/edit`：試合後修正（staff）
- `/dashboard/players`：選手管理（検索/ポジション/ステータス）

### 8-4. シーズン通算
- `/dashboard/stats/players`：通算スタッツ
- `/dashboard/stats/glossary`：スタッツ用語集

---

## 9. API 仕様（MVP）
### 9-1. `POST /api/auth/signup`
- 目的：join_code 参加（viewer 登録）
- 入力：email, password, join_code
- 出力：ok, error

### 9-2. `POST /api/team/create`
- 目的：チーム作成 + staff 登録
- 入力：email, password, teamName, seasonLabel
- 出力：ok, joinCode, error

### 9-3. `GET /api/team-members/list`
- 目的：team_members の一覧取得（staffのみ）
- 入力：teamId
- 出力：members[], error

### 9-4. `POST /api/team-members/promote`
- 目的：viewer → staff 昇格（staffのみ）
- 入力：teamId, userId
- 出力：ok, error

---

## 10. バリデーション・入力制約
- チーム名：必須、50文字以内推奨。
- シーズン：`YYYY-YY` 形式（例: 2025-26）。
- 選手名：必須、50文字以内推奨。
- 背番号：正の整数、チーム内で重複チェック推奨。
- 試合日：必須、日付形式。
- ピリオド時間：15 or 20 分。
- スタッツ値：0以上の整数。

---

## 11. エラーハンドリング
- 失敗時はトースト通知とフォーム下のエラーメッセージを表示。
- viewer が編集操作を行った場合は権限エラーを表示。
- API エラーはユーザーに分かりやすい文言へ変換。

---

## 12. ログ・監視（MVP）
- 重要操作（チーム作成、権限昇格、試合作成）はサーバーログに出力。
- エラー発生時は console/error にスタックを残す。
- 将来的に Sentry などの導入を検討。

---

## 13. パフォーマンス・スケーラビリティ
- 試合一覧は日付降順で取得。
- 通算スタッツはシーズン単位で絞り込み。
- stats 集計は UI 側で行い、複雑な JOIN は避ける。
- データ量が増えたら集計用ビュー/マテビューを検討。

---

## 14. セキュリティ
- Supabase Auth による認証。
- RLS による team_id ベースのアクセス制御。
- service role key はサーバーサイドでのみ使用。
- すべての API で入力バリデーションを実施。

---

## 15. テスト（MVP）
### 15-1. 方針
- 最低限のE2E（画面表示のスモーク）を実施する。
- 回帰の早期検知を優先し、重要フローから拡張する。

### 15-2. E2E（Playwright）
- 対象：`/login` / `/signup` / `/forgot-password`
- 目的：ページの主要要素が表示されることを確認
- 実行：`pnpm test:e2e`

### 15-3. E2E（認証済みフロー）
- 対象：ログイン → `/dashboard` 到達
- 目的：最低限の認証フローが動作することを確認
- 必要な環境変数：
  - `E2E_USER_EMAIL`
  - `E2E_USER_PASSWORD`
- 実行：`pnpm test:e2e`

### 15-4. CI
- GitHub Actions で `pnpm test:e2e` を実行する
- 認証済みフローは `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` が無い場合はスキップする

---

## 16. MVP Acceptance Criteria
- Auth動作（login/logout/signup）が正常。
- staff が選手・試合を作成/編集できる。
- ライブ入力が安定して保存される。
- 試合後修正が上書き保存できる。
- 通算スタッツが表示できる。
- viewer は閲覧のみ可能。

---

## 17. Future（拡張候補）
- グラフ表示（得点推移、SV%推移）。
- CSV/Excel エクスポート。
- OAuthログイン。
- 複数チーム管理。
- 公式スコア/結果記録。
- ライブ入力のタイマー・Undo。

---

## 18. オープン項目
- 背番号の重複を強制的に禁止するか。
- シーズンの厳密管理（`seasons` テーブル導入）。
- 試合単位のイベントログをDBに保存するか。
