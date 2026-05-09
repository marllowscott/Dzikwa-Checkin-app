-- Add missing columns to existing workshop_check_ins table
-- Run this in your Supabase SQL Editor

-- Add saved_date column to track when records were saved/archived
ALTER TABLE public.workshop_check_ins 
ADD COLUMN IF NOT EXISTS saved_date TIMESTAMP WITH TIME ZONE;

-- Add saved column to mark records as saved/archived
ALTER TABLE public.workshop_check_ins 
ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT false;

-- Create index for better performance on saved records
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_saved ON public.workshop_check_ins(saved);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_saved_date ON public.workshop_check_ins(saved_date);

-- Grant permissions for the new columns
GRANT ALL ON public.workshop_check_ins TO authenticated;
GRANT ALL ON public.workshop_check_ins TO service_role;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workshop_check_ins' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
