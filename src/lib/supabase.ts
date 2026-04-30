import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseKey)

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

const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const adminClientKey = supabaseServiceRoleKey || supabaseKey || ''

if (!supabaseServiceRoleKey && import.meta.env.DEV) {
  console.warn(
    "⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY is not set. Admin client will fall back to the anon key. " +
    "If you need server-side admin access, move service-role operations to a backend endpoint instead of using a frontend-secret."
  )
}

// Admin Supabase client with service role key for admin operations.
// If the service role key is not available in the browser, use anon key instead.
export const adminSupabase = createClient(supabaseUrl || '', adminClientKey, {
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

// Admin management functions
export const adminManagement = {
  // Create Super Admin account
  createSuperAdmin: async (email: string, password: string) => {
    const { data, error } = await adminSupabase
      .from('users')
      .insert({
        email,
        password_hash: password,
        role: 'superadmin'
      })
      .select()
      .single();

    return { data, error };
  },

  getAllAdmins: async () => {
    const { data, error } = await adminSupabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  addAdmin: async (email: string, password: string) => {
    const { data, error } = await adminSupabase
      .from('users')
      .insert({
        email,
        password_hash: password,
        role: 'admin'
      })
      .select()
      .single();

    return { data, error };
  },

  removeAdmin: async (adminId: string) => {
    const { data, error } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', adminId)
      .select()
      .single();

    return { data, error };
  },

  getAdminByEmail: async (email: string) => {
    const { data, error } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    return { data, error };
  }
}

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

  // Employee management queries
  searchEmployees: async (query: string) => {
    console.log('Searching employees with query:', query);
    const result = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('is_active', true)
      .ilike('full_name', `%${query}%`)
      .limit(10);
    console.log('Search result:', result);
    return result;
  },

  // Unified search across all domains
  searchAllDomains: async (query: string) => {
    console.log('Searching all domains with query:', query);
    const lowerQuery = query.toLowerCase();

    // Search employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .ilike('full_name', `%${query}%`)
      .limit(10);

    // Search guests
    const { data: guests } = await supabase
      .from('guests')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .ilike('full_name', `%${query}%`)
      .limit(10);

    // Search children
    const { data: children } = await supabase
      .from('dzikwa_children')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .ilike('full_name', `%${query}%`)
      .limit(10);

    // Search workshop guests (guests with workshop-related purposes)
    const { data: workshopGuests } = await supabase
      .from('guests')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .ilike('full_name', `%${query}%`)
      .ilike('purpose', '%workshop%')
      .limit(10);

    // Format results with domain type
    const results = [
      ...(employees || []).map(e => ({ ...e, domain: 'employee', domainLabel: 'Employee' })),
      ...(guests || []).map(g => ({ ...g, domain: 'guest', domainLabel: 'Guest' })),
      ...(children || []).map(c => ({ ...c, domain: 'child', domainLabel: 'Child' })),
      ...(workshopGuests || []).map(w => ({ ...w, domain: 'workshop', domainLabel: 'Workshop' }))
    ];

    console.log('Unified search results:', results);
    return results;
  },

  getActiveEmployeesForCheckout: async () => {
    return await supabase
      .from('check_ins')
      .select('employee_id, employees!inner(full_name)')
      .is('check_out_time', null)
      .eq('check_in_time', new Date().toISOString().split('T')[0])
  },

  checkEmployeeStatus: async (employeeId: string) => {
    // First try today's check-ins
    const { data: todayData } = await supabase
      .from('check_ins')
      .select('*')
      .eq('employee_id', employeeId)
      .is('check_out_time', null)
      .eq('check_in_time', new Date().toISOString().split('T')[0])
      .limit(1)

    if (todayData && todayData.length > 0) {
      return { checkedIn: true, domain: 'employee', checkInId: todayData[0].id };
    }

    // If no today check-in, check for any active check-in (fallback)
    const { data: anyData } = await supabase
      .from('check_ins')
      .select('*')
      .eq('employee_id', employeeId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)

    if (anyData && anyData.length > 0) {
      return { checkedIn: true, domain: 'employee', checkInId: anyData[0].id };
    }

    return { checkedIn: false, domain: 'employee', checkInId: null };
  },

  // Unified check status across all domains
  checkPersonStatus: async (personId: string, domain: string) => {
    if (domain === 'employee') {
      // Check employee status
      const { data: todayData } = await supabase
        .from('check_ins')
        .select('*')
        .eq('employee_id', personId)
        .is('check_out_time', null)
        .eq('check_in_time', new Date().toISOString().split('T')[0])
        .limit(1);

      if (todayData && todayData.length > 0) {
        return { checkedIn: true, domain: 'employee', checkInId: todayData[0].id, table: 'check_ins' };
      }

      const { data: anyData } = await supabase
        .from('check_ins')
        .select('*')
        .eq('employee_id', personId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1);

      if (anyData && anyData.length > 0) {
        return { checkedIn: true, domain: 'employee', checkInId: anyData[0].id, table: 'check_ins' };
      }
    } else if (domain === 'guest') {
      // Check guest status
      const { data: todayData } = await supabase
        .from('guest_check_ins')
        .select('*')
        .eq('guest_id', personId)
        .is('check_out_time', null)
        .eq('check_in_time', new Date().toISOString().split('T')[0])
        .limit(1);

      if (todayData && todayData.length > 0) {
        return { checkedIn: true, domain: 'guest', checkInId: todayData[0].id, table: 'guest_check_ins' };
      }

      const { data: anyData } = await supabase
        .from('guest_check_ins')
        .select('*')
        .eq('guest_id', personId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1);

      if (anyData && anyData.length > 0) {
        return { checkedIn: true, domain: 'guest', checkInId: anyData[0].id, table: 'guest_check_ins' };
      }
    } else if (domain === 'child') {
      // Check child status
      const { data: todayData } = await supabase
        .from('child_check_ins')
        .select('*')
        .eq('child_id', personId)
        .is('check_out_time', null)
        .eq('check_in_time', new Date().toISOString().split('T')[0])
        .limit(1);

      if (todayData && todayData.length > 0) {
        return { checkedIn: true, domain: 'child', checkInId: todayData[0].id, table: 'child_check_ins' };
      }

      const { data: anyData } = await supabase
        .from('child_check_ins')
        .select('*')
        .eq('child_id', personId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1);

      if (anyData && anyData.length > 0) {
        return { checkedIn: true, domain: 'child', checkInId: anyData[0].id, table: 'child_check_ins' };
      }
    }

    return { checkedIn: false, domain, checkInId: null, table: null };
  },

  createCheckIn: async (employeeId: string) => {
    // First get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', employeeId)
      .single()

    if (!employee) throw new Error('Employee not found')

    // Create check-in record with proper foreign key relationship
    return await supabase
      .from('check_ins')
      .insert({
        employee_id: employeeId,
        full_name: employee.full_name,
        check_in_time: new Date().toISOString()
      })
      .select()
      .single()
  },

  createCheckOut: async (employeeId: string) => {
    // Find the most recent active check-in (any date)
    const { data: activeCheckIn, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('employee_id', employeeId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)

    if (error) {
      throw new Error('Database error: ' + error.message);
    }

    if (!activeCheckIn || activeCheckIn.length === 0) {
      throw new Error('No active check-in found');
    }

    const checkInRecord = activeCheckIn[0];

    // Update with check-out time
    const { data: updatedRecord, error: updateError } = await supabase
      .from('check_ins')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', checkInRecord.id)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to update check-out: ' + updateError.message);
    }

    return updatedRecord;
  },

  // Guest management
  createGuestCheckIn: async (guestData: Omit<Guest, 'id' | 'checked_in_at'>) => {
    return await supabase
      .from('guests')
      .insert({
        ...guestData,
        checked_in_at: new Date().toISOString()
      })
      .select()
      .single()
  },
}

// Export individual functions for direct access

// Guest Management Functions
export const createGuest = async (guestData: {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  purpose?: string;
}) => {
  const { data, error } = await supabase
    .from('guests')
    .insert([{
      full_name: guestData.full_name.trim(),
      email: guestData.email?.trim() || null,
      phone: guestData.phone?.trim() || null,
      company: guestData.company?.trim() || null,
      purpose: guestData.purpose?.trim() || null,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Export individual functions
export const searchEmployees = supabaseQueries.searchEmployees;
export const searchAllDomains = supabaseQueries.searchAllDomains;
export const getActiveEmployeesForCheckout = supabaseQueries.getActiveEmployeesForCheckout;
// Guest Management Functions
export const getGuests = async () => {
  return await supabase
    .from('guests')
    .select('*')
    .eq('is_active', true)
    .order('full_name');
};

export const updateGuest = async (id: string, guestData: {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  purpose?: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('guests')
    .update({
      full_name: guestData.full_name?.trim(),
      email: guestData.email?.trim() || null,
      phone: guestData.phone?.trim() || null,
      company: guestData.company?.trim() || null,
      purpose: guestData.purpose?.trim() || null,
      is_active: guestData.is_active !== undefined ? guestData.is_active : true
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteGuest = async (id: string) => {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Guest Check-In Functions
export const checkInGuest = async (guestId: string, purpose?: string) => {
  const { data, error } = await supabase
    .from('guest_check_ins')
    .insert([{
      guest_id: guestId,
      check_in_time: new Date().toISOString(),
      purpose: purpose || 'Visit',
      notes: null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const checkOutGuest = async (checkInId: string) => {
  const { data, error } = await supabase
    .from('guest_check_ins')
    .update({ check_out_time: new Date().toISOString() })
    .eq('id', checkInId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getGuestCheckIns = async () => {
  return await supabase
    .from('guest_check_ins')
    .select('*, guests!full_name')
    .order('check_in_time', { ascending: false });
};

// Dzikwa Children Functions
export const createChild = async (childData: {
  full_name: string;
  parent_name: string;
  parent_phone?: string;
  parent_email?: string;
  age?: number;
  grade?: string;
}) => {
  const { data, error } = await supabase
    .from('dzikwa_children')
    .insert([{
      full_name: childData.full_name.trim(),
      parent_name: childData.parent_name.trim(),
      parent_phone: childData.parent_phone?.trim() || null,
      parent_email: childData.parent_email?.trim() || null,
      age: childData.age || null,
      grade: childData.grade?.trim() || null,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChildren = async () => {
  return await supabase
    .from('dzikwa_children')
    .select('*')
    .eq('is_active', true)
    .order('full_name');
};

export const updateChild = async (id: string, childData: {
  full_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  age?: number;
  grade?: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('dzikwa_children')
    .update({
      full_name: childData.full_name?.trim(),
      parent_name: childData.parent_name?.trim(),
      parent_phone: childData.parent_phone?.trim() || null,
      parent_email: childData.parent_email?.trim() || null,
      age: childData.age || null,
      grade: childData.grade?.trim() || null,
      is_active: childData.is_active !== undefined ? childData.is_active : true
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteChild = async (id: string) => {
  const { error } = await supabase
    .from('dzikwa_children')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Child Check-In Functions
export const checkInChild = async (childId: string, grade?: string) => {
  const { data, error } = await supabase
    .from('child_check_ins')
    .insert([{
      child_id: childId,
      check_in_time: new Date().toISOString(),
      grade: grade || 'Standard',
      notes: null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const checkOutChild = async (checkInId: string) => {
  const { data, error } = await supabase
    .from('child_check_ins')
    .update({ check_out_time: new Date().toISOString() })
    .eq('id', checkInId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChildCheckIns = async () => {
  return await supabase
    .from('child_check_ins')
    .select('*, dzikwa_children!full_name')
    .order('check_in_time', { ascending: false });
};

export const checkEmployeeStatus = supabaseQueries.checkEmployeeStatus;
export const checkPersonStatus = supabaseQueries.checkPersonStatus;
export const createCheckIn = supabaseQueries.createCheckIn;
export const createCheckOut = supabaseQueries.createCheckOut;
export const createGuestCheckIn = supabaseQueries.createGuestCheckIn;

export interface CheckInRecord {
  id: string
  user_id?: string
  full_name: string
  employee_id?: string
  check_in_time: string
  check_out_time?: string
  checked_out?: boolean
  created_at: string
}

export interface Employee {
  id: string
  full_name: string
  email?: string
  department?: string
  is_active: boolean
  created_at: string
}

export interface UserRole {
  user_id: string
  role: 'admin' | 'employee'
}

export interface Guest {
  id: string
  full_name: string
  email?: string
  phone?: string
  company?: string
  purpose?: string
  is_active: boolean
  created_at: string
}

export interface GuestCheckIn {
  id: string
  guest_id: string
  check_in_time: string
  check_out_time?: string
  purpose?: string
  notes?: string
}

export interface DzikwaChild {
  id: string
  full_name: string
  parent_name: string
  parent_phone?: string
  parent_email?: string
  age?: number
  grade?: string
  is_active: boolean
  created_at: string
}

export interface ChildCheckIn {
  id: string
  child_id: string
  check_in_time: string
  check_out_time?: string
  grade?: string
  notes?: string
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