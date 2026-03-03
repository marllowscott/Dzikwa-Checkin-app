-- Create employees table (master employee data)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email domain constraint for employees
ALTER TABLE employees
ADD CONSTRAINT email_domain_check
CHECK (email ILIKE '%@dzikwa.co.zw' OR email IS NULL);

-- Create user_roles table for RBAC
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'employee')) NOT NULL
);

-- Create guests table for workshop/event check-ins
CREATE TABLE guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  event_name TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update check_ins table to use employee_id foreign key
ALTER TABLE check_ins 
ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT;

-- Create check_ins table
CREATE TABLE check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT,
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
CREATE INDEX idx_check_ins_employee_id ON check_ins(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_full_name ON employees(full_name);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_guests_event_name ON guests(event_name);
CREATE INDEX idx_guests_checked_in_at ON guests(checked_in_at);

-- Enable Row Level Security (RLS)
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For demo purposes, allowing anon access (adjust as needed for production)
CREATE POLICY "Allow all operations for anon users" ON check_ins
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on files" ON files
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on employees" ON employees
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on user_roles" ON user_roles
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on guests" ON guests
  FOR ALL USING (true);

-- Insert test employee seed data
INSERT INTO employees (full_name, email, department) VALUES
('Tawanda Moyo', 'tawanda.moyo@dzikwa.co.zw', 'Operations'),
('Rudo Chikore', 'rudo.chikore@dzikwa.co.zw', 'Finance'),
('Brian Ncube', 'brian.ncube@dzikwa.co.zw', 'IT'),
('Naledi Sibanda', 'naledi.sibanda@dzikwa.co.zw', 'HR'),
('Kudzai Marume', 'kudzai.marume@dzikwa.co.zw', 'Logistics');

-- Assign roles (first employee as admin, others as employees)
INSERT INTO user_roles (user_id, role) 
SELECT e.id, 
       CASE WHEN e.full_name = 'Tawanda Moyo' THEN 'admin' ELSE 'employee' END
FROM employees e;
