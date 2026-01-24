# アイスホッケー スタッツ管理アプリ 設計ドキュメント（MVP）

## 0. このドキュメントの目的
- アイスホッケーのチームが「試合中・試合後のスタッツ管理」を効率的かつ安全に行うための Webアプリ（MVP版）の仕様書。
- エンジニアだけでなく、PMやスタッフが読んでも目的・機能・権限が理解できることを目指す。
- 実装は Next.js（App Router）+ Supabase を想定。

---

## 1. コンセプトとゴール
### 1-1. 目的
- 試合中のスタッツをスマホ／タブレットからリアルタイム入力できる。
- 試合後の転記作業・確認作業の手間とミスを減らす。
- シーズンを通じてチームや選手のスタッツを簡単に振り返れる。

### 1-2. 課題
- 紙メモは書き漏れ・数え間違いが起きやすい。
- 試合中にアシスト/ブロックの定義がブレる。
- スタッツ定義が人によって異なる。
- 選手が自分のスタッツを確認しづらい。

### 1-3. 想定ユーザー
- 主ユーザー（入力）：マネージャー/コーチ/スタッフ
- 副ユーザー（閲覧）：選手/監督

### 1-4. デバイス
- モバイルファースト（スマホ・タブレット）
- 試合後の修正はPC/タブレットも想定

---

## 2. 取り扱うスタッツ（MVP）
### 2-1. スケーター
- GP, G, A, P, PIM, SOG, SH%, BLK

### 2-2. ゴーリー
- SA, Saves, GA, SV%, GAA
- Saves は試合後に確定（ライブ入力しない）

### 2-3. GKスタッツ入力方針
- ライブ入力は SA / GA のみ
- 試合後に Saves を確定（手入力可）

### 2-4. 計算項目
- DBは生値のみ保存、派生値はUI側で計算（MVP）
- `period_minutes` は試合単位で保持

---

## 3. 機能一覧（Must / Should / Future）
### 3-1. Must
- ログイン / ログアウト（メール+パスワード）
- チーム情報（チーム名・シーズン）
- 選手登録・一覧・編集・除籍
- 試合作成・一覧・詳細
- ライブ入力（Skater + Goalie SA/GA）
- 試合後修正
- シーズン通算（Skaters / Goalies）
- staffは編集可、viewerは閲覧のみ
- スタッツ定義のツールチップ
- トースト通知

### 3-2. Should
- スタッツ用語集ページ
- 試合一覧フィルタ/ソート
- 選手スタッツのフィルタ
- 自分のプロフィール閲覧
- ヘッダーの状態表示強化
- 簡易チュートリアル

### 3-3. Future
- グラフ表示
- CSV/Excelエクスポート
- プロフィール編集
- OAuthログイン
- 複数チーム管理

---

## 4. 認証・ロール・権限設計
### 4-1. 認証方式
- Supabase Auth（メール + パスワード）
- パスワードリセット（Supabase標準）

### 4-2. ロール
- staff：自チームのCRUD + viewer昇格
- viewer：閲覧のみ
- 未ログイン：アクセス不可

### 4-3. チーム所属と運用前提（更新）
- MVPでは「初回ユーザーがチームを作成する」運用。
- チーム作成時に `teams` を作成し、作成者は staff 登録。
- `join_code` は自動生成し、作成直後に表示。
- 以後は join_code で viewer 登録。
- 1ユーザー = 1チーム所属（MVP）

---

## 5. 画面一覧とルーティング
### 5-1. 認証系
- `/login`：ログイン
- `/signup`：2タブ構成
  - 参加：メール / パスワード / join_code
  - チーム作成：メール / パスワード / チーム名 / シーズン

### 5-2. ダッシュボード
- `/dashboard`：チーム情報とクイック導線

### 5-3. 試合・選手
- `/games`：一覧・作成
- `/games/[gameId]`：詳細
- `/games/[gameId]/live`：ライブ入力（staff）
- `/games/[gameId]/edit`：試合後修正（staff）
- `/players`：選手管理

### 5-4. シーズン通算
- `/stats/players`：通算スタッツ（タブ）

---

## 6. データモデル設計（MVP）
- `teams`（id, name, join_code, season_label）
- `team_members`（team_id, user_id, role, is_active）
- `players`（team_id, name, number, position, is_active）
- `games`（team_id, season, game_date, opponent, venue, period_minutes, has_overtime）
- `player_stats`（game_id, player_id, goals, assists, shots, blocks, pim）
- `goalie_stats`（game_id, player_id, shots_against, saves, goals_against）

---

## 7. RLS 概要
- staff：自チームCRUD
- viewer：自チーム読み取りのみ
- 未ログイン：不可

---

## 8. Route Handler 役割
- `POST /api/auth/signup`：join_code 参加（viewer）
- `POST /api/team/create`：チーム作成（staff登録 + join_code生成）
- `POST /api/team-members/promote`：viewer → staff

---

## 9. MVP Acceptance Criteria
- Auth動作（login/logout/signup）
- staffが選手・試合を作成/編集/削除できる
- ライブ入力（Skaters + Goalie SA/GA）
- 試合後修正
- 詳細表示（チーム合計 + 個人）
- 通算スタッツ表示
- viewerは閲覧のみ

