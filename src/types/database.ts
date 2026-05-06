export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      challenge_applications: {
        Row: {
          created_at: string
          id: number
          motivation: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["challenge_status"]
          target_grade: Database["public"]["Enums"]["grade_key"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          motivation?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          target_grade: Database["public"]["Enums"]["grade_key"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          motivation?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          target_grade?: Database["public"]["Enums"]["grade_key"]
          user_id?: string
        }
        Relationships: []
      }
      chatroom_messages: {
        Row: {
          content: string
          created_at: string
          expert_id: number
          id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expert_id: number
          id?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expert_id?: number
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          comment_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          comment_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: number
          likes: number
          prediction_id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          likes?: number
          prediction_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          likes?: number
          prediction_id?: number
          user_id?: string
        }
        Relationships: []
      }
      content_unlocks: {
        Row: {
          content_id: number
          content_type: string
          cost: number
          created_at: string
          id: number
          method: string
          user_id: string
        }
        Insert: {
          content_id: number
          content_type: string
          cost?: number
          created_at?: string
          id?: number
          method: string
          user_id: string
        }
        Update: {
          content_id?: number
          content_type?: string
          cost?: number
          created_at?: string
          id?: number
          method?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: number
          last_message_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: number
          last_message_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: number
          last_message_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          brand: string
          brand_color: string | null
          created_at: string
          deadline: string | null
          description: string | null
          duration: number
          end_date: string | null
          experts: Json
          history: Json
          icon: string | null
          id: number
          logo: string | null
          prize_pool: number
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"]
          sym: string | null
        }
        Insert: {
          brand: string
          brand_color?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: number
          end_date?: string | null
          experts?: Json
          history?: Json
          icon?: string | null
          id?: number
          logo?: string | null
          prize_pool?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          sym?: string | null
        }
        Update: {
          brand?: string
          brand_color?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: number
          end_date?: string | null
          experts?: Json
          history?: Json
          icon?: string | null
          id?: number
          logo?: string | null
          prize_pool?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          sym?: string | null
        }
        Relationships: []
      }
      expert_subscriptions: {
        Row: {
          created_at: string
          expert_id: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expert_id: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expert_id?: number
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      experts: {
        Row: {
          acc: number
          badges: Json
          bio: string | null
          cat: string | null
          certs: Json
          created_at: string
          gk: Database["public"]["Enums"]["grade_key"]
          id: number
          name: string
          preds: number
          profile_id: string | null
          q_scores: Json
          rank: number | null
          score: number
          subs: number
          updated_at: string
        }
        Insert: {
          acc: number
          badges?: Json
          bio?: string | null
          cat?: string | null
          certs?: Json
          created_at?: string
          gk: Database["public"]["Enums"]["grade_key"]
          id?: number
          name: string
          preds?: number
          profile_id?: string | null
          q_scores?: Json
          rank?: number | null
          score: number
          subs?: number
          updated_at?: string
        }
        Update: {
          acc?: number
          badges?: Json
          bio?: string | null
          cat?: string | null
          certs?: Json
          created_at?: string
          gk?: Database["public"]["Enums"]["grade_key"]
          id?: number
          name?: string
          preds?: number
          profile_id?: string | null
          q_scores?: Json
          rank?: number | null
          score?: number
          subs?: number
          updated_at?: string
        }
        Relationships: []
      }
      feed_items: {
        Row: {
          acc: number | null
          agk: Database["public"]["Enums"]["grade_key"] | null
          author: string
          cat: string | null
          created_at: string
          deadline_text: string | null
          expert_id: number | null
          id: number
          preds: number
          price: number
          score: number | null
          subscribe_only: boolean
          title_parts: Json
        }
        Insert: {
          acc?: number | null
          agk?: Database["public"]["Enums"]["grade_key"] | null
          author: string
          cat?: string | null
          created_at?: string
          deadline_text?: string | null
          expert_id?: number | null
          id?: number
          preds?: number
          price?: number
          score?: number | null
          subscribe_only?: boolean
          title_parts?: Json
        }
        Update: {
          acc?: number | null
          agk?: Database["public"]["Enums"]["grade_key"] | null
          author?: string
          cat?: string | null
          created_at?: string
          deadline_text?: string | null
          expert_id?: number | null
          id?: number
          preds?: number
          price?: number
          score?: number | null
          subscribe_only?: boolean
          title_parts?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: number
          created_at: string
          id: number
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: number
          created_at?: string
          id?: number
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: number
          created_at?: string
          id?: number
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: number
          is_read: boolean
          link_data: Json | null
          link_screen: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: number
          is_read?: boolean
          link_data?: Json | null
          link_screen?: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: number
          is_read?: boolean
          link_data?: Json | null
          link_screen?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: number
          reason: string
          ref_id: number | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: number
          reason: string
          ref_id?: number | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: number
          reason?: string
          ref_id?: number | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          a_label: string
          a_ratio: number | null
          author_acc: number | null
          author_expert_id: number | null
          author_gk: Database["public"]["Enums"]["grade_key"] | null
          author_name: string | null
          author_score: number | null
          author_user_id: string | null
          b_label: string
          b_ratio: number | null
          blind: boolean
          cat: string
          created_at: string
          deadline_at: string | null
          deadline_text: string | null
          ea: string | null
          eb: string | null
          fail_p: number | null
          hot: boolean
          id: number
          participants: number
          price: number
          q: string
          result: Database["public"]["Enums"]["pred_choice"] | null
          stage: Database["public"]["Enums"]["pred_stage"]
          status: string | null
          success_p: number | null
          total_p: number | null
          updated_at: string
        }
        Insert: {
          a_label: string
          a_ratio?: number | null
          author_acc?: number | null
          author_expert_id?: number | null
          author_gk?: Database["public"]["Enums"]["grade_key"] | null
          author_name?: string | null
          author_score?: number | null
          author_user_id?: string | null
          b_label: string
          b_ratio?: number | null
          blind?: boolean
          cat: string
          created_at?: string
          deadline_at?: string | null
          deadline_text?: string | null
          ea?: string | null
          eb?: string | null
          fail_p?: number | null
          hot?: boolean
          id?: number
          participants?: number
          price?: number
          q: string
          result?: Database["public"]["Enums"]["pred_choice"] | null
          stage?: Database["public"]["Enums"]["pred_stage"]
          status?: string | null
          success_p?: number | null
          total_p?: number | null
          updated_at?: string
        }
        Update: {
          a_label?: string
          a_ratio?: number | null
          author_acc?: number | null
          author_expert_id?: number | null
          author_gk?: Database["public"]["Enums"]["grade_key"] | null
          author_name?: string | null
          author_score?: number | null
          author_user_id?: string | null
          b_label?: string
          b_ratio?: number | null
          blind?: boolean
          cat?: string
          created_at?: string
          deadline_at?: string | null
          deadline_text?: string | null
          ea?: string | null
          eb?: string | null
          fail_p?: number | null
          hot?: boolean
          id?: number
          participants?: number
          price?: number
          q?: string
          result?: Database["public"]["Enums"]["pred_choice"] | null
          stage?: Database["public"]["Enums"]["pred_stage"]
          status?: string | null
          success_p?: number | null
          total_p?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accuracy: number
          avatar_url: string | null
          badges: Json
          bio: string | null
          category: string | null
          created_at: string
          email: string | null
          grade: Database["public"]["Enums"]["grade_key"]
          handle: string
          id: string
          name: string | null
          points: number
          preds_count: number
          score: number
          subs_count: number
          updated_at: string
          wallet: string | null
        }
        Insert: {
          accuracy?: number
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          category?: string | null
          created_at?: string
          email?: string | null
          grade?: Database["public"]["Enums"]["grade_key"]
          handle: string
          id: string
          name?: string | null
          points?: number
          preds_count?: number
          score?: number
          subs_count?: number
          updated_at?: string
          wallet?: string | null
        }
        Update: {
          accuracy?: number
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          category?: string | null
          created_at?: string
          email?: string | null
          grade?: Database["public"]["Enums"]["grade_key"]
          handle?: string
          id?: string
          name?: string | null
          points?: number
          preds_count?: number
          score?: number
          subs_count?: number
          updated_at?: string
          wallet?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: number
          prediction_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: number
          prediction_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: number
          prediction_id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_predictions: {
        Row: {
          choice: Database["public"]["Enums"]["pred_choice"]
          id: number
          is_correct: boolean | null
          prediction_id: number
          sealed_at: string
          user_id: string
        }
        Insert: {
          choice: Database["public"]["Enums"]["pred_choice"]
          id?: number
          is_correct?: boolean | null
          prediction_id: number
          sealed_at?: string
          user_id: string
        }
        Update: {
          choice?: Database["public"]["Enums"]["pred_choice"]
          id?: number
          is_correct?: boolean | null
          prediction_id?: number
          sealed_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      charge_points: {
        Args: { p_amount: number; p_reason: string; p_ref_id?: number; p_ref_type?: string }
        Returns: number
      }
      start_conversation: { Args: { p_other_user: string }; Returns: number }
      unlock_content: {
        Args: { p_content_id: number; p_content_type: string; p_cost?: number; p_method: string }
        Returns: number
      }
    }
    Enums: {
      challenge_status: "pending" | "approved" | "rejected"
      event_status: "live" | "upcoming" | "ended"
      grade_key: "candidate" | "forecaster" | "proven" | "seer"
      notif_type:
        | "pred_revealed"
        | "expert_new_pred"
        | "dm_received"
        | "event_starting"
        | "system"
      pred_choice: "A" | "B"
      pred_stage: "active" | "verify" | "done"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// 헬퍼 타입 — 테이블 Row 별 단축 alias
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
