export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      date_ideas: {
        Row: {
          id: string;
          user_id: string;
          idea: {
            title: string;
            description: string;
            emoji: string;
            vibe: string;
            duration: string;
            budget_range: string;
            tags: string[];
          };
          status: string;
          generated_at: string;
          revealed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea: Json;
          status?: string;
          generated_at?: string;
          revealed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea?: Json;
          status?: string;
          generated_at?: string;
          revealed_at?: string | null;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_emoji: string;
          required_dates: number;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_emoji: string;
          required_dates: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon_emoji?: string;
          required_dates?: number;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          milestone_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          milestone_id?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_milestone_id_fkey";
            columns: ["milestone_id"];
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          partner_names: { partner1: string; partner2: string };
          interests: string[];
          constraints: {
            budget_max: number;
            has_car: boolean;
            prefers_walking: boolean;
          };
          cadence: string;
          onboarding_complete: boolean;
          revealed_at: string | null;
          date_idea: {
            title: string;
            description: string;
            emoji: string;
            vibe: string;
            duration: string;
            budget_range: string;
            tags: string[];
          } | null;
          total_xp: number;
          dates_completed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          partner_names?: { partner1: string; partner2: string };
          interests?: string[];
          constraints?: {
            budget_max: number;
            has_car: boolean;
            prefers_walking: boolean;
          };
          cadence?: string;
          onboarding_complete?: boolean;
          revealed_at?: string | null;
          date_idea?: Json | null;
          total_xp?: number;
          dates_completed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_names?: { partner1: string; partner2: string };
          interests?: string[];
          constraints?: {
            budget_max: number;
            has_car: boolean;
            prefers_walking: boolean;
          };
          cadence?: string;
          onboarding_complete?: boolean;
          revealed_at?: string | null;
          date_idea?: Json | null;
          total_xp?: number;
          dates_completed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];

export interface CompleteDateResult {
  xpGained: number;
  newTotalXp: number;
  newLevel: number;
  newBadges: { name: string; description: string; icon_emoji: string }[];
}
