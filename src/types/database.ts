export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string;
          id: number;
          last_message_at: string | null;
          user_a: string;
          user_b: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          last_message_at?: string | null;
          user_a: string;
          user_b: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          brand: string;
          brand_color: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          duration: number;
          end_date: string | null;
          experts: Json;
          history: Json;
          icon: string | null;
          id: number;
          logo: string | null;
          prize_pool: number;
          start_date: string | null;
          status: Database["public"]["Enums"]["event_status"];
          sym: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & { brand: string };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      experts: {
        Row: {
          acc: number;
          badges: Json;
          bio: string | null;
          cat: string | null;
          certs: Json;
          created_at: string;
          gk: Database["public"]["Enums"]["grade_key"];
          id: number;
          name: string;
          preds: number;
          profile_id: string | null;
          q_scores: Json;
          rank: number | null;
          score: number;
          subs: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["experts"]["Row"]> & {
          name: string;
          gk: Database["public"]["Enums"]["grade_key"];
          score: number;
          acc: number;
        };
        Update: Partial<Database["public"]["Tables"]["experts"]["Row"]>;
        Relationships: [];
      };
      feed_items: {
        Row: {
          acc: number | null;
          agk: Database["public"]["Enums"]["grade_key"] | null;
          author: string;
          cat: string | null;
          created_at: string;
          deadline_text: string | null;
          expert_id: number | null;
          id: number;
          preds: number;
          price: number;
          score: number | null;
          subscribe_only: boolean;
          title_parts: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["feed_items"]["Row"]> & { author: string };
        Update: Partial<Database["public"]["Tables"]["feed_items"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: number;
          created_at: string;
          id: number;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: number;
          created_at?: string;
          id?: number;
          sender_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      predictions: {
        Row: {
          a_label: string;
          a_ratio: number | null;
          author_acc: number | null;
          author_expert_id: number | null;
          author_gk: Database["public"]["Enums"]["grade_key"] | null;
          author_name: string | null;
          author_score: number | null;
          b_label: string;
          b_ratio: number | null;
          blind: boolean;
          cat: string;
          created_at: string;
          deadline_at: string | null;
          deadline_text: string | null;
          ea: string | null;
          eb: string | null;
          fail_p: number | null;
          hot: boolean;
          id: number;
          participants: number;
          price: number;
          q: string;
          result: Database["public"]["Enums"]["pred_choice"] | null;
          stage: Database["public"]["Enums"]["pred_stage"];
          status: string | null;
          success_p: number | null;
          total_p: number | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["predictions"]["Row"]> & {
          a_label: string;
          b_label: string;
          cat: string;
          q: string;
        };
        Update: Partial<Database["public"]["Tables"]["predictions"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          accuracy: number;
          badges: Json;
          bio: string | null;
          category: string | null;
          created_at: string;
          email: string | null;
          grade: Database["public"]["Enums"]["grade_key"];
          handle: string;
          id: string;
          preds_count: number;
          score: number;
          subs_count: number;
          updated_at: string;
          wallet: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          handle: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      user_predictions: {
        Row: {
          choice: Database["public"]["Enums"]["pred_choice"];
          id: number;
          is_correct: boolean | null;
          prediction_id: number;
          sealed_at: string;
          user_id: string;
        };
        Insert: {
          choice: Database["public"]["Enums"]["pred_choice"];
          prediction_id: number;
          user_id: string;
          id?: number;
          is_correct?: boolean | null;
          sealed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_predictions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      event_status: "live" | "upcoming" | "ended";
      grade_key: "candidate" | "forecaster" | "proven" | "seer";
      pred_choice: "A" | "B";
      pred_stage: "active" | "verify" | "done";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
