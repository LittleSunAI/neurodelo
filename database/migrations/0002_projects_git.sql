BEGIN;

CREATE TABLE app.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug citext NOT NULL UNIQUE,
  owner_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE RESTRICT,
  title text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  license text NOT NULL CHECK (license IN ('MIT','Apache-2.0','GPL-3.0','MPL-2.0')),
  stage text NOT NULL DEFAULT 'Идея' CHECK (stage IN ('Идея','Прототип','MVP','Развитие')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  repository_url text,
  default_branch text NOT NULL DEFAULT 'main',
  stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  needs jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  beginner_friendly boolean NOT NULL DEFAULT false,
  contribution_guide text NOT NULL DEFAULT '',
  code_of_conduct text NOT NULL DEFAULT '',
  readme text NOT NULL DEFAULT '',
  xp_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz
);

CREATE TABLE app.project_members (
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('owner','maintainer','reviewer','contributor','mentor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','review','paused','left')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (project_id, account_id)
);

CREATE TABLE app.project_subscriptions (
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, account_id)
);

CREATE TABLE app.project_roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'planned' CHECK (state IN ('planned','active','done')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_version text NOT NULL DEFAULT '',
  due_at date,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.project_role_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  profession_id text REFERENCES app.professions(id),
  min_level integer NOT NULL DEFAULT 1 CHECK (min_level BETWEEN 1 AND 100),
  slots integer NOT NULL DEFAULT 1 CHECK (slots > 0),
  filled integer NOT NULL DEFAULT 0 CHECK (filled >= 0),
  summary text NOT NULL DEFAULT '',
  mentor_available boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL,
  contribution_kind text NOT NULL CHECK (contribution_kind IN ('Код','Документация','Дизайн','Тестирование','Исследование')),
  difficulty text NOT NULL CHECK (difficulty IN ('Начальная','Средняя','Высокая')),
  reward_xp integer NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
  estimated_minutes integer,
  required_level integer NOT NULL DEFAULT 1 CHECK (required_level BETWEEN 1 AND 100),
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  issue_label text NOT NULL DEFAULT '',
  mentor_review boolean NOT NULL DEFAULT false,
  repository_path text NOT NULL DEFAULT '',
  slots integer NOT NULL DEFAULT 1 CHECK (slots > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','review','done','cancelled')),
  claimed_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.project_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.project_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  version text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version)
);

CREATE TABLE app.project_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE app.git_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'github' CHECK (provider IN ('github')),
  provider_username text NOT NULL,
  provider_subject text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('disconnected','connected','expired')),
  connected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (account_id, provider)
);

CREATE TABLE app.git_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES app.git_connections(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'github' CHECK (provider IN ('github')),
  provider_repository_id text,
  full_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  default_branch text NOT NULL DEFAULT 'main',
  stars integer NOT NULL DEFAULT 0,
  forks integer NOT NULL DEFAULT 0,
  open_issues integer NOT NULL DEFAULT 0,
  branches jsonb NOT NULL DEFAULT '[]'::jsonb,
  readme text NOT NULL DEFAULT '',
  last_synced_at timestamptz,
  UNIQUE (provider, full_name)
);

CREATE TABLE app.git_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES app.git_repositories(id) ON DELETE CASCADE,
  project_task_id uuid REFERENCES app.project_tasks(id) ON DELETE SET NULL,
  provider_issue_id text,
  issue_number integer NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','closed')),
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  assignee_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repository_id, issue_number)
);

CREATE TABLE app.git_pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES app.git_repositories(id) ON DELETE CASCADE,
  project_task_id uuid REFERENCES app.project_tasks(id) ON DELETE SET NULL,
  provider_pull_request_id text,
  pull_request_number integer NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  branch text NOT NULL,
  base_branch text NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','open','checks','ready','merged','closed')),
  review_status text NOT NULL DEFAULT 'waiting' CHECK (review_status IN ('waiting','approved','changes-requested')),
  additions integer NOT NULL DEFAULT 0,
  deletions integer NOT NULL DEFAULT 0,
  changed_files integer NOT NULL DEFAULT 0,
  xp_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  merged_at timestamptz,
  UNIQUE (repository_id, pull_request_number)
);

CREATE TABLE app.git_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pull_request_id uuid NOT NULL REFERENCES app.git_pull_requests(id) ON DELETE CASCADE,
  name text NOT NULL,
  conclusion text NOT NULL DEFAULT 'pending' CHECK (conclusion IN ('pending','success','failure')),
  duration_ms integer,
  details_url text,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE app.git_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES app.git_repositories(id) ON DELETE CASCADE,
  pull_request_id uuid REFERENCES app.git_pull_requests(id) ON DELETE SET NULL,
  sha text NOT NULL,
  message text NOT NULL,
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  branch text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  committed_at timestamptz NOT NULL,
  UNIQUE (repository_id, sha)
);

CREATE TABLE app.git_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES app.git_repositories(id) ON DELETE CASCADE,
  action text NOT NULL,
  result text NOT NULL CHECK (result IN ('success','warning')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_status_updated ON app.projects(status, updated_at DESC);
CREATE INDEX idx_project_tasks_project_status ON app.project_tasks(project_id, status);
CREATE INDEX idx_project_members_account ON app.project_members(account_id, status);
CREATE INDEX idx_git_pr_repo_state ON app.git_pull_requests(repository_id, state);
CREATE INDEX idx_git_issues_repo_state ON app.git_issues(repository_id, state);

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0002_projects_git', 'step17-0002')
ON CONFLICT (version) DO NOTHING;

COMMIT;
