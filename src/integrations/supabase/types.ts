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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      // ── RelatorioFlow MVP tables ──────────────────────────────────────
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          address: string | null
          client_name: string | null
          art_rrt: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          address?: string | null
          client_name?: string | null
          art_rrt?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          address?: string | null
          client_name?: string | null
          art_rrt?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          id: string
          user_id: string
          project_id: string
          report_date: string
          responsavel: string
          condicao_tempo: string | null
          temperatura: string | null
          clima_json: Json
          equipe: Json
          atividades: Json
          equipamentos: Json
          ocorrencias: string | null
          fotos: Json
          status: string
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          report_date: string
          responsavel: string
          condicao_tempo?: string | null
          temperatura?: string | null
          clima_json?: Json
          equipe?: Json
          atividades?: Json
          equipamentos?: Json
          ocorrencias?: string | null
          fotos?: Json
          status?: string
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          responsavel?: string
          condicao_tempo?: string | null
          temperatura?: string | null
          clima_json?: Json
          equipe?: Json
          atividades?: Json
          equipamentos?: Json
          ocorrencias?: string | null
          fotos?: Json
          status?: string
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      technical_reports: {
        Row: {
          id: string
          user_id: string
          project_id: string
          numero_relatorio: string
          report_date: string
          responsavel_tecnico: string
          crea_cau: string | null
          objetivo: string | null
          metodologia: string | null
          diagnostico: Json
          conclusao: string | null
          recomendacoes: Json
          fotos_gerais: Json
          status: string
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          numero_relatorio: string
          report_date: string
          responsavel_tecnico: string
          crea_cau?: string | null
          objetivo?: string | null
          metodologia?: string | null
          diagnostico?: Json
          conclusao?: string | null
          recomendacoes?: Json
          fotos_gerais?: Json
          status?: string
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero_relatorio?: string
          report_date?: string
          responsavel_tecnico?: string
          crea_cau?: string | null
          objetivo?: string | null
          metodologia?: string | null
          diagnostico?: Json
          conclusao?: string | null
          recomendacoes?: Json
          fotos_gerais?: Json
          status?: string
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pagbank_events: {
        Row: {
          id: string
          user_id: string | null
          pagbank_order_id: string | null
          event_type: string
          status: string | null
          amount: number | null
          payload: Json
          processed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          pagbank_order_id?: string | null
          event_type: string
          status?: string | null
          amount?: number | null
          payload?: Json
          processed_at?: string
        }
        Update: {
          user_id?: string | null
          status?: string | null
          amount?: number | null
          payload?: Json
        }
        Relationships: []
      }
      // ── End RelatorioFlow MVP tables ──────────────────────────────────
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_preview: string
          last_used: string | null
          name: string
          org_id: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_preview: string
          last_used?: string | null
          name?: string
          org_id: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_preview?: string
          last_used?: string | null
          name?: string
          org_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          last_sync_at: string | null
          name: string
          org_id: string
          status: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          org_id: string
          status?: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          org_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          access_condition: string | null
          client_company: string | null
          client_contact: string | null
          client_name: string | null
          created_at: string
          folder_id: string | null
          id: string
          images: Json | null
          input_text: string
          logo_url: string | null
          materials: Json | null
          occurrences: string | null
          org_id: string
          report_content: string
          report_date: string | null
          report_location: string | null
          report_number: string | null
          report_type: string | null
          responsible_name: string | null
          responsible_role: string | null
          site_condition: string | null
          status: string | null
          team_members: Json | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          access_condition?: string | null
          client_company?: string | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          images?: Json | null
          input_text: string
          logo_url?: string | null
          materials?: Json | null
          occurrences?: string | null
          org_id: string
          report_content: string
          report_date?: string | null
          report_location?: string | null
          report_number?: string | null
          report_type?: string | null
          responsible_name?: string | null
          responsible_role?: string | null
          site_condition?: string | null
          status?: string | null
          team_members?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          access_condition?: string | null
          client_company?: string | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          images?: Json | null
          input_text?: string
          logo_url?: string | null
          materials?: Json | null
          occurrences?: string | null
          org_id?: string
          report_content?: string
          report_date?: string | null
          report_location?: string | null
          report_number?: string | null
          report_type?: string | null
          responsible_name?: string | null
          responsible_role?: string | null
          site_condition?: string | null
          status?: string | null
          team_members?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_folder"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "report_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          org_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          org_id: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          org_id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_config: Json | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan: string
          plan_status: string
          primary_color: string | null
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          plan_status?: string
          primary_color?: string | null
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          brand_config?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          plan_status?: string
          primary_color?: string | null
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          org_id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          org_id: string
          payload: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          org_id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_system_admin: boolean
          onboarding_completed: boolean
          org_id: string | null
          professional_role: string | null
          role: string
          // RelatorioFlow MVP fields
          company_name: string | null
          crea_cau: string | null
          logo_url: string | null
          phone: string | null
          has_access: boolean
          pagbank_order_id: string | null
          access_granted_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_system_admin?: boolean
          onboarding_completed?: boolean
          org_id?: string | null
          professional_role?: string | null
          role?: string
          company_name?: string | null
          crea_cau?: string | null
          logo_url?: string | null
          phone?: string | null
          has_access?: boolean
          pagbank_order_id?: string | null
          access_granted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_system_admin?: boolean
          onboarding_completed?: boolean
          org_id?: string | null
          professional_role?: string | null
          role?: string
          company_name?: string | null
          crea_cau?: string | null
          logo_url?: string | null
          phone?: string | null
          has_access?: boolean
          pagbank_order_id?: string | null
          access_granted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          executed_by: string | null
          file_format: string | null
          file_url: string | null
          id: string
          org_id: string
          recipients_sent: Json | null
          schedule_id: string | null
          status: string
          template_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          org_id: string
          recipients_sent?: Json | null
          schedule_id?: string | null
          status?: string
          template_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          org_id?: string
          recipients_sent?: Json | null
          schedule_id?: string | null
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          blocks: Json | null
          brand_config: Json | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          org_id: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          blocks?: Json | null
          brand_config?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          org_id: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          blocks?: Json | null
          brand_config?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          org_id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string | null
          cron_expression: string | null
          frequency: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          org_id: string
          recipients: Json | null
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          org_id: string
          recipients?: Json | null
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          org_id?: string
          recipients?: Json | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          canceled_at: string | null
          card_brand: string | null
          card_last_digits: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          org_id: string
          pagbank_card_token: string | null
          pagbank_charge_id: string | null
          pagbank_order_id: string | null
          plan: string
          status: string
        }
        Insert: {
          amount: number
          billing_cycle?: string
          canceled_at?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id: string
          pagbank_card_token?: string | null
          pagbank_charge_id?: string | null
          pagbank_order_id?: string | null
          plan: string
          status?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          canceled_at?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id?: string
          pagbank_card_token?: string | null
          pagbank_charge_id?: string | null
          pagbank_order_id?: string | null
          plan?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          archived: boolean | null
          category: string
          created_at: string | null
          id: string
          org_id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          org_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          org_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_tickets: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      cleanup_old_reports: { Args: never; Returns: undefined }
      get_user_org_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
