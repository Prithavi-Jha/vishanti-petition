-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Drop of all existing tables (CASCADE ensures no foreign key or relation-already-exists errors)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS audit_entries CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS officials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ====================================================================
-- TABLE 1: USERS (Class Diagram: User with Authentication)
-- Attributes: id, uid, name, email, password, role, roll, created_at
-- ====================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'official' | 'authority'
    roll TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- TABLE 2: OFFICIALS (Class Diagram: Official)
-- Attributes: id, official_id, name, department, role, email, created_at
-- ====================================================================
CREATE TABLE officials (
    id SERIAL PRIMARY KEY,
    official_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- TABLE 3: COMPLAINTS (Class Diagram: Complaint)
-- Attributes: complaint_id, tracking_id, title, category, priority, status, description, etc.
-- ====================================================================
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    complaint_id TEXT NOT NULL UNIQUE,
    tracking_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    description TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    petitioner_name TEXT,
    petitioner_roll TEXT,
    petitioner_email TEXT,
    assigned_official_id TEXT REFERENCES officials(official_id) ON DELETE SET NULL,
    assigned_official_name TEXT,
    department TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_complaints_tracking_id ON complaints(tracking_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_is_public ON complaints(is_public);
CREATE INDEX idx_complaints_category ON complaints(category);

-- ====================================================================
-- TABLE 4: AUDIT_ENTRIES (Class Diagram: AuditEntry)
-- Attributes: entry_id, complaint_id, action, actor_name, actor_role, timestamp, previous_hash, current_hash
-- ====================================================================
CREATE TABLE audit_entries (
    id SERIAL PRIMARY KEY,
    entry_id TEXT NOT NULL UNIQUE,
    complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL
);

CREATE INDEX idx_audit_complaint_id ON audit_entries(complaint_id);

-- ====================================================================
-- TABLE 5: ATTACHMENTS (Class Diagram: Attachment)
-- Attributes: file_id, complaint_id, file_name, file_url, file_size, file_type
-- ====================================================================
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    file_id TEXT NOT NULL UNIQUE,
    complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_attachments_complaint_id ON attachments(complaint_id);

-- ====================================================================
-- TABLE 6: NOTIFICATIONS (Class Diagram: Notification)
-- Attributes: notification_id, recipient_role, recipient_id, title, message, is_read, type
-- ====================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    notification_id TEXT NOT NULL UNIQUE,
    recipient_role TEXT NOT NULL,
    recipient_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    complaint_id TEXT,
    tracking_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT DEFAULT 'status_change',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_role);

-- ====================================================================
-- ROW LEVEL SECURITY: DISABLE RLS FOR SEAMLESS CLIENT ANON ACCESS
-- This ensures all operations (SELECT, INSERT, UPDATE) succeed without policy rejections
-- ====================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE officials DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Fallback Permissive Policies (in case RLS is manually toggled in Supabase dashboard)
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_full_users" ON users;
    DROP POLICY IF EXISTS "anon_full_officials" ON officials;
    DROP POLICY IF EXISTS "anon_full_complaints" ON complaints;
    DROP POLICY IF EXISTS "anon_full_audit" ON audit_entries;
    DROP POLICY IF EXISTS "anon_full_attachments" ON attachments;
    DROP POLICY IF EXISTS "anon_full_notifications" ON notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_full_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_officials" ON officials FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_complaints" ON complaints FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_audit" ON audit_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_attachments" ON attachments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_notifications" ON notifications FOR ALL TO anon USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED 1: DUMMY USERS WITH PASSWORDS
-- ====================================================================
INSERT INTO users (uid, name, email, password, role, roll) VALUES
-- Student Accounts
('usr-std-101', 'Prithavi Narayan Jha', 'prithavi@campus.edu', 'Student@2026', 'student', '20263554'),
('usr-std-102', 'Yashika Agrawal', 'yashika@campus.edu', 'Student@2026', 'student', '20263579'),
('usr-std-103', 'Ashish Singh', 'ashish@campus.edu', 'Student@2026', 'student', '20263061'),
('usr-std-104', 'Aarav Patel', 'aarav.patel@campus.edu', 'Student@2026', 'student', '20263102'),

-- Official Accounts (Grievance Officers)
('usr-off-201', 'Dr. Sunita Deshmukh', 'warden.chief@campus.edu', 'Official@2026', 'official', NULL),
('usr-off-202', 'Prof. Arvind Nambiar', 'dean.academic@campus.edu', 'Official@2026', 'official', NULL),
('usr-off-203', 'Er. Rajesh K. Varma', 'estate.engineer@campus.edu', 'Official@2026', 'official', NULL),
('usr-off-204', 'Prof. Meenakshi Sundaram', 'icc.chair@campus.edu', 'Official@2026', 'official', NULL),
('usr-off-205', 'Mr. Sanjeev Hegde', 'finance.officer@campus.edu', 'Official@2026', 'official', NULL),

-- Authority Account (Executive Dean of Student Affairs)
('usr-auth-301', 'Prof. Arvind Nambiar (Dean)', 'dean.affairs@campus.edu', 'Dean@2026', 'authority', NULL)
ON CONFLICT (uid) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

-- ====================================================================
-- SEED 2: INSTITUTIONAL OFFICIALS DIRECTORY
-- ====================================================================
INSERT INTO officials (official_id, name, department, role, email) VALUES
('off-1', 'Prof. Arvind Nambiar', 'Academic', 'Dean of Academic Affairs', 'dean.academic@campus.edu'),
('off-2', 'Dr. Sunita Deshmukh', 'Hostel & Mess', 'Chief Warden (Hostels)', 'warden.chief@campus.edu'),
('off-3', 'Er. Rajesh K. Varma', 'Infrastructure', 'Executive Engineer (Estate)', 'estate.engineer@campus.edu'),
('off-4', 'Prof. Meenakshi Sundaram', 'Harassment & Safety', 'Chairperson, Internal Complaints Committee', 'icc.chair@campus.edu'),
('off-5', 'Mr. Sanjeev Hegde', 'Financial & Fees', 'Finance & Accounts Officer', 'finance.officer@campus.edu')
ON CONFLICT (official_id) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    email = EXCLUDED.email;

-- ====================================================================
-- SEED 3: INITIAL COMPLAINTS (With SLA Deadlines & Cryptographic Links)
-- ====================================================================
INSERT INTO complaints (
    complaint_id, tracking_id, title, category, priority, status, description,
    is_public, is_anonymous, petitioner_name, petitioner_roll, petitioner_email,
    assigned_official_id, assigned_official_name, department, deadline, resolved_at, resolution_notes, created_at
) VALUES
(
    'comp-101', 'VP-2026-H8912',
    'Disrupted Water Supply in Boys Hostel Block C - 3rd & 4th Floors',
    'Hostel & Mess', 'Urgent', 'Resolved',
    'Overhead booster pump tripped on Sunday morning, leaving 120 residents with zero running water for over 18 hours before morning classes.',
    TRUE, FALSE, 'Prithavi Narayan Jha', '20263554', 'prithavi@campus.edu',
    'off-2', 'Dr. Sunita Deshmukh', 'Hostel & Mess',
    NOW() + INTERVAL '24 hours', NOW() - INTERVAL '2 hours',
    'Plumbing team replaced the auxiliary pressure relay at 14:30. Water pressure restored across all lines.',
    NOW() - INTERVAL '3 days'
),
(
    'comp-102', 'VP-2026-I4029',
    'Repeated Wi-Fi Dropouts and Non-Functional Power Sockets in Central Library 2nd Floor',
    'Infrastructure', 'High', 'Escalated',
    'During semester exam prep, the southern reading hall Wi-Fi access point drops connections every 7 minutes, and 8 out of 10 desks lack functional earthing.',
    TRUE, TRUE, NULL, NULL, NULL,
    'off-3', 'Er. Rajesh K. Varma', 'Infrastructure',
    NOW() - INTERVAL '12 hours', NULL, NULL,
    NOW() - INTERVAL '5 days'
),
(
    'comp-103', 'VP-2026-A1177',
    'Direct Timetable Clash Between CS304 (Distributed Systems) and EC208 Elective Mid-Term',
    'Academic', 'High', 'In Progress',
    'Both 3rd year core exams are scheduled for 10:00 AM - 12:00 PM on Friday 14th November in the published exam schedule.',
    TRUE, FALSE, 'Yashika Agrawal', '20263579', 'yashika@campus.edu',
    'off-1', 'Prof. Arvind Nambiar', 'Academic',
    NOW() + INTERVAL '36 hours', NULL, NULL,
    NOW() - INTERVAL '2 days'
),
(
    'comp-104', 'VP-2026-F9004',
    'Tuition Fee Payment Deducted but Official Tax Receipt Not Generated for Scholarship',
    'Financial & Fees', 'Medium', 'Resolved',
    'Bank transaction succeeded via SBI gateway (Txn #88294102), but university fee portal displays Unpaid status, blocking state scholarship submission.',
    TRUE, FALSE, 'Ashish Singh', '20263061', 'ashish@campus.edu',
    'off-5', 'Mr. Sanjeev Hegde', 'Financial & Fees',
    NOW() + INTERVAL '48 hours', NOW() - INTERVAL '1 day',
    'Bank reconciliation file processed. Payment acknowledged and Section 80C receipt sent to petitioner email.',
    NOW() - INTERVAL '6 days'
),
(
    'comp-105', 'VP-2026-M5532',
    'Irregular Dinner Timings and Substandard Food Temperature in Dining Hall 2',
    'Hostel & Mess', 'Medium', 'Under Review',
    'Mess contractor closing doors 25 minutes prior to declared schedule and hot buffet counters unpowered.',
    TRUE, TRUE, NULL, NULL, NULL,
    'off-2', 'Dr. Sunita Deshmukh', 'Hostel & Mess',
    NOW() + INTERVAL '72 hours', NULL, NULL,
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (complaint_id) DO NOTHING;

-- ====================================================================
-- SEED 4: CRYPTOGRAPHIC AUDIT LOG (SHA-256 Hash Chain)
-- ====================================================================
INSERT INTO audit_entries (entry_id, complaint_id, action, actor_name, actor_role, details, previous_hash, current_hash) VALUES
('aud-101-1', 'comp-101', 'PETITION_FILED', 'Prithavi Narayan Jha', 'petitioner', 'Grievance submitted under Hostel & Mess with Urgent priority.', '0000000000000000000000000000000000000000000000000000000000000000', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('aud-101-2', 'comp-101', 'OFFICIAL_ASSIGNED', 'Chief Proctor Desk', 'official', 'Assigned to Dr. Sunita Deshmukh (Chief Warden). Status changed to In Progress.', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'),
('aud-101-3', 'comp-101', 'PETITION_RESOLVED', 'Dr. Sunita Deshmukh', 'official', 'Resolved: Plumbing team replaced auxiliary pressure relay. Water pressure restored.', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', 'f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef'),
('aud-102-1', 'comp-102', 'PETITION_FILED', 'Anonymous Petitioner', 'anonymous', 'Grievance submitted under Infrastructure with High priority.', '0000000000000000000000000000000000000000000000000000000000000000', '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'),
('aud-102-2', 'comp-102', 'AUTOMATIC_SLA_ESCALATION', 'SLA Watchdog Engine', 'system', 'Escalated to Dean: 48-hour SLA resolution window elapsed without closure remarks.', '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff', '99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa')
ON CONFLICT (entry_id) DO NOTHING;

-- Verification Check
SELECT count(*) AS total_users FROM users;
SELECT count(*) AS total_complaints FROM complaints;
SELECT count(*) AS total_officials FROM officials;
