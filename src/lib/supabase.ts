import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development warning for missing environment variables
if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ Missing Supabase environment variables.\n' +
      'Please create a .env file with:\n' +
      'VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
      'VITE_SUPABASE_ANON_KEY=your-supabase-anon-key\n\n' +
      'Get these from: https://supabase.com/dashboard > Project > Settings > API'
    );
  } else {
    console.error('❌ Supabase configuration missing. Please check environment variables.');
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'dzikwa-checkin/1.0.0',
    },
  },
})

// Optimized query functions
export const supabaseQueries = {
  // Get recent check-ins with pagination
  getRecentCheckIns: async (page = 1, limit = 50) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    return await supabase
      .from('check_ins')
      .select('*')
      .order('check_in_time', { ascending: false })
      .range(from, to)
  },

  // Get check-ins by date range with optimized query
  getCheckInsByDateRange: async (startDate: string, endDate: string) => {
    return await supabase
      .from('check_ins')
      .select('*')
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate)
      .order('check_in_time', { ascending: false })
  },

  // Get active check-ins (no check-out time)
  getActiveCheckIns: async () => {
    return await supabase
      .from('check_ins')
      .select('*')
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
  },

  // Batch insert for multiple records
  batchInsertCheckIns: async (records: Partial<CheckInRecord>[]) => {
    return await supabase
      .from('check_ins')
      .insert(records)
      .select()
  },
}

export interface CheckInRecord {
  id: string
  user_id?: string
  full_name: string
  check_in_time: string
  check_out_time?: string
  checked_out?: boolean
  created_at: string
}

export interface FileRecord {
  id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  uploaded_by?: string
  uploaded_at: string
  description?: string
}

export interface SavedLog {
  id: string
  date: string
  month: string
  total_records: number
  log_data: any[]
  json_content: string
  csv_content: string
  summary_content: string
  saved_at: string
  saved_by?: string
}