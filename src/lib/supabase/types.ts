/**
 * Supabase database types — generated from 001_initial_schema.sql
 *
 * Type mapping conventions:
 *   UUID        → string
 *   TEXT        → string
 *   DATE        → string   (ISO format: "YYYY-MM-DD")
 *   TIMESTAMPTZ → string   (ISO format: "YYYY-MM-DDTHH:mm:ssZ")
 *   BIGINT      → number   (Supabase JS client deserialises to number)
 *   INTEGER     → number
 *   BOOLEAN     → boolean
 *   INET        → string
 *
 * Insert types: columns with DEFAULT or nullable columns are optional.
 * Update types: all columns are optional.
 */

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'employee'

export interface UserMetadata {
  role: UserRole
}

// ─────────────────────────────────────────────────────────────
// Database type (Supabase client generic)
// ─────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id:                       string
          user_id:                  string | null
          employee_id:              string
          email:                    string
          name:                     string
          designation:              string
          department:               string
          bank_account:             string
          ifsc_code:                string
          date_of_joining:          string | null
          pf_uan:                   string | null
          basic_pay_cents:          number
          hra_cents:                number
          special_allowance_cents:  number
          income_tax_cents:         number
          pf_cents:                 number
          professional_tax_cents:   number
          is_active:                boolean
          created_at:               string
          updated_at:               string
          deleted_at:               string | null
        }
        Insert: {
          id?:                      string
          user_id?:                 string | null
          employee_id:              string
          email:                    string
          name:                     string
          designation:              string
          department:               string
          bank_account:             string
          ifsc_code:                string
          date_of_joining?:         string | null
          pf_uan?:                  string | null
          basic_pay_cents?:         number
          hra_cents?:               number
          special_allowance_cents?: number
          income_tax_cents?:        number
          pf_cents?:                number
          professional_tax_cents?:  number
          is_active?:               boolean
          created_at?:              string
          updated_at?:              string
          deleted_at?:              string | null
        }
        Update: {
          id?:                      string
          user_id?:                 string | null
          employee_id?:             string
          email?:                   string
          name?:                    string
          designation?:             string
          department?:              string
          bank_account?:            string
          ifsc_code?:               string
          date_of_joining?:         string | null
          pf_uan?:                  string | null
          basic_pay_cents?:         number
          hra_cents?:               number
          special_allowance_cents?: number
          income_tax_cents?:        number
          pf_cents?:                number
          professional_tax_cents?:  number
          is_active?:               boolean
          created_at?:              string
          updated_at?:              string
          deleted_at?:              string | null
        }
        Relationships: []
      }

      payslips: {
        Row: {
          id:                      string
          employee_id:             string
          month:                   string   // "YYYY-MM-01" — first day of month
          basic_pay_cents:         number
          hra_cents:               number
          special_allowance_cents: number
          income_tax_cents:        number
          pf_cents:                number
          professional_tax_cents:  number
          paid_days:               number
          lop_days:                number
          pay_date:                string
          created_at:              string
          updated_at:              string
          deleted_at:              string | null
        }
        Insert: {
          id?:                      string
          employee_id:              string
          month:                    string
          basic_pay_cents?:         number
          hra_cents?:               number
          special_allowance_cents?: number
          income_tax_cents?:        number
          pf_cents?:                number
          professional_tax_cents?:  number
          paid_days:                number
          lop_days?:                number
          pay_date:                 string
          created_at?:              string
          updated_at?:              string
          deleted_at?:              string | null
        }
        Update: {
          id?:                      string
          employee_id?:             string
          month?:                   string
          basic_pay_cents?:         number
          hra_cents?:               number
          special_allowance_cents?: number
          income_tax_cents?:        number
          pf_cents?:                number
          professional_tax_cents?:  number
          paid_days?:               number
          lop_days?:                number
          pay_date?:                string
          created_at?:              string
          updated_at?:              string
          deleted_at?:              string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }

      refresh_tokens: {
        Row: {
          id:         string
          user_id:    string
          token_hash: string
          expires_at: string
          revoked_at: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          token_hash:  string
          expires_at:  string
          revoked_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?:         string
          user_id?:    string
          token_hash?: string
          expires_at?: string
          revoked_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views:     { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums:     { [_ in never]: never }
  }
}

// ─────────────────────────────────────────────────────────────
// Convenience row aliases
// ─────────────────────────────────────────────────────────────

export type Employee     = Database['public']['Tables']['employees']['Row']
export type Payslip      = Database['public']['Tables']['payslips']['Row']
export type RefreshToken = Database['public']['Tables']['refresh_tokens']['Row']

export type EmployeeInsert     = Database['public']['Tables']['employees']['Insert']
export type PayslipInsert      = Database['public']['Tables']['payslips']['Insert']
export type RefreshTokenInsert = Database['public']['Tables']['refresh_tokens']['Insert']

export type EmployeeUpdate     = Database['public']['Tables']['employees']['Update']
export type PayslipUpdate      = Database['public']['Tables']['payslips']['Update']
export type RefreshTokenUpdate = Database['public']['Tables']['refresh_tokens']['Update']

// ─────────────────────────────────────────────────────────────
// Derived / computed types
// ─────────────────────────────────────────────────────────────

/** Payslip with gross, deductions, and net pay pre-computed (cents). */
export interface PayslipComputed extends Payslip {
  gross_earnings_cents:   number  // basic_pay + hra + special_allowance
  total_deductions_cents: number  // income_tax + pf + professional_tax
  net_pay_cents:          number  // gross - deductions
}

/** Payslip joined with the employee's display + banking fields (used by detail view + PDF). */
export interface PayslipWithEmployee extends PayslipComputed {
  employee: Pick<Employee, 'id' | 'name' | 'employee_id' | 'email' | 'designation' | 'department' | 'bank_account' | 'ifsc_code' | 'date_of_joining' | 'pf_uan'>
}

/** Row shape used for the admin CSV payout export. */
export interface PayoutRow {
  employee_name: string
  bank_account:  string
  ifsc_code:     string
  net_amount:    number  // rupees (cents / 100), two decimal places
}
