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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          balance: number
          bank_name: string
          company_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          account_type: string
          balance?: number
          bank_name: string
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance?: number
          bank_name?: string
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
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
      audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action_result: Json | null
          company_id: string
          error_message: string | null
          executed_at: string
          id: string
          rule_id: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          action_result?: Json | null
          company_id: string
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          action_result?: Json | null
          company_id?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json
          trigger_count: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_snapshots: {
        Row: {
          balance: number
          company_id: string
          created_at: string
          id: string
          ledger_account_id: string
          snapshot_date: string
        }
        Insert: {
          balance: number
          company_id: string
          created_at?: string
          id?: string
          ledger_account_id: string
          snapshot_date: string
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string
          id?: string
          ledger_account_id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_snapshots_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          card_id: string
          category: string
          company_id: string
          created_at: string
          description: string
          id: string
          merchant: string
          status: string
          transaction_date: string
        }
        Insert: {
          amount: number
          card_id: string
          category?: string
          company_id: string
          created_at?: string
          description?: string
          id?: string
          merchant: string
          status?: string
          transaction_date?: string
        }
        Update: {
          amount?: number
          card_id?: string
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          merchant?: string
          status?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_type: string
          company_id: string
          created_at: string
          expires_at: string | null
          holder_name: string
          holder_user_id: string
          id: string
          last_four: string
          spending_limit: number
          spent_current_month: number
          status: string
          updated_at: string
        }
        Insert: {
          card_type?: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          holder_name: string
          holder_user_id: string
          id?: string
          last_four?: string
          spending_limit?: number
          spent_current_month?: number
          status?: string
          updated_at?: string
        }
        Update: {
          card_type?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          holder_name?: string
          holder_user_id?: string
          id?: string
          last_four?: string
          spending_limit?: number
          spent_current_month?: number
          status?: string
          updated_at?: string
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
      cashflow_forecasts: {
        Row: {
          company_id: string
          created_at: string
          forecast_date: string
          id: string
          predicted_balance: number
        }
        Insert: {
          company_id: string
          created_at?: string
          forecast_date: string
          id?: string
          predicted_balance: number
        }
        Update: {
          company_id?: string
          created_at?: string
          forecast_date?: string
          id?: string
          predicted_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: Json | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          budget_limit?: number | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          budget_limit?: number | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claim_items: {
        Row: {
          claim_id: string
          created_at: string
          expense_id: string
          id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          expense_id: string
          id?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claim_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claim_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          submitted_by: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          submitted_by: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          submitted_by?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_company_id_fkey"
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
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          company_id: string
          created_at: string
          currency: string
          description: string
          expense_date: string
          id: string
          merchant: string | null
          notes: string | null
          receipt_url: string | null
          status: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          receipt_url?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          receipt_url?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
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
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          customer_id: string | null
          direction: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          paid_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          customer_id?: string | null
          direction?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string | null
          direction?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
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
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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
          company_id: string
          created_at: string
          created_by: string
          description: string
          entry_date: string
          id: string
          reference: string | null
          reversed_by: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string
          entry_date?: string
          id?: string
          reference?: string | null
          reversed_by?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          id?: string
          reference?: string | null
          reversed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_fkey"
            columns: ["reversed_by"]
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
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          account_type: string
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          account_type?: string
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          created_at: string
          credit: number
          debit: number
          description: string
          id: string
          journal_entry_id: string
          ledger_account_id: string
        }
        Insert: {
          created_at?: string
          credit?: number
          debit?: number
          description?: string
          id?: string
          journal_entry_id: string
          ledger_account_id: string
        }
        Update: {
          created_at?: string
          credit?: number
          debit?: number
          description?: string
          id?: string
          journal_entry_id?: string
          ledger_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount_due: number
          amount_paid: number
          company_id: string
          created_at: string
          due_date: string
          id: string
          invoice_id: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_id: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string
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
            foreignKeyName: "payables_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      pix_keys: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          key_type: string
          key_value: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_type: string
          key_value: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_type?: string
          key_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_qr_codes: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string
          expires_at: string
          id: string
          is_used: boolean
          pix_transaction_id: string | null
          qr_code_data: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description?: string
          expires_at: string
          id?: string
          is_used?: boolean
          pix_transaction_id?: string | null
          qr_code_data: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          pix_transaction_id?: string | null
          qr_code_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_qr_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_qr_codes_pix_transaction_id_fkey"
            columns: ["pix_transaction_id"]
            isOneToOne: false
            referencedRelation: "pix_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_transactions: {
        Row: {
          amount: number
          company_id: string
          completed_at: string | null
          counterpart_document: string | null
          counterpart_name: string | null
          created_at: string
          description: string
          direction: string
          end_to_end_id: string | null
          id: string
          journal_entry_id: string | null
          pix_key_id: string | null
          status: string
        }
        Insert: {
          amount: number
          company_id: string
          completed_at?: string | null
          counterpart_document?: string | null
          counterpart_name?: string | null
          created_at?: string
          description?: string
          direction: string
          end_to_end_id?: string | null
          id?: string
          journal_entry_id?: string | null
          pix_key_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          company_id?: string
          completed_at?: string | null
          counterpart_document?: string | null
          counterpart_name?: string | null
          created_at?: string
          description?: string
          direction?: string
          end_to_end_id?: string | null
          id?: string
          journal_entry_id?: string | null
          pix_key_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_pix_key_id_fkey"
            columns: ["pix_key_id"]
            isOneToOne: false
            referencedRelation: "pix_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount_due: number
          amount_paid: number
          company_id: string
          created_at: string
          customer_id: string
          due_date: string
          id: string
          invoice_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          company_id: string
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          invoice_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          company_id?: string
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          invoice_id?: string
          status?: string
          updated_at?: string
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
          {
            foreignKeyName: "receivables_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_events: {
        Row: {
          company_id: string
          created_at: string
          description: string
          event_type: string
          id: string
          is_resolved: boolean
          metadata: Json | null
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          is_resolved?: boolean
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          is_resolved?: boolean
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
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
          calculated_at: string
          company_id: string
          created_at: string
          factors: Json
          id: string
          risk_level: string
          score: number
        }
        Insert: {
          calculated_at?: string
          company_id: string
          created_at?: string
          factors?: Json
          id?: string
          risk_level?: string
          score?: number
        }
        Update: {
          calculated_at?: string
          company_id?: string
          created_at?: string
          factors?: Json
          id?: string
          risk_level?: string
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
          affected_expenses: Json | null
          category: string
          company_id: string
          confidence: number
          created_at: string
          current_spend: number
          description: string
          id: string
          insight_type: string
          potential_savings: number
          recommendation: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
        }
        Insert: {
          affected_expenses?: Json | null
          category?: string
          company_id: string
          confidence?: number
          created_at?: string
          current_spend?: number
          description?: string
          id?: string
          insight_type?: string
          potential_savings?: number
          recommendation?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
        }
        Update: {
          affected_expenses?: Json | null
          category?: string
          company_id?: string
          confidence?: number
          created_at?: string
          current_spend?: number
          description?: string
          id?: string
          insight_type?: string
          potential_savings?: number
          recommendation?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
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
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
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
          allocated_amount: number
          annual_yield_rate: number
          balance: number
          company_id: string
          created_at: string
          currency: string
          id: string
          institution: string
          is_active: boolean
          maturity_date: string | null
          name: string
          notes: string | null
          position_type: string
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          annual_yield_rate?: number
          balance?: number
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          institution?: string
          is_active?: boolean
          maturity_date?: string | null
          name: string
          notes?: string | null
          position_type?: string
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          annual_yield_rate?: number
          balance?: number
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          institution?: string
          is_active?: boolean
          maturity_date?: string | null
          name?: string
          notes?: string | null
          position_type?: string
          updated_at?: string
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
          address: Json | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
          balance: number
          company_id: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          wallet_type: string
        }
        Insert: {
          balance?: number
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          wallet_type: string
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
          created_at: string
          description: string
          event_date: string
          event_type: string
          id: string
          position_id: string
          product_id: string | null
          yield_amount: number
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          description?: string
          event_date?: string
          event_type?: string
          id?: string
          position_id: string
          product_id?: string | null
          yield_amount?: number
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string
          event_date?: string
          event_type?: string
          id?: string
          position_id?: string
          product_id?: string | null
          yield_amount?: number
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
            foreignKeyName: "yield_events_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "treasury_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yield_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "yield_products"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_products: {
        Row: {
          annual_rate: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          institution: string
          is_available: boolean
          liquidity_days: number
          maturity_date: string | null
          max_investment: number | null
          min_investment: number
          name: string
          product_type: string
          risk_level: string
        }
        Insert: {
          annual_rate?: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          institution?: string
          is_available?: boolean
          liquidity_days?: number
          maturity_date?: string | null
          max_investment?: number | null
          min_investment?: number
          name: string
          product_type?: string
          risk_level?: string
        }
        Update: {
          annual_rate?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          institution?: string
          is_available?: boolean
          liquidity_days?: number
          maturity_date?: string | null
          max_investment?: number | null
          min_investment?: number
          name?: string
          product_type?: string
          risk_level?: string
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
      has_admin_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_company_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      owns_company: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "member" | "viewer"
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
    Enums: {
      app_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
