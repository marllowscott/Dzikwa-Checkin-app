-- Create check_ins table
CREATE TABLE check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table for storing uploaded files
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Create saved_logs table for storing archived daily logs
CREATE TABLE saved_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  log_data JSONB NOT NULL,
  json_content TEXT NOT NULL,
  csv_content TEXT NOT NULL,
  summary_content TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  saved_by TEXT DEFAULT 'admin'
);

-- Create index for better query performance
CREATE INDEX idx_check_ins_check_in_time ON check_ins(check_in_time);
CREATE INDEX idx_check_ins_full_name ON check_ins(full_name);

-- Enable Row Level Security (RLS)
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For demo purposes, allowing anon access (adjust as needed for production)
CREATE POLICY "Allow all operations for anon users" ON check_ins
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on files" ON files
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs
  FOR ALL USING (true);
