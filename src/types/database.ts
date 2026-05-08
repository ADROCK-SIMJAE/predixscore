// Supabase MCP generate_typescript_types 결과
// 스키마 변경 후에는 MCP `generate_typescript_types` 로 재생성하여 갱신
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
      market_resolutions: {
        Row: {
          event_slug: string
          market_slug: string
          resolved_at: string
          source: string
          winning_outcome_index: number
        }
        Insert: {
          event_slug: string
          market_slug: string
          resolved_at?: string
          source?: string
          winning_outcome_index: number
        }
        Update: {
          event_slug?: string
          market_slug?: string
          resolved_at?: string
          source?: string
          winning_outcome_index?: number
        }
        Relationships: []
      }
      paper_positions: {
        Row: {
          created_at: string
          entry_price: number
          event_slug: string
          event_title: string
          guest_session_id: string
          id: string
          market_question: string
          market_slug: string
          outcome_index: number
          outcome_label: string
          realized_pnl: number | null
          resolved_outcome_index: number | null
          settled_at: string | null
          shares: number
          stake_amount: number
          status: string
          status_resolved: string
          token_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entry_price: number
          event_slug: string
          event_title: string
          guest_session_id: string
          id?: string
          market_question: string
          market_slug: string
          outcome_index: number
          outcome_label: string
          realized_pnl?: number | null
          resolved_outcome_index?: number | null
          settled_at?: string | null
          shares: number
          stake_amount: number
          status?: string
          status_resolved?: string
          token_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entry_price?: number
          event_slug?: string
          event_title?: string
          guest_session_id?: string
          id?: string
          market_question?: string
          market_slug?: string
          outcome_index?: number
          outcome_label?: string
          realized_pnl?: number | null
          resolved_outcome_index?: number | null
          settled_at?: string | null
          shares?: number
          stake_amount?: number
          status?: string
          status_resolved?: string
          token_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_paper_position: {
        Args: {
          p_entry_price: number
          p_event_slug: string
          p_event_title: string
          p_guest_session_id: string
          p_market_question: string
          p_market_slug: string
          p_outcome_index: number
          p_outcome_label: string
          p_shares: number
          p_stake_amount: number
          p_token_id: string
          p_user_id: string | null
        }
        Returns: Database["public"]["Tables"]["paper_positions"]["Row"]
      }
      get_profile_by_name: {
        Args: { p_name: string }
        Returns: {
          avatar_url: string
          display_name: string
          lost_count: number
          realized_pnl: number
          total_predictions: number
          user_id: string
          win_rate: number
          won_count: number
        }[]
      }
      get_user_stats: {
        Args: { p_guest_session_id?: string | null; p_user_id?: string | null }
        Returns: {
          available_balance: number
          lost_count: number
          pending_count: number
          pending_staked: number
          realized_pnl: number
          starting_balance: number
          total_predictions: number
          total_staked: number
          win_rate: number
          won_count: number
        }[]
      }
      list_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          display_name: string
          lost_count: number
          realized_pnl: number
          total_predictions: number
          user_id: string
          win_rate: number
          won_count: number
        }[]
      }
      list_paper_positions: {
        Args: {
          p_guest_session_id: string
          p_status_filter?: string | null
          p_user_id?: string | null
        }
        Returns: Database["public"]["Tables"]["paper_positions"]["Row"][]
      }
      set_display_name: {
        Args: { p_name: string }
        Returns: Database["public"]["Tables"]["user_profiles"]["Row"]
      }
      settle_market: {
        Args: {
          p_event_slug: string
          p_market_slug: string
          p_winning_outcome_index: number
        }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
