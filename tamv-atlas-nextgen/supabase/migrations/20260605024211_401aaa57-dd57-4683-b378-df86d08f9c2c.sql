
ALTER TABLE public.canon_entities
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_hash text;

ALTER TABLE public.ingestion_runs
  ADD COLUMN IF NOT EXISTS batch_id uuid,
  ADD COLUMN IF NOT EXISTS retries int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS skipped int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ingestion_runs_batch_idx ON public.ingestion_runs(batch_id);
CREATE INDEX IF NOT EXISTS ingestion_runs_status_idx ON public.ingestion_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS public.entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id text NOT NULL,
  version int NOT NULL,
  hash text NOT NULL,
  previous_hash text,
  title text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}',
  changed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_id, version)
);

GRANT SELECT ON public.entity_versions TO authenticated, anon;
GRANT ALL ON public.entity_versions TO service_role;

ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_versions_read" ON public.entity_versions
  FOR SELECT USING (true);
