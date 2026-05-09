-- Workshop Domain Database Schema
-- Run these queries in your Supabase SQL Editor

-- Create workshop_guests table
CREATE TABLE IF NOT EXISTS public.workshop_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  workshop_type TEXT DEFAULT 'Standard Workshop',
  special_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create workshop_check_ins table
CREATE TABLE IF NOT EXISTS public.workshop_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_guest_id UUID REFERENCES public.workshop_guests(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  workshop_type TEXT,
  session_title TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create workshop_saved_logs table
CREATE TABLE IF NOT EXISTS public.workshop_saved_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  log_data JSONB NOT NULL,
  summary_content TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workshop_guests_full_name ON public.workshop_guests(full_name);
CREATE INDEX IF NOT EXISTS idx_workshop_guests_is_active ON public.workshop_guests(is_active);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_guest_id ON public.workshop_check_ins(workshop_guest_id);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_check_in_time ON public.workshop_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_workshop_saved_logs_date ON public.workshop_saved_logs(date);
CREATE INDEX IF NOT EXISTS idx_workshop_saved_logs_saved_at ON public.workshop_saved_logs(saved_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workshop_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_saved_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all operations on workshop_guests
CREATE POLICY "Enable all operations for workshop_guests" ON public.workshop_guests
  FOR ALL USING (true)
  WITH CHECK (true);

-- Allow all operations on workshop_check_ins
CREATE POLICY "Enable all operations for workshop_check_ins" ON public.workshop_check_ins
  FOR ALL USING (true)
  WITH CHECK (true);

-- Allow all operations on workshop_saved_logs
CREATE POLICY "Enable all operations for workshop_saved_logs" ON public.workshop_saved_logs
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.workshop_guests TO authenticated;
GRANT ALL ON public.workshop_guests TO service_role;
GRANT ALL ON public.workshop_check_ins TO authenticated;
GRANT ALL ON public.workshop_check_ins TO service_role;
GRANT ALL ON public.workshop_saved_logs TO authenticated;
GRANT ALL ON public.workshop_saved_logs TO service_role;
