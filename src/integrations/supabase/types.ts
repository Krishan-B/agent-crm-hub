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
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_path: string | null
          id: string
          lead_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path?: string | null
          id?: string
          lead_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string | null
          id?: string
          lead_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_agent_id: string | null
          balance: number
          bonus_amount: number
          country: string
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          kyc_status: string | null
          last_contact: string | null
          last_name: string
          phone: string | null
          registration_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          balance?: number
          bonus_amount?: number
          country: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          id?: string
          kyc_status?: string | null
          last_contact?: string | null
          last_name: string
          phone?: string | null
          registration_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          balance?: number
          bonus_amount?: number
          country?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          kyc_status?: string | null
          last_contact?: string | null
          last_name?: string
          phone?: string | null
          registration_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          location: string | null
          login_time: string | null
          logout_time: string | null
          session_duration: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          location?: string | null
          login_time?: string | null
          logout_time?: string | null
          session_duration?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          location?: string | null
          login_time?: string | null
          logout_time?: string | null
          session_duration?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          role: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          lead_id: string
          reference: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lead_id: string
          reference: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lead_id?: string
          reference?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
