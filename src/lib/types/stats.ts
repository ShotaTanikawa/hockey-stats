// games テーブルの表示用データ
// - team_id/season は画面によって省略されるため optional
export type GameRow = {
    id: string;
    game_date: string;
    opponent: string;
    venue: string | null;
    period_minutes: number;
    has_overtime: boolean;
    team_id?: string;
    season?: string;
};

// スケーター基本情報（GK以外）
export type Skater = {
    id: string;
    name: string;
    number: number;
    position: "F" | "D";
};

// ゴーリー基本情報
export type Goalie = {
    id: string;
    name: string;
    number: number;
};

// players テーブル行（ロースター表示用）
export type PlayerRow = {
    id: string;
    name: string;
    number: number;
    position: "F" | "D" | "G";
    is_active: boolean;
};

// スケーターの試合スタッツ（生値）
export type SkaterStat = {
    goals: number;
    assists: number;
    shots: number;
    blocks: number;
    pim: number;
};

// ゴーリーの試合スタッツ（生値）
export type GoalieStat = {
    shots_against: number;
    saves: number;
    goals_against: number;
};

// player_stats の1行（選手ID付き）
export type SkaterStatRow = SkaterStat & {
    player_id: string;
    game_id?: string;
};

// goalie_stats の1行（選手ID付き）
export type GoalieStatRow = GoalieStat & {
    player_id: string;
    game_id?: string;
};

// 試合詳細表示用（選手情報JOIN済み）
export type SkaterStatWithPlayer = SkaterStatRow & {
    players: {
        name: string;
        number: number;
        position: string;
    } | null;
};

// 試合詳細表示用（ゴーリー情報JOIN済み）
export type GoalieStatWithPlayer = GoalieStatRow & {
    players: {
        name: string;
        number: number;
    } | null;
};

// シーズン通算のスケーター集計
export type SkaterSummaryRow = Skater &
    SkaterStat & {
        gp: number;
    };

// シーズン通算のゴーリー集計
export type GoalieSummaryRow = Goalie &
    GoalieStat & {
        gp: number;
    };
