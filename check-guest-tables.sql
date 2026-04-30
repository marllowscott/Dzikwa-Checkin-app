-- =====================================================
-- CHECK GUEST TABLES STRUCTURE
-- =====================================================

-- Check if guest tables exist and show their structure
SELECT 'guests table' as table_info, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'guests' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'guest_check_ins table' as table_info, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'guest_check_ins' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data if exists
SELECT 'Sample guests' as info, id, full_name, email, is_active 
FROM guests 
LIMIT 3;

SELECT 'Sample guest check-ins' as info, id, guest_id, check_in_time, check_out_time 
FROM guest_check_ins 
LIMIT 3;

-- Check for active guest check-ins
SELECT 'Active guest check-ins' as info, 
       gci.id, 
       g.full_name as guest_name, 
       gci.check_in_time,
       gci.check_out_time
FROM guest_check_ins gci
JOIN guests g ON gci.guest_id = g.id
WHERE gci.check_out_time IS NULL;
