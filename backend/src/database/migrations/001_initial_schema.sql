-- ============================================================
-- Civic Reporting App — Initial Schema Migration
-- PostgreSQL + PostGIS
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('citizen', 'admin', 'government_officer', 'ngo');
CREATE TYPE auth_provider AS ENUM ('local', 'google');
CREATE TYPE report_status AS ENUM ('submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected');
CREATE TYPE report_category AS ENUM (
  'pothole', 'drainage', 'illegal_dumping', 'traffic_light',
  'water_leakage', 'power_outage', 'environmental_hazard',
  'security', 'corruption', 'other'
);
CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE notification_type AS ENUM (
  'report_submitted', 'report_verified', 'report_assigned',
  'report_in_progress', 'report_resolved', 'report_rejected',
  'comment_added', 'system'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  role          user_role NOT NULL DEFAULT 'citizen',
  password      VARCHAR(255),
  provider      auth_provider NOT NULL DEFAULT 'local',
  provider_id   VARCHAR(255),
  avatar        VARCHAR(500),
  fcm_token     VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token     VARCHAR(255),
  password_reset_expires   TIMESTAMP,
  refresh_token  TEXT,
  language       VARCHAR(10) DEFAULT 'en',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL UNIQUE,
  description     TEXT,
  contact_email   VARCHAR(255),
  contact_phone   VARCHAR(20),
  head_name       VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(200) NOT NULL,
  description      TEXT NOT NULL,
  category         report_category NOT NULL,
  status           report_status NOT NULL DEFAULT 'submitted',
  priority         report_priority NOT NULL DEFAULT 'medium',
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),
  location         GEOGRAPHY(POINT, 4326),
  address          VARCHAR(500),
  landmark         VARCHAR(255),
  city             VARCHAR(100),
  state            VARCHAR(100),
  is_anonymous     BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes          INTEGER NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  resolved_at      TIMESTAMP,
  resolution_note  TEXT,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status    ON reports(status);
CREATE INDEX idx_reports_category  ON reports(category);
CREATE INDEX idx_reports_user_id   ON reports(user_id);
CREATE INDEX idx_reports_created   ON reports(created_at DESC);
CREATE INDEX idx_reports_location  ON reports USING GIST(location);
CREATE INDEX idx_reports_title_trgm ON reports USING GIN(title gin_trgm_ops);

-- Auto-populate PostGIS point from lat/lng
CREATE OR REPLACE FUNCTION update_report_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_location
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_report_location();

-- ============================================================
-- MEDIA
-- ============================================================

CREATE TABLE media (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url        VARCHAR(1000) NOT NULL,
  thumbnail_url   VARCHAR(1000),
  type            media_type NOT NULL DEFAULT 'image',
  mime_type       VARCHAR(100),
  original_name   VARCHAR(255),
  file_size       BIGINT,
  s3_key          VARCHAR(500),
  report_id       UUID REFERENCES reports(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_report_id ON media(report_id);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_report_id ON comments(report_id);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================

CREATE TABLE assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  department_id   UUID NOT NULL REFERENCES departments(id),
  assigned_to     UUID REFERENCES users(id),
  assigned_by     UUID REFERENCES users(id),
  notes           TEXT,
  due_date        TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_report_id     ON assignments(report_id);
CREATE INDEX idx_assignments_department_id ON assignments(department_id);
CREATE INDEX idx_assignments_assigned_to   ON assignments(assigned_to);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  type            notification_type NOT NULL DEFAULT 'system',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id    UUID,
  reference_type  VARCHAR(50),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(is_read);

-- ============================================================
-- SEED: Default Admin + Departments
-- ============================================================

INSERT INTO users (id, name, email, role, password, is_active, is_email_verified)
VALUES (
  uuid_generate_v4(),
  'System Admin',
  'admin@civicreport.ng',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgSJq1Kv1.OgmkVTiLk9bm', -- password: Admin@1234
  TRUE,
  TRUE
);

INSERT INTO departments (name, description, contact_email) VALUES
  ('Roads & Infrastructure', 'Handles potholes, road damage, and traffic lights', 'roads@govt.ng'),
  ('Water & Sanitation', 'Manages water leakage, drainage and sanitation issues', 'water@govt.ng'),
  ('Environment & Waste', 'Handles illegal dumping and environmental hazards', 'environment@govt.ng'),
  ('Power & Utilities', 'Manages power outages and utility issues', 'power@govt.ng'),
  ('Public Safety', 'Handles security concerns and public safety', 'safety@govt.ng'),
  ('Anti-Corruption Unit', 'Investigates corruption reports', 'corruption@govt.ng');
