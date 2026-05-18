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
            mission?: string;
            vibe: string;
            duration: string;
            budget_range: string;
            tags: string[];
            preparation?: string;
            conversation_starter?: string;
            location_type?: "outside" | "home";
            preparation_list?: string[];
            steps?: string[];
            conversation_starters?: string[];
          };
          status: string;
          generated_at: string;
          revealed_at: string | null;
          location_type: "outside" | "home" | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea: Json;
          status?: string;
          generated_at?: string;
          revealed_at?: string | null;
          location_type?: "outside" | "home" | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea?: Json;
          status?: string;
          generated_at?: string;
          revealed_at?: string | null;
          location_type?: "outside" | "home" | null;
        };
        Relationships: [];
      };
      date_photos: {
        Row: {
          id: string;
          date_idea_id: string;
          profile_id: string;
          uploader_user_id: string;
          r2_key: string | null;
          skipped: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date_idea_id: string;
          profile_id: string;
          uploader_user_id: string;
          r2_key?: string | null;
          skipped?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          date_idea_id?: string;
          profile_id?: string;
          uploader_user_id?: string;
          r2_key?: string | null;
          skipped?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          profile_id: string;
          user_id: string;
          role: "owner" | "partner";
          created_at: string;
        };
        Insert: {
          profile_id: string;
          user_id: string;
          role: "owner" | "partner";
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          user_id?: string;
          role?: "owner" | "partner";
          created_at?: string;
        };
        Relationships: [];
      };
      partner_invites: {
        Row: {
          id: string;
          profile_id: string;
          inviter_user_id: string;
          invited_email: string;
          token_hash: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_user_id: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          inviter_user_id: string;
          invited_email: string;
          token_hash: string;
          expires_at: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          inviter_user_id?: string;
          invited_email?: string;
          token_hash?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          revoked_at?: string | null;
          created_at?: string;
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
      account_deletion_tokens: {
        Row: {
          token_hash: string;
          user_id: string;
          expires_at: string;
          created_at: string;
          request_ip: string | null;
          user_agent: string | null;
        };
        Insert: {
          token_hash: string;
          user_id: string;
          expires_at: string;
          created_at?: string;
          request_ip?: string | null;
          user_agent?: string | null;
        };
        Update: {
          token_hash?: string;
          user_id?: string;
          expires_at?: string;
          created_at?: string;
          request_ip?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      deletion_holds: {
        Row: {
          id_hash: string;
          revealed_at: string;
          cadence: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id_hash: string;
          revealed_at: string;
          cadence: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id_hash?: string;
          revealed_at?: string;
          cadence?: string;
          expires_at?: string;
          created_at?: string;
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
      processed_stripe_events: {
        Row: {
          event_id: string;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          processed_at?: string;
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
            date_outside: boolean;
            date_at_home: boolean;
            has_car?: boolean;
            prefers_walking?: boolean;
          };
          cadence: string;
          onboarding_complete: boolean;
          revealed_at: string | null;
          date_idea: {
            title: string;
            description: string;
            mission?: string;
            vibe: string;
            duration: string;
            budget_range: string;
            tags: string[];
            preparation?: string;
            conversation_starter?: string;
          } | null;
          date_teaser: {
            vibe: string;
            activity_level: string;
            price: string;
            hook: string;
          } | null;
          total_xp: number;
          dates_completed_count: number;
          preferred_radius: number;
          last_lat: number | null;
          last_long: number | null;
          notification_sent_at: string | null;
          plan_type: string;
          stripe_customer_id?: string | null;
          subscription_ends_at: string | null;
          total_rerolls_used: number;
          current_date_rerolled: boolean;
          date_accepted_at: string | null;
          reveal_owner_ready_at: string | null;
          reveal_partner_ready_at: string | null;
          checkin_owner_at: string | null;
          checkin_partner_at: string | null;
          checkin_owner_skipped: boolean;
          checkin_partner_skipped: boolean;
          total_checkins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          partner_names?: { partner1: string; partner2: string };
          interests?: string[];
          constraints?: {
            budget_max: number;
            date_outside: boolean;
            date_at_home: boolean;
            has_car?: boolean;
            prefers_walking?: boolean;
          };
          cadence?: string;
          onboarding_complete?: boolean;
          revealed_at?: string | null;
          date_idea?: Json | null;
          date_teaser?: Json | null;
          total_xp?: number;
          dates_completed_count?: number;
          preferred_radius?: number;
          last_lat?: number | null;
          last_long?: number | null;
          notification_sent_at?: string | null;
          plan_type?: string;
          stripe_customer_id?: string | null;
          subscription_ends_at?: string | null;
          total_rerolls_used?: number;
          current_date_rerolled?: boolean;
          date_accepted_at?: string | null;
          reveal_owner_ready_at?: string | null;
          reveal_partner_ready_at?: string | null;
          checkin_owner_at?: string | null;
          checkin_partner_at?: string | null;
          checkin_owner_skipped?: boolean;
          checkin_partner_skipped?: boolean;
          total_checkins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_names?: { partner1: string; partner2: string };
          interests?: string[];
          constraints?: {
            budget_max: number;
            date_outside: boolean;
            date_at_home: boolean;
            has_car?: boolean;
            prefers_walking?: boolean;
          };
          cadence?: string;
          onboarding_complete?: boolean;
          revealed_at?: string | null;
          date_idea?: Json | null;
          date_teaser?: Json | null;
          total_xp?: number;
          dates_completed_count?: number;
          preferred_radius?: number;
          last_lat?: number | null;
          last_long?: number | null;
          notification_sent_at?: string | null;
          plan_type?: string;
          stripe_customer_id?: string | null;
          subscription_ends_at?: string | null;
          total_rerolls_used?: number;
          current_date_rerolled?: boolean;
          date_accepted_at?: string | null;
          reveal_owner_ready_at?: string | null;
          reveal_partner_ready_at?: string | null;
          checkin_owner_at?: string | null;
          checkin_partner_at?: string | null;
          checkin_owner_skipped?: boolean;
          checkin_partner_skipped?: boolean;
          total_checkins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_date_atomic: {
        Args: { p_user_id: string; p_xp_gain: number };
        Returns: { total_xp: number; dates_completed_count: number; gated: boolean };
      };
      backfill_completed_xp: {
        Args: { p_user_id: string; p_xp_per_date?: number };
        Returns: { total_xp: number; dates_completed_count: number };
      };
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: { allowed: boolean; retry_after_seconds: number }[];
      };
      cleanup_rate_limits: {
        Args: Record<string, never>;
        Returns: number;
      };
      cleanup_deletion_holds: {
        Args: Record<string, never>;
        Returns: number;
      };
      cleanup_account_deletion_tokens: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];

export type PlanType = "free" | "subscription";

export interface UserPlan {
  planType: PlanType;
  dateFrequency?: "weekly" | "biweekly" | "monthly";
}

export type CheckInResult =
  | { status: "waiting"; xpGained: number }
  | { status: "completed"; result: CompleteDateResult }
  | { status: "too_far"; distanceMeters: number }
  | { status: "no_venue" }
  | { status: "error"; error: string };

export interface CompleteDateResult {
  xpGained: number;
  newTotalXp: number;
  newLevel: number;
  newBadges: { name: string; description: string; icon_emoji: string }[];
  planType: PlanType;
  gated: boolean;
  dateIdeaId: string;
}
