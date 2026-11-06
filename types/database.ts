export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      book_indexes: {
        Row: {
          color: string | null
          created_at: string
          id: string
          page: number
          quote: string | null
          session_id: string | null
          tags: string[]
          title: string
          user_book_id: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          page: number
          quote?: string | null
          session_id?: string | null
          tags?: string[]
          title: string
          user_book_id: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          page?: number
          quote?: string | null
          session_id?: string | null
          tags?: string[]
          title?: string
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_indexes_session_id_user_id_fkey"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "book_indexes_user_book_id_user_id_fkey"
            columns: ["user_book_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          id: string
          isbn: string | null
          publisher: string
          title: string
          total_pages: number | null
        }
        Insert: {
          author?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          publisher?: string
          title: string
          total_pages?: number | null
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          publisher?: string
          title?: string
          total_pages?: number | null
        }
        Relationships: []
      }
      dust_wipe_logs: {
        Row: {
          dust_level: number
          id: string
          user_book_id: string
          user_id: string
          wiped_at: string
        }
        Insert: {
          dust_level: number
          id?: string
          user_book_id: string
          user_id?: string
          wiped_at?: string
        }
        Update: {
          dust_level?: number
          id?: string
          user_book_id?: string
          user_id?: string
          wiped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dust_wipe_logs_user_book_id_user_id_fkey"
            columns: ["user_book_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          goal_id: string
          id: string
          kind: string
          read_after: boolean | null
          sent_at: string
          user_id: string
        }
        Insert: {
          goal_id: string
          id?: string
          kind: string
          read_after?: boolean | null
          sent_at?: string
          user_id?: string
        }
        Update: {
          goal_id?: string
          id?: string
          kind?: string
          read_after?: boolean | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_goal_id_user_id_fkey"
            columns: ["goal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reading_goals"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_suspended: boolean
          nickname: string
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_suspended?: boolean
          nickname?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          nickname?: string
          role?: string
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string
          days_of_week: number[]
          ends_on: string | null
          id: string
          notifications_enabled: boolean
          reminder_time: string | null
          starts_on: string
          target_value: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week: number[]
          ends_on?: string | null
          id?: string
          notifications_enabled?: boolean
          reminder_time?: string | null
          starts_on: string
          target_value: number
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          ends_on?: string | null
          id?: string
          notifications_enabled?: boolean
          reminder_time?: string | null
          starts_on?: string
          target_value?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          end_page: number
          ended_at: string
          focus_exit_count: number
          id: string
          one_line_review: string | null
          pages_read: number | null
          read_on: string
          start_page: number
          started_at: string
          user_book_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          end_page: number
          ended_at: string
          focus_exit_count?: number
          id?: string
          one_line_review?: string | null
          pages_read?: number | null
          read_on: string
          start_page: number
          started_at: string
          user_book_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          end_page?: number
          ended_at?: string
          focus_exit_count?: number
          id?: string
          one_line_review?: string | null
          pages_read?: number | null
          read_on?: string
          start_page?: number
          started_at?: string
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_user_book_id_user_id_fkey"
            columns: ["user_book_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          rating: number
          user_book_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          rating: number
          user_book_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          rating?: number
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_book_id_user_id_fkey"
            columns: ["user_book_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_books: {
        Row: {
          book_id: string
          completed_on: string | null
          created_at: string
          current_page: number
          id: string
          last_read_on: string | null
          started_on: string | null
          status: string
          total_pages: number
          user_id: string
        }
        Insert: {
          book_id: string
          completed_on?: string | null
          created_at?: string
          current_page?: number
          id?: string
          last_read_on?: string | null
          started_on?: string | null
          status?: string
          total_pages: number
          user_id?: string
        }
        Update: {
          book_id?: string
          completed_on?: string | null
          created_at?: string
          current_page?: number
          id?: string
          last_read_on?: string | null
          started_on?: string | null
          status?: string
          total_pages?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_book: {
        Args: {
          p_completed_on: string
          p_content: string
          p_rating: number
          p_user_book_id: string
        }
        Returns: undefined
      }
      finish_session: {
        Args: {
          p_end_page: number
          p_ended_at: string
          p_focus_exit_count: number
          p_one_line_review: string
          p_read_on: string
          p_start_page: number
          p_started_at: string
          p_user_book_id: string
        }
        Returns: string
      }
      register_book: {
        Args: {
          p_author: string
          p_cover_url: string
          p_isbn: string
          p_publisher: string
          p_title: string
          p_total_pages: number
        }
        Returns: {
          book_id: string
          completed_on: string | null
          created_at: string
          current_page: number
          id: string
          last_read_on: string | null
          started_on: string | null
          status: string
          total_pages: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_books"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_goal: {
        Args: {
          p_days_of_week: number[]
          p_reminder_time: string
          p_target_value: number
          p_today: string
          p_type: string
        }
        Returns: {
          created_at: string
          days_of_week: number[]
          ends_on: string | null
          id: string
          notifications_enabled: boolean
          reminder_time: string | null
          starts_on: string
          target_value: number
          type: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reading_goals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
