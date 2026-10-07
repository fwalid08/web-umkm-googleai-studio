-- Migration: HRM Core (hrm_ tables)
-- HRM core: employees, attendance, shifts

CREATE TABLE IF NOT EXISTS hrm_employees(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  salary INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  hired_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hrm_shifts(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{monday,tuesday,wednesday,thursday,friday}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hrm_attendance(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES hrm_shifts(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','leave','half_day')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hrm_employees_user ON hrm_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_status ON hrm_employees(status);
CREATE INDEX IF NOT EXISTS idx_hrm_shifts_user ON hrm_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_employee ON hrm_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_date ON hrm_attendance(date);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_status ON hrm_attendance(status);

ALTER TABLE hrm_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY hrm_employees_owner_all ON hrm_employees
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY hrm_shifts_owner_all ON hrm_shifts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY hrm_attendance_owner_all ON hrm_attendance
  FOR ALL USING (
    employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid())
  );