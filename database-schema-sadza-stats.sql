-- Sadza Statistics Domain Schema
-- For tracking community sadza distribution statistics

-- Sadza recipients table
CREATE TABLE IF NOT EXISTS sadza_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  is_dzikwa_child BOOLEAN DEFAULT FALSE,
  school_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sadza distribution records table
CREATE TABLE IF NOT EXISTS sadza_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES sadza_recipients(id) ON DELETE CASCADE,
  distribution_date DATE NOT NULL,
  sadza_portions INTEGER NOT NULL DEFAULT 1,
  distribution_purpose VARCHAR(255) DEFAULT 'Community Feeding',
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sadza_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sadza_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sadza_recipients
CREATE POLICY "Anyone can view active sadza recipients" ON sadza_recipients
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can insert sadza recipients" ON sadza_recipients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sadza recipients" ON sadza_recipients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sadza recipients" ON sadza_recipients
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for sadza_distributions
CREATE POLICY "Anyone can view sadza distributions" ON sadza_distributions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sadza distributions" ON sadza_distributions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sadza distributions" ON sadza_distributions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sadza distributions" ON sadza_distributions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sadza_recipients_name ON sadza_recipients(full_name);
CREATE INDEX IF NOT EXISTS idx_sadza_recipients_active ON sadza_recipients(is_active);
CREATE INDEX IF NOT EXISTS idx_sadza_distributions_recipient ON sadza_distributions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sadza_distributions_date ON sadza_distributions(distribution_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sadza_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_sadza_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_sadza_recipients_updated_at
  BEFORE UPDATE ON sadza_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_sadza_recipients_updated_at();

CREATE TRIGGER update_sadza_distributions_updated_at
  BEFORE UPDATE ON sadza_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_sadza_distributions_updated_at();
