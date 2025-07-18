-- Migrasi Database dari bb_society_db ke Supabase
-- Generated on 2025-07-08T12:36:04.228Z

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: lessons
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER NOT NULL DEFAULT nextval('lessons_id_seq'::regclass),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  materials TEXT,
  target_grade VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER NOT NULL DEFAULT nextval('permissions_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: schools
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER NOT NULL DEFAULT nextval('schools_id_seq'::regclass),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: teachers
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER NOT NULL DEFAULT nextval('teachers_id_seq'::regclass),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER NOT NULL DEFAULT nextval('accounts_id_seq'::regclass),
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  balance NUMERIC DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER NOT NULL DEFAULT nextval('activity_logs_id_seq'::regclass),
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: cash_flow_categories
CREATE TABLE IF NOT EXISTS cash_flow_categories (
  id INTEGER NOT NULL DEFAULT nextval('cash_flow_categories_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: schedules
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER NOT NULL DEFAULT nextval('schedules_id_seq'::regclass),
  school_id INTEGER,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled'::character varying,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: students
CREATE TABLE IF NOT EXISTS students (
  id INTEGER NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  school_id INTEGER,
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  age INTEGER,
  phone VARCHAR(50),
  email VARCHAR(255),
  enrollment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: cash_flow
CREATE TABLE IF NOT EXISTS cash_flow (
  id INTEGER NOT NULL DEFAULT nextval('cash_flow_id_seq'::regclass),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount NUMERIC NOT NULL,
  account VARCHAR(100) NOT NULL,
  source VARCHAR(200),
  school_id INTEGER,
  payment_method VARCHAR(50) DEFAULT 'cash'::character varying,
  attachment_url TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'confirmed'::character varying,
  recorded_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evidence_filename VARCHAR(255),
  evidence_size INTEGER,
  evidence_type VARCHAR(100),
  PRIMARY KEY (id)
);

-- Table: lesson_teachers
CREATE TABLE IF NOT EXISTS lesson_teachers (
  id INTEGER NOT NULL DEFAULT nextval('lesson_teachers_id_seq'::regclass),
  lesson_id INTEGER,
  teacher_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER NOT NULL DEFAULT nextval('role_permissions_id_seq'::regclass),
  role_id INTEGER,
  permission_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: schedule_lessons
CREATE TABLE IF NOT EXISTS schedule_lessons (
  id INTEGER NOT NULL DEFAULT nextval('schedule_lessons_id_seq'::regclass),
  schedule_id INTEGER,
  lesson_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: schedule_teachers
CREATE TABLE IF NOT EXISTS schedule_teachers (
  id INTEGER NOT NULL DEFAULT nextval('schedule_teachers_id_seq'::regclass),
  schedule_id INTEGER,
  teacher_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: student_attendance
CREATE TABLE IF NOT EXISTS student_attendance (
  id INTEGER NOT NULL DEFAULT nextval('student_attendance_id_seq'::regclass),
  schedule_id INTEGER,
  student_id INTEGER,
  attendance_status VARCHAR(20) DEFAULT 'present'::character varying,
  knowledge_score INTEGER,
  participation_score INTEGER,
  personal_development_level INTEGER,
  critical_thinking_level INTEGER,
  team_work_level INTEGER,
  academic_knowledge_level INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: student_teachers
CREATE TABLE IF NOT EXISTS student_teachers (
  id INTEGER NOT NULL DEFAULT nextval('student_teachers_id_seq'::regclass),
  student_id INTEGER,
  teacher_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: teacher_schools
CREATE TABLE IF NOT EXISTS teacher_schools (
  id INTEGER NOT NULL DEFAULT nextval('teacher_schools_id_seq'::regclass),
  teacher_id INTEGER,
  school_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'guest'::character varying,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role_id INTEGER,
  PRIMARY KEY (id)
);

-- Foreign Key Constraints
ALTER TABLE IF EXISTS cash_flow
  ADD CONSTRAINT fk_cash_flow_school_id_schools
  FOREIGN KEY (school_id) 
  REFERENCES schools(id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;
ALTER TABLE IF EXISTS lesson_teachers
  ADD CONSTRAINT fk_lesson_teachers_teacher_id_teachers
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS lesson_teachers
  ADD CONSTRAINT fk_lesson_teachers_lesson_id_lessons
  FOREIGN KEY (lesson_id) 
  REFERENCES lessons(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS role_permissions
  ADD CONSTRAINT fk_role_permissions_role_id_roles
  FOREIGN KEY (role_id) 
  REFERENCES roles(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS role_permissions
  ADD CONSTRAINT fk_role_permissions_permission_id_permissions
  FOREIGN KEY (permission_id) 
  REFERENCES permissions(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS schedule_lessons
  ADD CONSTRAINT fk_schedule_lessons_schedule_id_schedules
  FOREIGN KEY (schedule_id) 
  REFERENCES schedules(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS schedule_lessons
  ADD CONSTRAINT fk_schedule_lessons_lesson_id_lessons
  FOREIGN KEY (lesson_id) 
  REFERENCES lessons(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS schedule_teachers
  ADD CONSTRAINT fk_schedule_teachers_schedule_id_schedules
  FOREIGN KEY (schedule_id) 
  REFERENCES schedules(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS schedule_teachers
  ADD CONSTRAINT fk_schedule_teachers_teacher_id_teachers
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS schedules
  ADD CONSTRAINT fk_schedules_school_id_schools
  FOREIGN KEY (school_id) 
  REFERENCES schools(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS student_attendance
  ADD CONSTRAINT fk_student_attendance_student_id_students
  FOREIGN KEY (student_id) 
  REFERENCES students(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS student_attendance
  ADD CONSTRAINT fk_student_attendance_schedule_id_schedules
  FOREIGN KEY (schedule_id) 
  REFERENCES schedules(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS student_teachers
  ADD CONSTRAINT fk_student_teachers_teacher_id_teachers
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS student_teachers
  ADD CONSTRAINT fk_student_teachers_student_id_students
  FOREIGN KEY (student_id) 
  REFERENCES students(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS students
  ADD CONSTRAINT fk_students_school_id_schools
  FOREIGN KEY (school_id) 
  REFERENCES schools(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS teacher_schools
  ADD CONSTRAINT fk_teacher_schools_teacher_id_teachers
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS teacher_schools
  ADD CONSTRAINT fk_teacher_schools_school_id_schools
  FOREIGN KEY (school_id) 
  REFERENCES schools(id)
  ON UPDATE NO ACTION
  ON DELETE CASCADE;
ALTER TABLE IF EXISTS users
  ADD CONSTRAINT fk_users_role_id_roles
  FOREIGN KEY (role_id) 
  REFERENCES roles(id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

-- Indexes (excluding PK and constraint indexes)
CREATE UNIQUE INDEX accounts_account_name_key ON public.accounts USING btree (account_name);
CREATE INDEX idx_activity_logs_action ON public.activity_logs USING btree (action);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at);
CREATE INDEX idx_activity_logs_session_id ON public.activity_logs USING btree (session_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);
CREATE INDEX idx_activity_logs_user_role ON public.activity_logs USING btree (user_role);
CREATE UNIQUE INDEX cash_flow_reference_number_key ON public.cash_flow USING btree (reference_number);
CREATE INDEX idx_cash_flow_account ON public.cash_flow USING btree (account);
CREATE INDEX idx_cash_flow_category ON public.cash_flow USING btree (category);
CREATE INDEX idx_cash_flow_date ON public.cash_flow USING btree (transaction_date);
CREATE INDEX idx_cash_flow_school ON public.cash_flow USING btree (school_id);
CREATE INDEX idx_cash_flow_type ON public.cash_flow USING btree (transaction_type);
CREATE UNIQUE INDEX cash_flow_categories_name_key ON public.cash_flow_categories USING btree (name);
CREATE UNIQUE INDEX lesson_teachers_lesson_id_teacher_id_key ON public.lesson_teachers USING btree (lesson_id, teacher_id);
CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);
CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);
CREATE UNIQUE INDEX schedule_lessons_schedule_id_lesson_id_key ON public.schedule_lessons USING btree (schedule_id, lesson_id);
CREATE UNIQUE INDEX schedule_teachers_schedule_id_teacher_id_key ON public.schedule_teachers USING btree (schedule_id, teacher_id);
CREATE UNIQUE INDEX schools_name_unique ON public.schools USING btree (name);
CREATE UNIQUE INDEX student_attendance_schedule_id_student_id_key ON public.student_attendance USING btree (schedule_id, student_id);
CREATE UNIQUE INDEX student_teachers_student_id_teacher_id_key ON public.student_teachers USING btree (student_id, teacher_id);
CREATE UNIQUE INDEX teacher_schools_teacher_id_school_id_key ON public.teacher_schools USING btree (teacher_id, school_id);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);