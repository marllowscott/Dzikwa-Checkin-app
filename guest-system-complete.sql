-- ========================================
-- GUEST SYSTEM WITH RLS POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE dzikwa_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_check_ins ENABLE ROW LEVEL SECURITY;

-- ========================================
-- GUESTS TABLE RLS POLICIES
-- ========================================

-- Admin can do everything with guests
CREATE POLICY "Admin full access to guests" ON guests
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Guests can view their own profile
CREATE POLICY "Guests can view own profile" ON guests
  FOR SELECT USING (
    auth.jwt() ->> 'guest_id' = id::text
  );

-- Guests can update their own profile
CREATE POLICY "Guests can update own profile" ON guests
  FOR UPDATE USING (
    auth.jwt() ->> 'guest_id' = id::text
  );

-- ========================================
-- GUEST CHECK-INS TABLE RLS POLICIES
-- ========================================

-- Admin can do everything with guest check-ins
CREATE POLICY "Admin full access to guest check-ins" ON guest_check_ins
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Guests can view their own check-ins
CREATE POLICY "Guests can view own check-ins" ON guest_check_ins
  FOR SELECT USING (
    auth.jwt() ->> 'guest_id' = guest_id::text
  );

-- Guests can insert their own check-ins (handled by backend)
CREATE POLICY "Guests can insert own check-ins" ON guest_check_ins
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'guest_id' = guest_id::text
  );

-- ========================================
-- DZIKWA CHILDREN TABLE RLS POLICIES
-- ========================================

-- Admin can do everything with children
CREATE POLICY "Admin full access to children" ON dzikwa_children
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Children can view their own profile
CREATE POLICY "Children can view own profile" ON dzikwa_children
  FOR SELECT USING (
    auth.jwt() ->> 'child_id' = id::text
  );

-- ========================================
-- CHILD CHECK-INS TABLE RLS POLICIES
-- ========================================

-- Admin can do everything with child check-ins
CREATE POLICY "Admin full access to child check-ins" ON child_check_ins
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Children can view their own check-ins
CREATE POLICY "Children can view own check-ins" ON child_check_ins
  FOR SELECT USING (
    auth.jwt() ->> 'child_id' = child_id::text
  );

-- ========================================
-- FUNCTIONS FOR GUEST AUTH
-- ========================================

-- Function to create guest session
CREATE OR REPLACE FUNCTION create_guest_session(guest_id UUID)
RETURNS TEXT AS $$
DECLARE
  session_token TEXT;
BEGIN
  -- Generate a simple session token
  session_token := encode(
    encode(
      json_build_object(
        'guest_id', guest_id,
        'role', 'guest',
        'exp', extract(epoch from now()) + 86400 -- 24 hours
      )::bytea,
      'base64'
    ),
    'hex'
  );
  
  RETURN session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify guest session
CREATE OR REPLACE FUNCTION verify_guest_session(token TEXT)
RETURNS TABLE(guest_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (payload ->> 'guest_id')::UUID as guest_id,
    (payload ->> 'role')::TEXT as role
  FROM (
    SELECT 
      convert_from(decode(token, 'hex'), 'utf8')::json as payload
  ) decoded
  WHERE 
    (payload ->> 'role')::TEXT = 'guest'
    AND (payload ->> 'exp')::BIGINT > extract(epoch from now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at columns if they don't exist
ALTER TABLE guests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE dzikwa_children ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create triggers
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON dzikwa_children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Guests table indexes
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_active ON guests(is_active);
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON guests(created_at);

-- Guest check-ins indexes
CREATE INDEX IF NOT EXISTS idx_guest_check_ins_guest_id ON guest_check_ins(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_check_ins_time ON guest_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_guest_check_ins_checkout ON guest_check_ins(check_out_time);

-- Children table indexes
CREATE INDEX IF NOT EXISTS idx_children_active ON dzikwa_children(is_active);
CREATE INDEX IF NOT EXISTS idx_children_parent_phone ON dzikwa_children(parent_phone);
CREATE INDEX IF NOT EXISTS idx_children_created_at ON dzikwa_children(created_at);

-- Child check-ins indexes
CREATE INDEX IF NOT EXISTS idx_child_check_ins_child_id ON child_check_ins(child_id);
CREATE INDEX IF NOT EXISTS idx_child_check_ins_time ON child_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_child_check_ins_checkout ON child_check_ins(check_out_time);

-- ========================================
-- VIEWS FOR EASY QUERIES
-- ========================================

-- View for active guests with latest check-in status
CREATE OR REPLACE VIEW active_guests AS
SELECT 
  g.*,
  CASE 
    WHEN gci.check_in_time IS NOT NULL AND gci.check_out_time IS NULL THEN 'Checked In'
    ELSE 'Not Checked In'
  END as status,
  gci.check_in_time as last_check_in,
  gci.check_out_time as last_check_out
FROM guests g
LEFT JOIN LATERAL (
  SELECT *
  FROM guest_check_ins
  WHERE guest_id = g.id
  ORDER BY check_in_time DESC
  LIMIT 1
) gci ON true
WHERE g.is_active = true;

-- View for active children with latest check-in status
CREATE OR REPLACE VIEW active_children AS
SELECT 
  c.*,
  CASE 
    WHEN cci.check_in_time IS NOT NULL AND cci.check_out_time IS NULL THEN 'Checked In'
    ELSE 'Not Checked In'
  END as status,
  cci.check_in_time as last_check_in,
  cci.check_out_time as last_check_out
FROM dzikwa_children c
LEFT JOIN LATERAL (
  SELECT *
  FROM child_check_ins
  WHERE child_id = c.id
  ORDER BY check_in_time DESC
  LIMIT 1
) cci ON true
WHERE c.is_active = true;

-- ========================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ========================================

-- Insert a sample guest for testing (remove in production)
INSERT INTO guests (full_name, email, phone, company, purpose, is_active)
VALUES (
  'Test Guest',
  'test@guest.com',
  '+263123456789',
  'Test Company',
  'Testing guest system',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert a sample child for testing (remove in production)
INSERT INTO dzikwa_children (full_name, parent_name, parent_phone, parent_email, age, grade, is_active)
VALUES (
  'Test Child',
  'Test Parent',
  '+263123456789',
  'parent@test.com',
  10,
  'Grade 5',
  true
) ON CONFLICT DO NOTHING;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Guest System with RLS policies created successfully!' as status;
