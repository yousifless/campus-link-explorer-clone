export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campuses: {
        Row: {
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      club_meetup_rsvps: {
        Row: {
          meetup_id: string
          responded_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          meetup_id: string
          responded_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          meetup_id?: string
          responded_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_meetup_rsvps_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "club_meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_meetup_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_meetups: {
        Row: {
          club_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          time: string | null
          title: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          time?: string | null
          title: string
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_meetups_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_meetups_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_meetups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages: {
        Row: {
          club_id: string | null
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          course_code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          join_code: string | null
          name: string
          tags: string[] | null
          visibility: string | null
        }
        Insert: {
          course_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          join_code?: string | null
          name: string
          tags?: string[] | null
          visibility?: string | null
        }
        Update: {
          course_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          join_code?: string | null
          name?: string
          tags?: string[] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_meetups: {
        Row: {
          additional_notes: string | null
          conversation_starter: string | null
          created_at: string
          date: string
          id: string
          location_address: string
          location_lat: number | null
          location_lng: number | null
          location_name: string
          match_id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          conversation_starter?: string | null
          created_at?: string
          date: string
          id?: string
          location_address: string
          location_lat?: number | null
          location_lng?: number | null
          location_name: string
          match_id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          conversation_starter?: string | null
          created_at?: string
          date?: string
          id?: string
          location_address?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string
          match_id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coffee_meetups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_meetups_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_meetups_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          match_id: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          Date: string | null
          ENG_description: string | null
          ENG_title: string | null
          fee: string | null
          id: number
          JPN_description: string | null
          JPN_タイトル: string | null
          link: string | null
          tag: string | null
          Time: string | null
        }
        Insert: {
          created_at?: string
          Date?: string | null
          ENG_description?: string | null
          ENG_title?: string | null
          fee?: string | null
          id?: number
          JPN_description?: string | null
          JPN_タイトル?: string | null
          link?: string | null
          tag?: string | null
          Time?: string | null
        }
        Update: {
          created_at?: string
          Date?: string | null
          ENG_description?: string | null
          ENG_title?: string | null
          fee?: string | null
          id?: number
          JPN_description?: string | null
          JPN_タイトル?: string | null
          link?: string | null
          tag?: string | null
          Time?: string | null
        }
        Relationships: []
      }
      interests: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      majors: {
        Row: {
          created_at: string
          field_of_study: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          field_of_study: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          field_of_study?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user1_id: string
          user1_status: string
          user2_id: string
          user2_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user1_id: string
          user1_status?: string
          user2_id: string
          user2_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user1_id?: string
          user1_status?: string
          user2_id?: string
          user2_status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_signed_url: string | null
          avatar_url: string | null
          bio: string | null
          campus_id: string | null
          created_at: string
          cultural_insight: string | null
          first_name: string | null
          id: string
          interests: string[] | null
          is_verified: boolean | null
          languages: string[] | null
          last_name: string | null
          location: string | null
          major_id: string | null
          nationality: string | null
          nickname: string | null
          student_type: string | null
          university_id: string | null
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          avatar_signed_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          campus_id?: string | null
          created_at?: string
          cultural_insight?: string | null
          first_name?: string | null
          id: string
          interests?: string[] | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          location?: string | null
          major_id?: string | null
          nationality?: string | null
          nickname?: string | null
          student_type?: string | null
          university_id?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          avatar_signed_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          campus_id?: string | null
          created_at?: string
          cultural_insight?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          location?: string | null
          major_id?: string | null
          nationality?: string | null
          nickname?: string | null
          student_type?: string | null
          university_id?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          campus: string | null
          country: string
          created_at: string
          id: string
          location: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          campus?: string | null
          country: string
          created_at?: string
          id?: string
          location: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          campus?: string | null
          country?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_availability: {
        Row: {
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_languages: {
        Row: {
          created_at: string
          id: string
          language_id: string
          proficiency: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_id: string
          proficiency: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language_id?: string
          proficiency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_match_preferences: {
        Row: {
          availability: number
          created_at: string
          goals: number
          id: string
          interests: number
          languages: number
          location: number
          network: number
          personality: number
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: number
          created_at?: string
          goals?: number
          id?: string
          interests?: number
          languages?: number
          location?: number
          network?: number
          personality?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: number
          created_at?: string
          goals?: number
          id?: string
          interests?: number
          languages?: number
          location?: number
          network?: number
          personality?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_match_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      club_details: {
        Row: {
          course_code: string | null
          created_at: string | null
          created_by: string | null
          creator_avatar_url: string | null
          creator_first_name: string | null
          creator_last_name: string | null
          description: string | null
          id: string | null
          join_code: string | null
          member_count: number | null
          name: string | null
          tags: string[] | null
          upcoming_meetups_count: number | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_clubs: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          name: string
          description: string
          tags: string[]
          course_code: string
          visibility: string
          join_code: string
          created_by: string
          created_at: string
          creator_first_name: string
          creator_last_name: string
          creator_avatar_url: string
          member_count: number
          upcoming_meetups_count: number
          user_role: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
