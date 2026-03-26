export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Satisfies @supabase/supabase-js GenericSchema (Tables need Relationships; public needs Views + Functions). */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; active_workspace_id: string | null; created_at: string };
        Insert: { id: string; email: string; active_workspace_id?: string | null; created_at?: string };
        Update: { email?: string; active_workspace_id?: string | null };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          currency: string;
          invite_code: string;
          owner_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          invite_code: string;
          owner_user_id: string;
          created_at?: string;
        };
        Update: { name?: string; currency?: string; invite_code?: string; owner_user_id?: string };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: { role?: Database["public"]["Enums"]["app_role"] };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          phone: string;
          location: string;
          service_type: string;
          status: Database["public"]["Enums"]["lead_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          phone: string;
          location: string;
          service_type: string;
          status?: Database["public"]["Enums"]["lead_status"];
          created_at?: string;
        };
        Update: {
          name?: string;
          phone?: string;
          location?: string;
          service_type?: string;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string | null;
          customer_name: string;
          phone: string;
          location: string;
          service_type: string;
          status: Database["public"]["Enums"]["job_status"];
          scheduled_date: string | null;
          technician_id: string | null;
          requires_deposit: boolean;
          total_amount: number;
          deposit_amount: number;
          pricing_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id?: string | null;
          customer_name: string;
          phone: string;
          location: string;
          service_type: string;
          status: Database["public"]["Enums"]["job_status"];
          scheduled_date?: string | null;
          technician_id?: string | null;
          requires_deposit?: boolean;
          total_amount?: number;
          deposit_amount?: number;
          pricing_notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: Database["public"]["Enums"]["job_status"];
          scheduled_date?: string | null;
          technician_id?: string | null;
          pricing_notes?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          workspace_id: string;
          job_id: string;
          total_amount: number;
          amount_due: number;
          type: Database["public"]["Enums"]["invoice_type"];
          status: Database["public"]["Enums"]["invoice_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          job_id: string;
          total_amount?: number;
          amount_due?: number;
          type: Database["public"]["Enums"]["invoice_type"];
          status?: Database["public"]["Enums"]["invoice_status"];
          created_at?: string;
        };
        Update: { status?: Database["public"]["Enums"]["invoice_status"]; amount_due?: number };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string;
          content: string;
          direction: Database["public"]["Enums"]["message_direction"];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id: string;
          content: string;
          direction: Database["public"]["Enums"]["message_direction"];
          created_at?: string;
        };
        Update: { content?: string };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "owner" | "admin" | "technician";
      invoice_status: "pending" | "paid";
      invoice_type: "deposit" | "final" | "full";
      job_status: "pending_deposit" | "scheduled" | "in_progress" | "completed";
      lead_status: "NEW" | "WON" | "LOST";
      message_direction: "incoming" | "outgoing";
    };
  };
};
