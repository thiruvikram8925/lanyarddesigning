-- Migration Script for GOTEK ID Card System Database
-- Upgrades schema and populates/updates user account permissions

-- 1. Ensure columns exist on `users` table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'PREMIUM';
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_level VARCHAR(100) DEFAULT 'Full Access';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_id VARCHAR(100) DEFAULT NULL;

-- 2. Ensure columns exist on `projects` table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'data_collected';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_stages LONGTEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignedTo VARCHAR(100) DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignedToName VARCHAR(255) DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_state LONGTEXT DEFAULT NULL;

-- 3. Upsert User Accounts (sample2, Sam, Sam John, sam1, Super Admin, IT Support)
INSERT INTO users (id, name, email, password, role, organization, status, plan, access_level, created_at)
VALUES 
  ('1', 'Technosprint Info Solutions', 'itsupport@technosprint.net', 'Poland@01', 'ultra-super-admin', 'Technosprint Info Solutions', 'Active', 'PREMIUM', 'Full Access', NOW()),
  ('dd055e0a-6941-4ab5-a30e-e148438cfdcf', 'Super Admin', 'admin@gotek.com', 'admin123', 'super-admin', 'GOTEK', 'Active', 'PREMIUM', 'Full Access', NOW()),
  ('69d602c23fe66f52321c75e5', 'sample2', 'sub1@gmail.com', 'sub11234', 'admin', 'GOTEK', 'Active', 'PREMIUM', 'Full Access', NOW()),
  ('69d6083e7451798af0524827', 'Sam', 'user1@gmail.com', 'user123', 'user', 'GOTEK', 'Active', 'PREMIUM', 'Full Access', NOW()),
  ('69d61f2f65b486ff25820c2f', 'Sam John', 'user2@gmail.com', 'user123', 'user', 'AVRS', 'Active', 'PREMIUM', 'Full Access', NOW()),
  ('9a9ff277-88f2-47c1-975a-45054ed501d3', 'sam1', 'sam2@gmail.com', 'bank@123', 'user', 'IDFC First Bharat Bank', 'Active', 'PREMIUM', 'Full Access', NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  role = VALUES(role),
  organization = VALUES(organization),
  status = VALUES(status),
  plan = VALUES(plan),
  access_level = VALUES(access_level);
