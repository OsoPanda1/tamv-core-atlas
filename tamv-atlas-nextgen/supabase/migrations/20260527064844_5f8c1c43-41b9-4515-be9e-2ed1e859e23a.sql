
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ciudadano','dev','empresario','academia','gobierno','admin');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT, avatar_url TEXT, bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id);
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id=_user_id AND (
      CASE ur.role WHEN 'ciudadano' THEN 0 WHEN 'dev' THEN 1 WHEN 'empresario' THEN 2
        WHEN 'academia' THEN 3 WHEN 'gobierno' THEN 4 WHEN 'admin' THEN 5 END
    ) >= (
      CASE _min WHEN 'ciudadano' THEN 0 WHEN 'dev' THEN 1 WHEN 'empresario' THEN 2
        WHEN 'academia' THEN 3 WHEN 'gobierno' THEN 4 WHEN 'admin' THEN 5 END
    )
  )
$$;
DROP POLICY IF EXISTS "user_roles_select_self" ON public.user_roles;
CREATE POLICY "user_roles_select_self" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'ciudadano')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.isni_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isni TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','organization','territory','project')),
  display_name TEXT NOT NULL,
  identifiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  trust_score NUMERIC(4,3) NOT NULL DEFAULT 0.500,
  is_public BOOLEAN NOT NULL DEFAULT true,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.isni_entities TO authenticated;
GRANT SELECT ON public.isni_entities TO anon;
GRANT ALL ON public.isni_entities TO service_role;
ALTER TABLE public.isni_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isni_entities_select" ON public.isni_entities;
CREATE POLICY "isni_entities_select" ON public.isni_entities FOR SELECT
  USING (is_public = true OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "isni_entities_insert" ON public.isni_entities;
CREATE POLICY "isni_entities_insert" ON public.isni_entities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "isni_entities_update" ON public.isni_entities;
CREATE POLICY "isni_entities_update" ON public.isni_entities FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "isni_entities_delete" ON public.isni_entities;
CREATE POLICY "isni_entities_delete" ON public.isni_entities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_isni_entities_updated_at ON public.isni_entities;
CREATE TRIGGER trg_isni_entities_updated_at BEFORE UPDATE ON public.isni_entities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.isni_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_id TEXT UNIQUE NOT NULL,
  holder_entity_id UUID NOT NULL REFERENCES public.isni_entities(id) ON DELETE CASCADE,
  issuer_did TEXT NOT NULL,
  vc_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.isni_credentials TO authenticated;
GRANT SELECT ON public.isni_credentials TO anon;
GRANT ALL ON public.isni_credentials TO service_role;
ALTER TABLE public.isni_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isni_credentials_select" ON public.isni_credentials;
CREATE POLICY "isni_credentials_select" ON public.isni_credentials FOR SELECT USING (true);
DROP POLICY IF EXISTS "isni_credentials_admin" ON public.isni_credentials;
CREATE POLICY "isni_credentials_admin" ON public.isni_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.mdx_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT UNIQUE NOT NULL,
  federation TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '0.1.0',
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','degraded','down','maintenance')),
  description TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mdx_modules TO authenticated;
GRANT SELECT ON public.mdx_modules TO anon;
GRANT ALL ON public.mdx_modules TO service_role;
ALTER TABLE public.mdx_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mdx_modules_select" ON public.mdx_modules;
CREATE POLICY "mdx_modules_select" ON public.mdx_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "mdx_modules_insert" ON public.mdx_modules;
CREATE POLICY "mdx_modules_insert" ON public.mdx_modules FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(),'dev'));
DROP POLICY IF EXISTS "mdx_modules_update" ON public.mdx_modules;
CREATE POLICY "mdx_modules_update" ON public.mdx_modules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "mdx_modules_delete" ON public.mdx_modules;
CREATE POLICY "mdx_modules_delete" ON public.mdx_modules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_mdx_modules_updated_at ON public.mdx_modules;
CREATE TRIGGER trg_mdx_modules_updated_at BEFORE UPDATE ON public.mdx_modules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.mdx_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL, action TEXT NOT NULL, actor_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mdx_audit_log TO authenticated;
GRANT ALL ON public.mdx_audit_log TO service_role;
ALTER TABLE public.mdx_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mdx_audit_admin_select" ON public.mdx_audit_log;
CREATE POLICY "mdx_audit_admin_select" ON public.mdx_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.utamv_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, title TEXT NOT NULL, summary TEXT,
  level TEXT NOT NULL DEFAULT 'foundations' CHECK (level IN ('foundations','intermediate','advanced','mastery')),
  credits INT NOT NULL DEFAULT 1,
  syllabus JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utamv_courses TO authenticated;
GRANT SELECT ON public.utamv_courses TO anon;
GRANT ALL ON public.utamv_courses TO service_role;
ALTER TABLE public.utamv_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "utamv_courses_select" ON public.utamv_courses;
CREATE POLICY "utamv_courses_select" ON public.utamv_courses FOR SELECT
  USING (is_published = true OR public.has_min_role(auth.uid(),'academia'));
DROP POLICY IF EXISTS "utamv_courses_manage" ON public.utamv_courses;
CREATE POLICY "utamv_courses_manage" ON public.utamv_courses FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(),'academia'))
  WITH CHECK (public.has_min_role(auth.uid(),'academia'));
DROP TRIGGER IF EXISTS trg_utamv_courses_updated_at ON public.utamv_courses;
CREATE TRIGGER trg_utamv_courses_updated_at BEFORE UPDATE ON public.utamv_courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.utamv_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.utamv_courses(id) ON DELETE CASCADE,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utamv_enrollments TO authenticated;
GRANT ALL ON public.utamv_enrollments TO service_role;
ALTER TABLE public.utamv_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "utamv_enrollments_select" ON public.utamv_enrollments;
CREATE POLICY "utamv_enrollments_select" ON public.utamv_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_min_role(auth.uid(),'academia'));
DROP POLICY IF EXISTS "utamv_enrollments_insert" ON public.utamv_enrollments;
CREATE POLICY "utamv_enrollments_insert" ON public.utamv_enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "utamv_enrollments_update" ON public.utamv_enrollments;
CREATE POLICY "utamv_enrollments_update" ON public.utamv_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "utamv_enrollments_delete" ON public.utamv_enrollments;
CREATE POLICY "utamv_enrollments_delete" ON public.utamv_enrollments FOR DELETE TO authenticated
  USING (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_utamv_enrollments_updated_at ON public.utamv_enrollments;
CREATE TRIGGER trg_utamv_enrollments_updated_at BEFORE UPDATE ON public.utamv_enrollments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.mdx_modules (module_code, federation, name, version, status, description) VALUES
  ('DM-X4-01-ISNI','FED-01','ISNI Identity Core','4.1.0','healthy','Sovereign identity registry and resolver'),
  ('DM-X4-02-CRED','FED-01','Credential Issuer','4.0.2','healthy','Verifiable credentials issuance and verification'),
  ('DM-X4-03-AI','FED-03','Isabella Reasoning','4.2.0','healthy','Ethical mediator and cognitive security'),
  ('DM-X4-04-UTAMV','FED-04','UTAMV Campus','4.0.0','healthy','Academic campus and credentialing'),
  ('DM-X4-05-RDM','FED-05','RDM Territorial Twin','4.0.1','healthy','Smart destinations and XR territory'),
  ('DM-X4-06-BOOKPI','FED-06','BookPI Ledger','4.0.0','healthy','Evidence and dignity ledger'),
  ('DM-X4-07-INFRA','FED-02','MD-X Kernel Runtime','5.0.0-rc1','healthy','Hexagonal pipeline and observability')
ON CONFLICT (module_code) DO NOTHING;

INSERT INTO public.utamv_courses (code, title, summary, level, credits) VALUES
  ('UTAMV-101','Fundamentos de Soberanía Digital','Identidad ISNI, PIDs y DIDs','foundations',3),
  ('UTAMV-201','Kernel MD-X y Arquitectura Hexagonal','Operación y observabilidad del kernel','intermediate',4),
  ('UTAMV-301','Credenciales Verificables y JSON-LD','Emisión, firma y verificación','advanced',4),
  ('UTAMV-401','Ética Computacional con Isabella','Mediación ética y seguridad cognitiva','mastery',5)
ON CONFLICT (code) DO NOTHING;
