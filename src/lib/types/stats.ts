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

export type Skater = {
    id: string;
    name: string;
    number: number;
    position: "F" | "D";
};

export type Goalie = {
    id: string;
    name: string;
    number: number;
};

export type PlayerRow = {
    id: string;
    name: string;
    number: number;
    position: "F" | "D" | "G";
    is_active: boolean;
};

export type SkaterStat = {
    goals: number;
    assists: number;
    shots: number;
    blocks: number;
    pim: number;
};

export type GoalieStat = {
    shots_against: number;
    saves: number;
    goals_against: number;
};

export type SkaterStatRow = SkaterStat & {
    player_id: string;
    game_id?: string;
};

export type GoalieStatRow = GoalieStat & {
    player_id: string;
    game_id?: string;
};

export type SkaterStatWithPlayer = SkaterStatRow & {
    players: Array<{
        name: string;
        number: number;
        position: string;
    }> | null;
};

export type GoalieStatWithPlayer = GoalieStatRow & {
    players: Array<{
        name: string;
        number: number;
    }> | null;
};

export type SkaterSummaryRow = Skater & SkaterStat & {
    gp: number;
};

export type GoalieSummaryRow = Goalie & GoalieStat & {
    gp: number;
};
