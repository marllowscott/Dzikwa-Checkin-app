-- Test Records for Calendar Date Picker Testing (Fixed UUID Issue)
-- Run this SQL in your Supabase SQL Editor to create test data
-- This version uses proper UUIDs instead of string IDs

-- Insert test records spanning multiple months for comprehensive date picker testing
INSERT INTO saved_logs (id, date, month, total_records, json_content, csv_content, summary_content, saved_at) VALUES
-- September 2024 records
('550e8400-e29b-41d4-a716-446655440001', '2024-09-01', '2024-09', 5, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-09-01"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-09-01"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-09-01"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-09-01"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-09-01"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-09-01\nJane Smith,08:30 AM,04:30 PM,2024-09-01\nBob Johnson,09:15 AM,05:15 PM,2024-09-01\nAlice Brown,08:45 AM,04:45 PM,2024-09-01\nCharlie Wilson,09:30 AM,05:30 PM,2024-09-01',
'September 1, 2024 - 5 total check-ins. All employees completed their shifts on time.',
'2024-09-01T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440002', '2024-09-05', '2024-09', 4, 
'[{"full_name":"John Doe","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-09-05"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-09-05"},{"full_name":"Bob Johnson","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-09-05"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-09-05"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:45 AM,04:45 PM,2024-09-05\nJane Smith,09:00 AM,05:00 PM,2024-09-05\nBob Johnson,08:30 AM,04:30 PM,2024-09-05\nAlice Brown,09:15 AM,05:15 PM,2024-09-05',
'September 5, 2024 - 4 total check-ins. Productive Thursday with good attendance.',
'2024-09-05T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440003', '2024-09-15', '2024-09', 6, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-09-15"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-09-15"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-09-15"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-09-15"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-09-15"},{"full_name":"Diana Prince","checkInTime":"08:15 AM","checkOutTime":"04:15 PM","date":"2024-09-15"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-09-15\nJane Smith,08:30 AM,04:30 PM,2024-09-15\nBob Johnson,09:15 AM,05:15 PM,2024-09-15\nAlice Brown,08:45 AM,04:45 PM,2024-09-15\nCharlie Wilson,09:30 AM,05:30 PM,2024-09-15\nDiana Prince,08:15 AM,04:15 PM,2024-09-15',
'September 15, 2024 - 6 total check-ins. Peak Sunday attendance with all hands on deck.',
'2024-09-15T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440004', '2024-09-25', '2024-09', 3, 
'[{"full_name":"John Doe","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-09-25"},{"full_name":"Jane Smith","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-09-25"},{"full_name":"Bob Johnson","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-09-25"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:30 AM,05:30 PM,2024-09-25\nJane Smith,08:45 AM,04:45 PM,2024-09-25\nBob Johnson,09:00 AM,05:00 PM,2024-09-25',
'September 25, 2024 - 3 total check-ins. Light Wednesday due to team meeting.',
'2024-09-25T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440005', '2024-09-30', '2024-09', 5, 
'[{"full_name":"John Doe","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-09-30"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-09-30"},{"full_name":"Bob Johnson","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-09-30"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-09-30"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-09-30"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:30 AM,04:30 PM,2024-09-30\nJane Smith,09:00 AM,05:00 PM,2024-09-30\nBob Johnson,08:45 AM,04:45 PM,2024-09-30\nAlice Brown,09:15 AM,05:15 PM,2024-09-30\nCharlie Wilson,09:30 AM,05:30 PM,2024-09-30',
'September 30, 2024 - 5 total check-ins. End of month wrap-up completed successfully.',
'2024-09-30T10:00:00.000Z'),

-- October 2024 records
('550e8400-e29b-41d4-a716-446655440006', '2024-10-02', '2024-10', 4, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-10-02"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-10-02"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-10-02"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-10-02"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-10-02\nJane Smith,08:30 AM,04:30 PM,2024-10-02\nBob Johnson,09:15 AM,05:15 PM,2024-10-02\nAlice Brown,08:45 AM,04:45 PM,2024-10-02',
'October 2, 2024 - 4 total check-ins. First day of October went smoothly.',
'2024-10-02T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440007', '2024-10-10', '2024-10', 5, 
'[{"full_name":"John Doe","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-10-10"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-10-10"},{"full_name":"Bob Johnson","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-10-10"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-10-10"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-10-10"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:45 AM,04:45 PM,2024-10-10\nJane Smith,09:00 AM,05:00 PM,2024-10-10\nBob Johnson,08:30 AM,04:30 PM,2024-10-10\nAlice Brown,09:15 AM,05:15 PM,2024-10-10\nCharlie Wilson,09:30 AM,05:30 PM,2024-10-10',
'October 10, 2024 - 5 total check-ins. Mid-week productivity maintained.',
'2024-10-10T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440008', '2024-10-15', '2024-10', 3, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-10-15"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-10-15"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-10-15"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-10-15\nJane Smith,08:30 AM,04:30 PM,2024-10-15\nBob Johnson,09:15 AM,05:15 PM,2024-10-15',
'October 15, 2024 - 3 total check-ins. Some team members on leave.',
'2024-10-15T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440009', '2024-10-25', '2024-10', 6, 
'[{"full_name":"John Doe","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-10-25"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-10-25"},{"full_name":"Bob Johnson","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-10-25"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-10-25"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-10-25"},{"full_name":"Diana Prince","checkInTime":"08:15 AM","checkOutTime":"04:15 PM","date":"2024-10-25"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:30 AM,04:30 PM,2024-10-25\nJane Smith,09:00 AM,05:00 PM,2024-10-25\nBob Johnson,08:45 AM,04:45 PM,2024-10-25\nAlice Brown,09:15 AM,05:15 PM,2024-10-25\nCharlie Wilson,09:30 AM,05:30 PM,2024-10-25\nDiana Prince,08:15 AM,04:15 PM,2024-10-25',
'October 25, 2024 - 6 total check-ins. Full team present for project deadline.',
'2024-10-25T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440010', '2024-10-31', '2024-10', 4, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-10-31"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-10-31"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-10-31"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-10-31"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-10-31\nJane Smith,08:30 AM,04:30 PM,2024-10-31\nBob Johnson,09:15 AM,05:15 PM,2024-10-31\nAlice Brown,08:45 AM,04:45 PM,2024-10-31',
'October 31, 2024 - 4 total check-ins. Halloween day with steady attendance.',
'2024-10-31T10:00:00.000Z'),

-- November 2024 records  
('550e8400-e29b-41d4-a716-446655440011', '2024-11-05', '2024-11', 5, 
'[{"full_name":"John Doe","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-11-05"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-11-05"},{"full_name":"Bob Johnson","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-11-05"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-11-05"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-11-05"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:45 AM,04:45 PM,2024-11-05\nJane Smith,09:00 AM,05:00 PM,2024-11-05\nBob Johnson,08:30 AM,04:30 PM,2024-11-05\nAlice Brown,09:15 AM,05:15 PM,2024-11-05\nCharlie Wilson,09:30 AM,05:30 PM,2024-11-05',
'November 5, 2024 - 5 total check-ins. Good start to the month.',
'2024-11-05T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440012', '2024-11-15', '2024-11', 4, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-11-15"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-11-15"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-11-15"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-11-15"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-11-15\nJane Smith,08:30 AM,04:30 PM,2024-11-15\nBob Johnson,09:15 AM,05:15 PM,2024-11-15\nAlice Brown,08:45 AM,04:45 PM,2024-11-15',
'November 15, 2024 - 4 total check-ins. Mid-month consistency maintained.',
'2024-11-15T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440013', '2024-11-25', '2024-11', 3, 
'[{"full_name":"John Doe","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-11-25"},{"full_name":"Jane Smith","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-11-25"},{"full_name":"Bob Johnson","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-11-25"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:30 AM,05:30 PM,2024-11-25\nJane Smith,08:45 AM,04:45 PM,2024-11-25\nBob Johnson,09:00 AM,05:00 PM,2024-11-25',
'November 25, 2024 - 3 total check-ins. Pre-holiday slowdown.',
'2024-11-25T10:00:00.000Z'),

-- December 2024 records
('550e8400-e29b-41d4-a716-446655440014', '2024-12-01', '2024-12', 6, 
'[{"full_name":"John Doe","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-12-01"},{"full_name":"Jane Smith","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-12-01"},{"full_name":"Bob Johnson","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-12-01"},{"full_name":"Alice Brown","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-12-01"},{"full_name":"Charlie Wilson","checkInTime":"09:30 AM","checkOutTime":"05:30 PM","date":"2024-12-01"},{"full_name":"Diana Prince","checkInTime":"08:15 AM","checkOutTime":"04:15 PM","date":"2024-12-01"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,08:30 AM,04:30 PM,2024-12-01\nJane Smith,09:00 AM,05:00 PM,2024-12-01\nBob Johnson,08:45 AM,04:45 PM,2024-12-01\nAlice Brown,09:15 AM,05:15 PM,2024-12-01\nCharlie Wilson,09:30 AM,05:30 PM,2024-12-01\nDiana Prince,08:15 AM,04:15 PM,2024-12-01',
'December 1, 2024 - 6 total check-ins. Strong start to the holiday season.',
'2024-12-01T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440015', '2024-12-15', '2024-12', 4, 
'[{"full_name":"John Doe","checkInTime":"09:00 AM","checkOutTime":"05:00 PM","date":"2024-12-15"},{"full_name":"Jane Smith","checkInTime":"08:30 AM","checkOutTime":"04:30 PM","date":"2024-12-15"},{"full_name":"Bob Johnson","checkInTime":"09:15 AM","checkOutTime":"05:15 PM","date":"2024-12-15"},{"full_name":"Alice Brown","checkInTime":"08:45 AM","checkOutTime":"04:45 PM","date":"2024-12-15"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,09:00 AM,05:00 PM,2024-12-15\nJane Smith,08:30 AM,04:30 PM,2024-12-15\nBob Johnson,09:15 AM,05:15 PM,2024-12-15\nAlice Brown,08:45 AM,04:45 PM,2024-12-15',
'December 15, 2024 - 4 total check-ins. Mid-December steady operations.',
'2024-12-15T10:00:00.000Z'),

('550e8400-e29b-41d4-a716-446655440016', '2024-12-25', '2024-12', 2, 
'[{"full_name":"John Doe","checkInTime":"10:00 AM","checkOutTime":"02:00 PM","date":"2024-12-25"},{"full_name":"Jane Smith","checkInTime":"10:30 AM","checkOutTime":"02:30 PM","date":"2024-12-25"}]',
'Full Name,Check In Time,Check Out Time,Date\nJohn Doe,10:00 AM,02:00 PM,2024-12-25\nJane Smith,10:30 AM,02:30 PM,2024-12-25',
'December 25, 2024 - 2 total check-ins. Christmas day with minimal staff.',
'2024-12-25T10:00:00.000Z');

-- Verify the records were inserted
SELECT 
  date, 
  month, 
  total_records, 
  COUNT(*) as record_count
FROM saved_logs 
WHERE id LIKE '550e8400-e29b-41d4-a716-44665544%'
GROUP BY date, month, total_records
ORDER BY date;
