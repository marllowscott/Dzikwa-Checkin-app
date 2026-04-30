-- Guest System Database Schema
-- This extends the existing employee check-in system

-- Guests table for special visitors
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  purpose TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest check-ins table (separate from employee check-ins)
CREATE TABLE IF NOT EXISTS guest_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  purpose TEXT,
  notes TEXT
);

-- Dzikwa 66 table
CREATE TABLE IF NOT EXISTS dzikwa_children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,
  age INTEGER,
  grade TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child check-ins table
CREATE TABLE IF NOT EXISTS child_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES dzikwa_children(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  grade TEXT,
  notes TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_active ON guests(is_active);
CREATE INDEX IF NOT EXISTS idx_guest_check_ins_guest_id ON guest_check_ins(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_check_ins_time ON guest_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_dzikwa_children_active ON dzikwa_children(is_active);
CREATE INDEX IF NOT EXISTS idx_child_check_ins_child_id ON child_check_ins(child_id);
CREATE INDEX IF NOT EXISTS idx_child_check_ins_time ON child_check_ins(check_in_time);
