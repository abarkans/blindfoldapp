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
