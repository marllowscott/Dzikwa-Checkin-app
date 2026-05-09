import { supabase } from './supabase'

export interface WorkshopGuest {
  id: string
  full_name: string
  email?: string
  phone?: string
  company?: string
  workshop_type?: string
  special_notes?: string
  is_active: boolean
  created_at: string
}

export interface WorkshopCheckIn {
  id: string
  workshop_guest_id: string
  check_in_time: string
  check_out_time?: string
  workshop_type?: string
  session_title?: string
  notes?: string
  created_at: string
}

// Workshop Guest Management Functions
export const createWorkshopGuest = async (guestData: {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  workshop_type?: string;
  special_notes?: string;
}) => {
  const { data, error } = await supabase
    .from('workshop_guests')
    .insert([{
      full_name: guestData.full_name.trim(),
      email: guestData.email?.trim() || null,
      phone: guestData.phone?.trim() || null,
      company: guestData.company?.trim() || null,
      workshop_type: guestData.workshop_type?.trim() || null,
      special_notes: guestData.special_notes?.trim() || null,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getWorkshopGuests = async () => {
  return await supabase
    .from('workshop_guests')
    .select('*')
    .eq('is_active', true)
    .order('full_name');
};

export const updateWorkshopGuest = async (id: string, guestData: {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  workshop_type?: string;
  special_notes?: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('workshop_guests')
    .update({
      full_name: guestData.full_name?.trim(),
      email: guestData.email?.trim() || null,
      phone: guestData.phone?.trim() || null,
      company: guestData.company?.trim() || null,
      workshop_type: guestData.workshop_type?.trim() || null,
      special_notes: guestData.special_notes?.trim() || null,
      is_active: guestData.is_active !== undefined ? guestData.is_active : true
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWorkshopGuest = async (id: string) => {
  const { error } = await supabase
    .from('workshop_guests')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Workshop Check-In Functions
export const checkInWorkshopGuest = async (guestId: string, workshopType?: string, sessionTitle?: string) => {
  const { data, error } = await supabase
    .from('workshop_check_ins')
    .insert([{
      workshop_guest_id: guestId,
      check_in_time: new Date().toISOString(),
      workshop_type: workshopType || 'Workshop Session',
      session_title: sessionTitle || null,
      notes: null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const checkOutWorkshopGuest = async (checkInId: string) => {
  console.log('Checking out workshop participant with ID:', checkInId);

  const { data, error } = await supabase
    .from('workshop_check_ins')
    .update({
      check_out_time: new Date().toISOString()
    })
    .eq('id', checkInId)
    .select();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  console.log('Checkout successful:', data);
  return data;
};

export const getWorkshopCheckIns = async () => {
  return await supabase
    .from('workshop_check_ins')
    .select('*, workshop_guests(full_name, email, company, workshop_type)')
    .order('check_in_time', { ascending: false });
};

export const getActiveWorkshopCheckIns = async () => {
  return await supabase
    .from('workshop_check_ins')
    .select('*, workshop_guests(full_name, email, company, workshop_type)')
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false });
};

// Workshop search function
export const searchWorkshopGuests = async (query: string) => {
  console.log('Searching workshop participants with query:', query);
  const result = await supabase
    .from('workshop_guests')
    .select('id, full_name, is_active')
    .eq('is_active', true)
    .ilike('full_name', `%${query}%`)
    .limit(10);
  console.log('Workshop search result:', result);
  return result;
};

// Workshop status check
export const checkWorkshopGuestStatus = async (guestId: string) => {
  // First try today's check-ins
  const { data: todayData } = await supabase
    .from('workshop_check_ins')
    .select('*')
    .eq('workshop_guest_id', guestId)
    .is('check_out_time', null)
    .eq('check_in_time', new Date().toISOString().split('T')[0])
    .limit(1);

  if (todayData && todayData.length > 0) {
    return { checkedIn: true, domain: 'workshop', checkInId: todayData[0].id, table: 'workshop_check_ins' };
  }

  // If no today check-in, check for any active check-in (fallback)
  const { data: anyData } = await supabase
    .from('workshop_check_ins')
    .select('*')
    .eq('workshop_guest_id', guestId)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false })
    .limit(1);

  if (anyData && anyData.length > 0) {
    return { checkedIn: true, domain: 'workshop', checkInId: anyData[0].id, table: 'workshop_check_ins' };
  }

  return { checkedIn: false, domain: 'workshop', checkInId: null, table: null };
};
