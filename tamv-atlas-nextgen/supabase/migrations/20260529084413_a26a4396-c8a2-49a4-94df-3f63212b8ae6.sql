
-- ============ CANON ENTITIES ============
CREATE TABLE public.canon_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id text NOT NULL UNIQUE,
  type text NOT NULL,
  federation text NOT NULL DEFAULT 'unknown',
  title text NOT NULL,
  description text,
  dependencies text[] NOT NULL DEFAULT '{}',
  source_refs text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  hash text NOT NULL,
  canonical boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_canon_entities_federation ON public.canon_entities(federation);
CREATE INDEX idx_canon_entities_type ON public.canon_entities(type);

GRANT SELECT ON public.canon_entities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canon_entities TO authenticated;
GRANT ALL ON public.canon_entities TO service_role;

ALTER TABLE public.canon_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canon_entities_read" ON public.canon_entities FOR SELECT USING (true);
CREATE POLICY "canon_entities_write" ON public.canon_entities FOR ALL TO authenticated
  USING (has_min_role(auth.uid(),'dev'::app_role))
  WITH CHECK (has_min_role(auth.uid(),'dev'::app_role));

CREATE TRIGGER trg_canon_entities_touch BEFORE UPDATE ON public.canon_entities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CANON RELATIONS ============
CREATE TABLE public.canon_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_canonical_id text NOT NULL,
  target_canonical_id text NOT NULL,
  relation_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_canonical_id, target_canonical_id, relation_type)
);
CREATE INDEX idx_canon_relations_src ON public.canon_relations(source_canonical_id);
CREATE INDEX idx_canon_relations_tgt ON public.canon_relations(target_canonical_id);

GRANT SELECT ON public.canon_relations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canon_relations TO authenticated;
GRANT ALL ON public.canon_relations TO service_role;

ALTER TABLE public.canon_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canon_relations_read" ON public.canon_relations FOR SELECT USING (true);
CREATE POLICY "canon_relations_write" ON public.canon_relations FOR ALL TO authenticated
  USING (has_min_role(auth.uid(),'dev'::app_role))
  WITH CHECK (has_min_role(auth.uid(),'dev'::app_role));

-- ============ BOOKPI EVENTS (append-only) ============
CREATE TABLE public.bookpi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_canonical_ids text[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  trace_id text NOT NULL,
  hash text NOT NULL,
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookpi_trace ON public.bookpi_events(trace_id);
CREATE INDEX idx_bookpi_type ON public.bookpi_events(event_type);
CREATE INDEX idx_bookpi_created ON public.bookpi_events(created_at DESC);

GRANT SELECT ON public.bookpi_events TO anon;
GRANT SELECT ON public.bookpi_events TO authenticated;
GRANT ALL ON public.bookpi_events TO service_role;

ALTER TABLE public.bookpi_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookpi_read" ON public.bookpi_events FOR SELECT USING (true);
-- No insert/update/delete via Data API; only edge functions (service_role) can write.

-- ============ INGESTION RUNS ============
CREATE TABLE public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url text NOT NULL,
  federation text,
  status text NOT NULL DEFAULT 'pending',
  trace_id text NOT NULL,
  files_scanned integer NOT NULL DEFAULT 0,
  entities_created integer NOT NULL DEFAULT 0,
  relations_created integer NOT NULL DEFAULT 0,
  error text,
  started_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX idx_ingestion_runs_started ON public.ingestion_runs(started_at DESC);

GRANT SELECT ON public.ingestion_runs TO anon;
GRANT SELECT ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.ingestion_runs TO service_role;

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingestion_runs_read" ON public.ingestion_runs FOR SELECT USING (true);

-- ============ ASSEMBLY ARTIFACTS ============
CREATE TABLE public.assembly_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target text NOT NULL,
  format text NOT NULL DEFAULT 'docker-compose',
  content text NOT NULL,
  hash text NOT NULL,
  trace_id text NOT NULL,
  entity_canonical_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assembly_artifacts TO anon;
GRANT SELECT ON public.assembly_artifacts TO authenticated;
GRANT ALL ON public.assembly_artifacts TO service_role;

ALTER TABLE public.assembly_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assembly_read" ON public.assembly_artifacts FOR SELECT USING (true);
