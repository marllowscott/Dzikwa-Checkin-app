-- Workshop Domain Tables for Dzikwa Check-in System
-- Separate workshop system from regular guests

-- Workshop Guests Table
CREATE TABLE IF NOT EXISTS workshop_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    workshop_type VARCHAR(100) DEFAULT 'Standard Workshop',
    special_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workshop Check-ins Table
CREATE TABLE IF NOT EXISTS workshop_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_guest_id UUID NOT NULL REFERENCES workshop_guests(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    workshop_type VARCHAR(100) DEFAULT 'Workshop Session',
    session_title VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workshop_guests_active ON workshop_guests(is_active);
CREATE INDEX IF NOT EXISTS idx_workshop_guests_name ON workshop_guests(full_name);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_guest ON workshop_check_ins(workshop_guest_id);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_active ON workshop_check_ins(check_out_time);
CREATE INDEX IF NOT EXISTS idx_workshop_check_ins_time ON workshop_check_ins(check_in_time);

-- Enable Row Level Security (RLS)
ALTER TABLE workshop_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_check_ins ENABLE ROW LEVEL SECURITY;

-- Workshop Guests RLS Policies
CREATE POLICY "Users can view active workshop guests" ON workshop_guests
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert workshop guests" ON workshop_guests
    FOR INSERT WITH CHECK (is_active = true);

CREATE POLICY "Users can update own workshop guests" ON workshop_guests
    FOR UPDATE USING (is_active = true);

CREATE POLICY "Admins can manage workshop guests" ON workshop_guests
    FOR ALL USING (is_active = true);

-- Workshop Check-ins RLS Policies
CREATE POLICY "Users can view workshop check-ins" ON workshop_check_ins
    FOR SELECT USING (true);

CREATE POLICY "Users can insert workshop check-ins" ON workshop_check_ins
    FOR INSERT WITH CHECK (check_in_time IS NOT NULL);

CREATE POLICY "Users can update workshop check-ins" ON workshop_check_ins
    FOR UPDATE USING (check_in_time IS NOT NULL);

CREATE POLICY "Admins can manage workshop check-ins" ON workshop_check_ins
    FOR ALL USING (true);

-- Comments for clarity
COMMENT ON TABLE workshop_guests IS 'Workshop guest registry - separate from regular guests';
COMMENT ON TABLE workshop_check_ins IS 'Workshop check-in/out records - independent tracking';
COMMENT ON COLUMN workshop_guests.workshop_type IS 'Type of workshop (Esteemed, Standard, etc.)';
COMMENT ON COLUMN workshop_guests.special_notes IS 'Special requirements or accessibility needs';
COMMENT ON COLUMN workshop_check_ins.session_title IS 'Specific workshop session title';
COMMENT ON COLUMN workshop_check_ins.workshop_type IS 'Workshop session type for this check-in';
