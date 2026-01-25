// チームメンバー一覧表示用の最小データ
// - service role で取得したユーザー情報と統合して使う
export type TeamMemberSummary = {
    userId: string;
    role: "staff" | "viewer";
    email: string | null;
};
