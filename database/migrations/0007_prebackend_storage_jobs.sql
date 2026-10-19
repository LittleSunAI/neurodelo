BEGIN;

CREATE TABLE app.stored_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('avatar','project','chat','attachment','document')),
  original_name text NOT NULL,
  safe_name text NOT NULL,
  object_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 char(64) NOT NULL,
  status text NOT NULL CHECK (status IN ('quarantined','approved','rejected')),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  scan_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX idx_stored_files_owner_created ON app.stored_files(owner_account_id, created_at DESC);
CREATE INDEX idx_stored_files_status ON app.stored_files(status, updated_at);
CREATE UNIQUE INDEX idx_stored_files_owner_hash_active ON app.stored_files(owner_account_id, sha256) WHERE status <> 'rejected';

CREATE TABLE app.data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  format text NOT NULL DEFAULT 'neurodelo-portable-data',
  format_version integer NOT NULL DEFAULT 1,
  checksum char(64) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  status text NOT NULL CHECK (status IN ('created','downloaded','expired','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  downloaded_at timestamptz
);
CREATE INDEX idx_data_exports_account_created ON app.data_exports(account_id, created_at DESC);

CREATE TABLE app.background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  deduplication_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  locked_by text,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX idx_background_jobs_claim ON app.background_jobs(status, available_at) WHERE status = 'queued';
CREATE UNIQUE INDEX idx_background_jobs_dedup_active ON app.background_jobs(job_type, deduplication_key)
  WHERE deduplication_key IS NOT NULL AND status IN ('queued','processing','completed');

CREATE TABLE app.provider_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('github','resend','fal')),
  event_key text NOT NULL,
  event_type text NOT NULL,
  payload_sha256 char(64) NOT NULL,
  signature_valid boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('received','processing','processed','rejected','failed')),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text,
  UNIQUE(provider, event_key)
);
CREATE INDEX idx_provider_webhook_status ON app.provider_webhook_events(provider, status, received_at);

ALTER TABLE app.stored_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY stored_files_owner_select ON app.stored_files
  FOR SELECT USING (owner_account_id = app.current_account_id());
CREATE POLICY stored_files_owner_insert ON app.stored_files
  FOR INSERT WITH CHECK (owner_account_id = app.current_account_id());
CREATE POLICY stored_files_owner_delete ON app.stored_files
  FOR DELETE USING (owner_account_id = app.current_account_id());
CREATE POLICY data_exports_owner_all ON app.data_exports
  FOR ALL USING (account_id = app.current_account_id()) WITH CHECK (account_id = app.current_account_id());

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0007_prebackend_storage_jobs', 'prebackend-0007')
ON CONFLICT (version) DO NOTHING;

COMMIT;
