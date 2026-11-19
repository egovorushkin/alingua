import type { Progress } from "../../utils/progress";

export type ProgressRow = {
  user_id: string;
  stars: number;
  streak: number;
  last_active_date: string | null;
  completed_topics: string[];
  learned_words_count: number;
  topic_results: Progress;
  best_streak: number;
  last_claimed_date: string | null;
  consecutive_days: number;
  daily_bonus_badge: boolean;
  claimed_map_chests: string[];
  completed_bosses: string[];
  revision: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      user_progress: {
        Row: ProgressRow;
        Insert: Omit<ProgressRow, "revision" | "updated_at">;
        Update: Partial<Omit<ProgressRow, "user_id" | "revision" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
