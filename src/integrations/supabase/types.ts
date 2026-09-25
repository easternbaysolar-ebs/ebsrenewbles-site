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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          account_manager: string | null
          address: string | null
          city: string | null
          created_at: string
          customer_type: string
          email: string | null
          id: string
          lead_id: string | null
          mobile: string | null
          name: string
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          mobile?: string | null
          name: string
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          mobile?: string | null
          name?: string
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
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
          assigned_to: string | null
          created_at: string
          customer_type: string
          desired_kw: number | null
          email: string | null
          id: string
          location: string | null
          mobile: string
          monthly_bill: number | null
          monthly_units: number | null
          name: string
          next_follow_up: string | null
          notes: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_type?: string
          desired_kw?: number | null
          email?: string | null
          id?: string
          location?: string | null
          mobile: string
          monthly_bill?: number | null
          monthly_units?: number | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_type?: string
          desired_kw?: number | null
          email?: string | null
          id?: string
          location?: string | null
          mobile?: string
          monthly_bill?: number | null
          monthly_units?: number | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_prices: {
        Row: {
          category: string
          created_at: string
          effective_from: string
          gst_percent: number
          id: string
          is_active: boolean
          item_name: string
          notes: string | null
          price: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          effective_from?: string
          gst_percent?: number
          id?: string
          is_active?: boolean
          item_name: string
          notes?: string | null
          price?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          effective_from?: string
          gst_percent?: number
          id?: string
          is_active?: boolean
          item_name?: string
          notes?: string | null
          price?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          indicative_price: number | null
          is_active: boolean
          name: string
          sort_order: number
          specs: Json
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicative_price?: number | null
          is_active?: boolean
          name: string
          sort_order?: number
          specs?: Json
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicative_price?: number | null
          is_active?: boolean
          name?: string
          sort_order?: number
          specs?: Json
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          designation: string | null
          email: string | null
          employee_code: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_placeholder: boolean
          project_id: string
          sort_order: number
          url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_placeholder?: boolean
          project_id: string
          sort_order?: number
          url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_placeholder?: boolean
          project_id?: string
          sort_order?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          capacity_kw: number | null
          category: string
          commissioned_on: string | null
          cover_image_url: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          is_placeholder: boolean
          is_published: boolean
          location: string | null
          site_engineer: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity_kw?: number | null
          category?: string
          commissioned_on?: string | null
          cover_image_url?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          is_placeholder?: boolean
          is_published?: boolean
          location?: string | null
          site_engineer?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity_kw?: number | null
          category?: string
          commissioned_on?: string | null
          cover_image_url?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          is_placeholder?: boolean
          is_published?: boolean
          location?: string | null
          site_engineer?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          bank_details: string | null
          capacity_kw: number | null
          company_address: string | null
          company_gst_number: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          gst_amount: number
          id: string
          lead_id: string | null
          line_items: Json
          notes: string | null
          quote_number: string
          status: string
          subsidy_amount: number
          subtotal: number
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          bank_details?: string | null
          capacity_kw?: number | null
          company_address?: string | null
          company_gst_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          gst_amount?: number
          id?: string
          lead_id?: string | null
          line_items?: Json
          notes?: string | null
          quote_number: string
          status?: string
          subsidy_amount?: number
          subtotal?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          bank_details?: string | null
          capacity_kw?: number | null
          company_address?: string | null
          company_gst_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          gst_amount?: number
          id?: string
          lead_id?: string | null
          line_items?: Json
          notes?: string | null
          quote_number?: string
          status?: string
          subsidy_amount?: number
          subtotal?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          applies_to: string[]
          authority: string | null
          benefits: string[]
          created_at: string
          details: string | null
          eligibility: string[]
          id: string
          is_published: boolean
          name: string
          official_url: string | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          applies_to?: string[]
          authority?: string | null
          benefits?: string[]
          created_at?: string
          details?: string | null
          eligibility?: string[]
          id?: string
          is_published?: boolean
          name: string
          official_url?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          applies_to?: string[]
          authority?: string | null
          benefits?: string[]
          created_at?: string
          details?: string | null
          eligibility?: string[]
          id?: string
          is_published?: boolean
          name?: string
          official_url?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string | null
          section: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label?: string | null
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string | null
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          project_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "sales_manager"
        | "sales_employee"
        | "site_engineer"
        | "installation_team"
        | "accountant"
        | "view_only"
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
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "sales_manager",
        "sales_employee",
        "site_engineer",
        "installation_team",
        "accountant",
        "view_only",
      ],
    },
  },
} as const

