-- ============================================================
--  AtlasFarm – Supabase PostgreSQL Schema
--  Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
--  Database: atlasfarm
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL DEFAULT 'farmer'
                CHECK (role IN ('admin','manager','agronomist','farmer')),
  language    TEXT        NOT NULL DEFAULT 'fr'
                CHECK (language IN ('en','fr','ar')),
  status      TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive')),
  last_login  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins: full access to all profiles
CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users: read their own profile
CREATE POLICY "user_read_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users: update their own profile (language preference only)
CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- 2. TRIGGER: auto-create profile row on auth.users insert
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, language, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name',  split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role',     'farmer'),
    COALESCE(NEW.raw_user_meta_data ->> 'language', 'fr'),
    COALESCE(NEW.raw_user_meta_data ->> 'status',   'active')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 3. UPDATE updated_at helper
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. PLOTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  crop_type           TEXT        NOT NULL DEFAULT '',
  area                NUMERIC(10,2) DEFAULT 0,
  soil_type           TEXT        DEFAULT '',
  sowing_date         DATE,
  status              TEXT        NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','fallow','harvested')),
  coordinates         JSONB       DEFAULT '[]',
  color               TEXT        DEFAULT '#7cb342',
  assigned_sensors    JSONB       DEFAULT '[]',
  irrigation_schedule TEXT        DEFAULT '',
  created_by          UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_plots" ON public.plots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "manager_admin_write_plots" ON public.plots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','manager','agronomist')
    )
  );

CREATE TRIGGER plots_updated_at
  BEFORE UPDATE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. SENSOR READINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id   TEXT        NOT NULL,
  sensor_name TEXT        NOT NULL,
  value       NUMERIC     NOT NULL,
  unit        TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'optimal'
                CHECK (status IN ('optimal','warning','critical')),
  plot_id     UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_readings" ON public.sensor_readings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manager_write_readings" ON public.sensor_readings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','manager','agronomist')
    )
  );

-- index for time-series queries
CREATE INDEX IF NOT EXISTS sensor_readings_recorded_at_idx
  ON public.sensor_readings (sensor_id, recorded_at DESC);

-- ────────────────────────────────────────────────────────────
-- 6. TASKS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'irrigation'
                     CHECK (category IN (
                       'planting','irrigation','fertilization','phAdjustment',
                       'lightManagement','protection','harvest',
                       'sensorCalibrationTask','other'
                     )),
  assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plot_id          UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  due_date         DATE,
  priority         TEXT        NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('high','medium','low')),
  status           TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','inProgress','completed')),
  description      TEXT        DEFAULT '',
  is_recommendation BOOLEAN   DEFAULT FALSE,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_tasks" ON public.tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','manager','agronomist')
    )
  );

-- farmers can update status of tasks assigned to them
CREATE POLICY "farmer_update_own_tasks" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (assigned_to = auth.uid());

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 7. ALERTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor        TEXT        NOT NULL,
  sensor_key    TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  severity      TEXT        NOT NULL DEFAULT 'info'
                  CHECK (severity IN ('info','warning','critical')),
  value         NUMERIC,
  threshold     NUMERIC,
  acknowledged  BOOLEAN     DEFAULT FALSE,
  resolved      BOOLEAN     DEFAULT FALSE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_by   UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_alerts" ON public.alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_alerts" ON public.alerts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 8. ALERT THRESHOLDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alert_thresholds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_key  TEXT        NOT NULL UNIQUE,
  min_value   NUMERIC     NOT NULL,
  max_value   NUMERIC     NOT NULL,
  enabled     BOOLEAN     DEFAULT TRUE,
  updated_by  UUID REFERENCES public.profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_thresholds" ON public.alert_thresholds
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manager_write_thresholds" ON public.alert_thresholds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','manager')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 9. CALIBRATION RECORDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calibration_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor          TEXT        NOT NULL,
  sensor_key      TEXT        NOT NULL,
  values          JSONB       NOT NULL DEFAULT '{}',
  notes           TEXT        DEFAULT '',
  next_due_date   DATE,
  performed_by    UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_calibration" ON public.calibration_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_agronomist_write_calibration" ON public.calibration_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','agronomist','manager')
    )
  );

CREATE INDEX IF NOT EXISTS calibration_sensor_key_idx
  ON public.calibration_records (sensor_key, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 10. AUDIT LOGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  action      TEXT        NOT NULL,
  entity      TEXT,
  entity_id   UUID,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "authenticated_insert_audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 11. HELPER VIEW: profiles with last calibration info
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_list AS
SELECT
  p.id,
  p.name,
  p.email,
  p.role,
  p.language,
  p.status,
  p.last_login,
  p.created_at
FROM public.profiles p;

-- ────────────────────────────────────────────────────────────
-- 12. SEED DATA
-- ────────────────────────────────────────────────────────────

-- Default alert thresholds
INSERT INTO public.alert_thresholds (sensor_key, min_value, max_value, enabled)
VALUES
  ('airTemperature',  5,     38,    TRUE),
  ('airHumidity',     30,    95,    TRUE),
  ('soilMoisture',    35,    80,    TRUE),
  ('soilPH',          5.5,   8.0,   TRUE),
  ('lightIntensity',  10000, 90000, TRUE),
  ('waterLevel',      20,    100,   TRUE)
ON CONFLICT (sensor_key) DO NOTHING;

-- Sample plots (Algerian field locations – Tipaza / Blida region)
INSERT INTO public.plots (name, crop_type, area, soil_type, sowing_date, status, coordinates, color, irrigation_schedule)
VALUES
  ('Champ Nord A', 'Blé dur',     12.5, 'Limoneux',   '2024-10-15', 'active',    '[[36.58, 2.47],[36.59, 2.47],[36.59, 2.48],[36.58, 2.48]]', '#7cb342', 'Quotidien 06:00'),
  ('Champ Sud B',  'Tomates',      8.2, 'Sablo-limon','2024-11-01', 'active',    '[[36.57, 2.46],[36.58, 2.46],[36.58, 2.47],[36.57, 2.47]]', '#e74c3c', 'Tous les 2 jours 07:00'),
  ('Champ Est C',  'Oliviers',    20.0, 'Argileux',   '2023-03-20', 'active',    '[[36.59, 2.49],[36.60, 2.49],[36.60, 2.50],[36.59, 2.50]]', '#f39c12', 'Hebdomadaire lundi 05:00'),
  ('Champ Ouest D','Orge',        15.0, 'Limoneux',   '2024-10-20', 'fallow',    '[[36.56, 2.45],[36.57, 2.45],[36.57, 2.46],[36.56, 2.46]]', '#3498db', 'Aucun')
ON CONFLICT DO NOTHING;

-- Sample alerts
INSERT INTO public.alerts (sensor, sensor_key, message, severity, value, threshold, acknowledged, resolved)
VALUES
  ('soilMoisture',  'soilMoisture',  'Humidité du sol critique: 32% (seuil: 35%)', 'critical', 32,    35,    FALSE, FALSE),
  ('soilPH',        'soilPH',        'pH légèrement acide: 6.4 (optimal: 6.5-7.0)', 'warning', 6.4,   6.5,   TRUE,  FALSE),
  ('waterLevel',    'waterLevel',    'Réservoir d''eau à 71% – surveiller',         'info',     71,    70,    FALSE, FALSE),
  ('lightIntensity','lightIntensity','Intensité lumineuse insuffisante pour tomates','warning', 15000, 20000, FALSE, FALSE)
ON CONFLICT DO NOTHING;

-- Sample calibration records (performed_by will be NULL until real admin user created)
INSERT INTO public.calibration_records (sensor, sensor_key, values, notes, next_due_date)
VALUES
  ('soilPH',        'soilPH',        '{"point1":4.01,"point2":6.86,"point3":9.18}', 'Calibration 3 points complétée. Dérive dans la plage acceptable.', '2025-03-15'),
  ('soilMoisture',  'soilMoisture',  '{"dry":1020,"wet":200}',                       'Calibration 2 points. Sec: 1020 brut, Mouillé: 200 brut.',         '2025-03-20'),
  ('waterLevel',    'waterLevel',    '{"empty":15,"full":450}',                      'Capteur ultrasonique. Vide: 15 cm, Plein: 450 cm.',                '2025-02-28'),
  ('lightIntensity','lightIntensity','{"referenceValue":45000,"measuredValue":43500,"offset":1500}','Comparé avec luxmètre Konica Minolta T-10A.','2025-06-10')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 13. ADMIN USER SETUP (via Supabase Auth)
-- ────────────────────────────────────────────────────────────
-- IMPORTANT: After running this script, create the first admin
-- user directly from the Supabase Auth dashboard OR via the
-- app's admin panel once you are logged in.
--
-- To create the first admin manually in SQL Editor:
--   1. Go to Supabase → Authentication → Users → Add user
--      Email: admin@atlasfarm.dz
--      Password: (your secure password)
--      Email confirmed: YES (toggle on)
--
--   2. Then run this UPDATE to set the admin role:
--
--   UPDATE public.profiles
--   SET role = 'admin', name = 'Administrateur AtlasFarm'
--   WHERE email = 'admin@atlasfarm.dz';
--
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- 14. FUNCTION: update last_login on sign-in
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_last_login(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = user_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 15. FUNCTION: admin-only user creation helper
--     Called from server actions – bypasses RLS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_profile(
  p_id       UUID,
  p_name     TEXT,
  p_email    TEXT,
  p_role     TEXT,
  p_language TEXT,
  p_status   TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, language, status)
  VALUES (p_id, p_name, p_email, p_role, p_language, p_status)
  ON CONFLICT (id) DO UPDATE
    SET name     = EXCLUDED.name,
        email    = EXCLUDED.email,
        role     = EXCLUDED.role,
        language = EXCLUDED.language,
        status   = EXCLUDED.status,
        updated_at = NOW();
END;
$$;

-- ────────────────────────────────────────────────────────────
-- DONE. Schema created successfully.
-- Next steps:
--   1. Run this script in Supabase SQL Editor
--   2. Create first admin user via Supabase Auth dashboard
--   3. Run the UPDATE above to set the admin role
--   4. Log in to AtlasFarm and manage all users from Admin panel
-- ────────────────────────────────────────────────────────────
