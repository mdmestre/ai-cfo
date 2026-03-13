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
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          company_id: string
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_type: string
          balance: number | null
          bank_name: string
          company_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          account_type: string
          balance?: number | null
          bank_name: string
          company_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          balance?: number | null
          bank_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          company_id: string
          created_at: string | null
          description: string
          id: string
          is_read: boolean | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description: string
          id?: string
          is_read?: boolean | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string
          id?: string
          is_read?: boolean | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_data: Json
          action_type: string
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_condition: Json
          trigger_type: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_condition?: Json
          trigger_type: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_condition?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string | null
          id: string
          institution_name: string
          last_synced_at: string | null
          metadata: Json | null
          provider: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          institution_name: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          institution_name?: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          card_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          merchant: string | null
          status: string | null
          transaction_date: string | null
        }
        Insert: {
          amount: number
          card_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          status?: string | null
          transaction_date?: string | null
        }
        Update: {
          amount?: number
          card_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          status?: string | null
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_type: string
          company_id: string
          created_at: string | null
          holder_id: string | null
          holder_name: string
          id: string
          institution: string | null
          last_four: string | null
          spending_limit: number | null
          spent_current_month: number | null
          status: string | null
        }
        Insert: {
          card_type?: string
          company_id: string
          created_at?: string | null
          holder_id?: string | null
          holder_name: string
          id?: string
          institution?: string | null
          last_four?: string | null
          spending_limit?: number | null
          spent_current_month?: number | null
          status?: string | null
        }
        Update: {
          card_type?: string
          company_id?: string
          created_at?: string | null
          holder_id?: string | null
          holder_name?: string
          id?: string
          institution?: string | null
          last_four?: string | null
          spending_limit?: number | null
          spent_current_month?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecasts: {
        Row: {
          company_id: string
          confidence: number | null
          created_at: string | null
          forecast_date: string
          id: string
          net_balance: number | null
          notes: string | null
          projected_inflow: number | null
          projected_outflow: number | null
        }
        Insert: {
          company_id: string
          confidence?: number | null
          created_at?: string | null
          forecast_date: string
          id?: string
          net_balance?: number | null
          notes?: string | null
          projected_inflow?: number | null
          projected_outflow?: number | null
        }
        Update: {
          company_id?: string
          confidence?: number | null
          created_at?: string | null
          forecast_date?: string
          id?: string
          net_balance?: number | null
          notes?: string | null
          projected_inflow?: number | null
          projected_outflow?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          company_id: string
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          account_type: string
          code: string
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          account_type?: string
          code?: string
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          company_id: string
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          budget_limit: number | null
          code: string | null
          company_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          budget_limit?: number | null
          code?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          budget_limit?: number | null
          code?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          company_id: string
          created_at: string | null
          description: string | null
          expense_date: string | null
          id: string
          merchant: string | null
          receipt_url: string | null
          status: string | null
          submitted_by: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          merchant?: string | null
          receipt_url?: string | null
          status?: string | null
          submitted_by?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          merchant?: string | null
          receipt_url?: string | null
          status?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          direction: string
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          invoice_type: string | null
          items: Json | null
          municipality: string | null
          notes: string | null
          series: string | null
          status: string | null
          tax_regime: string | null
          total_amount: number
          vendor_id: string | null
          xml_url: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          direction: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          invoice_type?: string | null
          items?: Json | null
          municipality?: string | null
          notes?: string | null
          series?: string | null
          status?: string | null
          tax_regime?: string | null
          total_amount: number
          vendor_id?: string | null
          xml_url?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          direction?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          invoice_type?: string | null
          items?: Json | null
          municipality?: string | null
          notes?: string | null
          series?: string | null
          status?: string | null
          tax_regime?: string | null
          total_amount?: number
          vendor_id?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          accounting_period_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          id: string
          is_auto_suggested: boolean | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          accounting_period_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          is_auto_suggested?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          accounting_period_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          is_auto_suggested?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_accounting_period_id_fkey"
            columns: ["accounting_period_id"]
            isOneToOne: false
            referencedRelation: "accounting_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit: number | null
          debit: number | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_type: string
          code: string
          company_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          account_type: string
          code: string
          company_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          account_type?: string
          code?: string
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string | null
          id: string
          reference: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          reference?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entry_lines: {
        Row: {
          created_at: string | null
          credit: number | null
          debit: number | null
          id: string
          ledger_account_id: string
          ledger_entry_id: string
        }
        Insert: {
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          ledger_account_id: string
          ledger_entry_id: string
        }
        Update: {
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          ledger_account_id?: string
          ledger_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entry_lines_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entry_lines_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          invited_email: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          status: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          customer_id: string | null
          description: string
          due_date: string | null
          id: string
          received_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          received_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          received_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receivables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_events: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          severity: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          severity?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_scores: {
        Row: {
          calculated_at: string | null
          company_id: string
          factors: Json | null
          id: string
          recommendations: string[] | null
          score: number
        }
        Insert: {
          calculated_at?: string | null
          company_id: string
          factors?: Json | null
          id?: string
          recommendations?: string[] | null
          score: number
        }
        Update: {
          calculated_at?: string | null
          company_id?: string
          factors?: Json | null
          id?: string
          recommendations?: string[] | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_insights: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          current_spend: number | null
          description: string | null
          id: string
          potential_savings: number | null
          status: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          current_spend?: number | null
          description?: string | null
          id?: string
          potential_savings?: number | null
          status?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          current_spend?: number | null
          description?: string | null
          id?: string
          potential_savings?: number | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_apurations: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          company_id: string
          created_at: string | null
          due_date: string | null
          id: string
          period: string
          status: string | null
          tax_type: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          company_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          period: string
          status?: string | null
          tax_type: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          company_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          period?: string
          status?: string | null
          tax_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_apurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          tax_base: number | null
          tax_rate: number | null
          tax_type: string
          tax_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          tax_base?: number | null
          tax_rate?: number | null
          tax_type: string
          tax_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          tax_base?: number | null
          tax_rate?: number | null
          tax_type?: string
          tax_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          status: string | null
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_positions: {
        Row: {
          allocated_amount: number | null
          annual_yield_rate: number | null
          balance: number | null
          company_id: string
          created_at: string | null
          id: string
          institution: string
          maturity_date: string | null
          name: string
          position_type: string
        }
        Insert: {
          allocated_amount?: number | null
          annual_yield_rate?: number | null
          balance?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          institution: string
          maturity_date?: string | null
          name: string
          position_type: string
        }
        Update: {
          allocated_amount?: number | null
          annual_yield_rate?: number | null
          balance?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          institution?: string
          maturity_date?: string | null
          name?: string
          position_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasury_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          company_id: string
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          company_id: string
          created_at: string | null
          id: string
          name: string
          wallet_type: string
        }
        Insert: {
          balance?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          wallet_type: string
        }
        Update: {
          balance?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_events: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          notes: string | null
          treasury_position_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          notes?: string | null
          treasury_position_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          treasury_position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yield_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yield_events_treasury_position_id_fkey"
            columns: ["treasury_position_id"]
            isOneToOne: false
            referencedRelation: "treasury_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_products: {
        Row: {
          annual_rate: number | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          institution: string
          liquidity_days: number | null
          min_investment: number | null
          name: string
          product_type: string
          risk_level: string | null
        }
        Insert: {
          annual_rate?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          institution: string
          liquidity_days?: number | null
          min_investment?: number | null
          name: string
          product_type: string
          risk_level?: string | null
        }
        Update: {
          annual_rate?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          institution?: string
          liquidity_days?: number | null
          min_investment?: number | null
          name?: string
          product_type?: string
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yield_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
