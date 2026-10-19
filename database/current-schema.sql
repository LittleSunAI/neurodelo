BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now(),
  checksum text NOT NULL
);

CREATE TABLE app.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text,
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('active','unverified','blocked')),
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE app.auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('password','github','google','discord')),
  provider_subject text NOT NULL,
  provider_email citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE TABLE app.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  remembered boolean NOT NULL DEFAULT false,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.security_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  browser text NOT NULL,
  location_label text NOT NULL DEFAULT 'Неизвестно',
  fingerprint_hash text,
  current_device boolean NOT NULL DEFAULT false,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  email_attempt citext,
  device_label text NOT NULL,
  location_label text NOT NULL,
  result text NOT NULL CHECK (result IN ('success','failed')),
  reason text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.user_profiles (
  account_id uuid PRIMARY KEY REFERENCES app.accounts(id) ON DELETE CASCADE,
  public_slug citext NOT NULL UNIQUE,
  display_name text NOT NULL,
  nickname text NOT NULL,
  bio text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'UTC',
  primary_language text NOT NULL DEFAULT 'ru' CHECK (primary_language IN ('ru','en')),
  experience_level text NOT NULL DEFAULT 'starter' CHECK (experience_level IN ('starter','junior','middle','senior')),
  primary_role text NOT NULL DEFAULT 'contributor' CHECK (primary_role IN ('contributor','maintainer','mentor')),
  website_url text,
  github_url text,
  telegram_url text,
  available_for_contribution boolean NOT NULL DEFAULT true,
  general_level integer NOT NULL DEFAULT 1 CHECK (general_level >= 1),
  profile_xp integer NOT NULL DEFAULT 0 CHECK (profile_xp >= 0),
  reputation integer NOT NULL DEFAULT 0 CHECK (reputation BETWEEN 0 AND 100),
  reliability integer NOT NULL DEFAULT 0 CHECK (reliability BETWEEN 0 AND 100),
  review_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (review_score BETWEEN 0 AND 100),
  merged_contributions integer NOT NULL DEFAULT 0 CHECK (merged_contributions >= 0),
  mentor_endorsements integer NOT NULL DEFAULT 0 CHECK (mentor_endorsements >= 0),
  gratitude_received integer NOT NULL DEFAULT 0 CHECK (gratitude_received >= 0),
  community_points integer NOT NULL DEFAULT 0 CHECK (community_points >= 0),
  public_thanks_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.user_roles (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  role_id text NOT NULL CHECK (role_id IN ('contributor','maintainer','mentor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, role_id)
);

CREATE TABLE app.user_goals (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  goal text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, goal)
);

CREATE TABLE app.user_interests (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  interest text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, interest)
);

CREATE TABLE app.user_languages (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  proficiency text NOT NULL DEFAULT 'working' CHECK (proficiency IN ('basic','working','fluent','native')),
  PRIMARY KEY (account_id, language_code)
);

CREATE TABLE app.professions (
  id text PRIMARY KEY CHECK (id IN ('frontend','backend','database','design','qa','ai','management')),
  label text NOT NULL,
  description text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE app.user_skills (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  profession_id text NOT NULL REFERENCES app.professions(id),
  level integer NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  confirmed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'self' CHECK (source IN ('self','test','mentor','project')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, profession_id)
);

CREATE TABLE app.user_preferences (
  account_id uuid PRIMARY KEY REFERENCES app.accounts(id) ON DELETE CASCADE,
  profile_visibility text NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public','community','private')),
  message_permission text NOT NULL DEFAULT 'community' CHECK (message_permission IN ('everyone','community','nobody')),
  invite_permission text NOT NULL DEFAULT 'community' CHECK (invite_permission IN ('everyone','community','nobody')),
  show_thanks boolean NOT NULL DEFAULT true,
  show_activity boolean NOT NULL DEFAULT true,
  show_battle_history boolean NOT NULL DEFAULT true,
  searchable boolean NOT NULL DEFAULT true,
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system')),
  text_scale text NOT NULL DEFAULT 'normal' CHECK (text_scale IN ('compact','normal','large')),
  reduce_motion boolean NOT NULL DEFAULT false,
  high_contrast boolean NOT NULL DEFAULT false,
  interface_language text NOT NULL DEFAULT 'ru' CHECK (interface_language IN ('ru','en')),
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.blocked_users (
  blocker_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  blocked_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_account_id, blocked_account_id),
  CHECK (blocker_account_id <> blocked_account_id)
);

CREATE INDEX idx_auth_sessions_account ON app.auth_sessions(account_id, expires_at);
CREATE INDEX idx_login_events_account_created ON app.login_events(account_id, created_at DESC);
CREATE INDEX idx_user_profiles_searchable ON app.user_profiles(public_slug);

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0001_core_identity', 'step17-0001')
ON CONFLICT (version) DO NOTHING;

COMMIT;
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
BEGIN;

CREATE TABLE app.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES app.project_tasks(id) ON DELETE SET NULL,
  pull_request_id uuid REFERENCES app.git_pull_requests(id) ON DELETE SET NULL,
  contributor_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE RESTRICT,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  kind text NOT NULL CHECK (kind IN ('Код','Документация','Дизайн','Тестирование','Исследование')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','review','accepted','rejected','revoked')),
  skill_xp integer NOT NULL DEFAULT 0 CHECK (skill_xp >= 0),
  hero_xp integer NOT NULL DEFAULT 0 CHECK (hero_xp >= 0),
  community_points integer NOT NULL DEFAULT 0 CHECK (community_points >= 0),
  submitted_at timestamptz,
  accepted_at timestamptz,
  reviewed_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.recognition_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL UNIQUE REFERENCES app.contributions(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  contributor_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE RESTRICT,
  title text NOT NULL,
  summary text NOT NULL,
  contribution_kind text NOT NULL,
  verified boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'clear' CHECK (moderation_status IN ('clear','review','revoked')),
  official_thanks_count integer NOT NULL DEFAULT 0 CHECK (official_thanks_count >= 0),
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recognition_id uuid NOT NULL REFERENCES app.recognition_records(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('quality','initiative','mentorship','rescue','documentation','kindness')),
  message text NOT NULL DEFAULT '',
  community_points integer NOT NULL DEFAULT 0 CHECK (community_points >= 0),
  official_project_thanks boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recognition_id, from_account_id, category),
  CHECK (from_account_id <> to_account_id)
);

CREATE TABLE app.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES app.projects(id) ON DELETE SET NULL,
  contribution_id uuid REFERENCES app.contributions(id) ON DELETE SET NULL,
  profession_id text REFERENCES app.professions(id),
  kind text NOT NULL CHECK (kind IN ('contribution','review','documentation','mentorship','manual-adjustment','reversal')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','pending','reversed')),
  skill_xp integer NOT NULL DEFAULT 0,
  hero_xp integer NOT NULL DEFAULT 0,
  community_points integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  reversal_of_id uuid REFERENCES app.xp_transactions(id) ON DELETE RESTRICT,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (skill_xp <> 0 OR hero_xp <> 0 OR community_points <> 0)
);

CREATE UNIQUE INDEX idx_xp_single_reversal ON app.xp_transactions(reversal_of_id) WHERE reversal_of_id IS NOT NULL;

CREATE TABLE app.release_credits (
  release_id uuid NOT NULL REFERENCES app.project_releases(id) ON DELETE CASCADE,
  contribution_id uuid NOT NULL REFERENCES app.contributions(id) ON DELETE CASCADE,
  contributor_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE RESTRICT,
  credit_label text NOT NULL DEFAULT 'Contributor',
  PRIMARY KEY (release_id, contribution_id, contributor_account_id)
);

CREATE TABLE app.recognition_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('created','official-thanks','reported','xp-reversed','restored')),
  target_type text NOT NULL CHECK (target_type IN ('recognition','kudos','xp-transaction','contribution')),
  target_id uuid NOT NULL,
  actor_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.support_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('github-sponsors','open-collective','boosty','donation-alerts','custom')),
  label text NOT NULL,
  url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.hero_profiles (
  account_id uuid PRIMARY KEY REFERENCES app.accounts(id) ON DELETE CASCADE,
  class_id text NOT NULL DEFAULT 'guardian' CHECK (class_id IN ('guardian','technomancer','pathfinder','architect')),
  hero_level integer NOT NULL DEFAULT 1 CHECK (hero_level >= 1),
  hero_xp integer NOT NULL DEFAULT 0 CHECK (hero_xp >= 0),
  xp_to_next integer NOT NULL DEFAULT 100 CHECK (xp_to_next > 0),
  unspent_stat_points integer NOT NULL DEFAULT 0 CHECK (unspent_stat_points >= 0),
  skill_points integer NOT NULL DEFAULT 0 CHECK (skill_points >= 0),
  vitality integer NOT NULL DEFAULT 5 CHECK (vitality >= 1),
  power integer NOT NULL DEFAULT 5 CHECK (power >= 1),
  defense integer NOT NULL DEFAULT 5 CHECK (defense >= 1),
  speed integer NOT NULL DEFAULT 5 CHECK (speed >= 1),
  focus integer NOT NULL DEFAULT 5 CHECK (focus >= 1),
  battle_rating integer NOT NULL DEFAULT 100 CHECK (battle_rating >= 0),
  title text NOT NULL DEFAULT 'Новичок',
  arena_enabled boolean NOT NULL DEFAULT true,
  model_version text NOT NULL DEFAULT 'advanced-foundation-v2',
  active_image_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.hero_image_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  source text NOT NULL CHECK (source IN ('composite','upload','fallback','fal')),
  status text NOT NULL CHECK (status IN ('queued','generating','ready','failed','cancelled')),
  image_url text NOT NULL,
  thumbnail_url text,
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  file_size bigint NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  mime_type text NOT NULL,
  prompt text,
  negative_prompt text,
  model_id text,
  preset text CHECK (preset IN ('cinematic','anime','pixel','illustration','realistic')),
  mood text CHECK (mood IN ('calm','focused','triumphant','mysterious')),
  background text CHECK (background IN ('workshop','space','forest','city','abstract')),
  original_file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app.hero_profiles
  ADD CONSTRAINT fk_hero_active_image
  FOREIGN KEY (active_image_id) REFERENCES app.hero_image_variants(id) ON DELETE SET NULL;

CREATE TABLE app.hero_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('fallback','fal')),
  status text NOT NULL CHECK (status IN ('queued','generating','ready','failed','cancelled')),
  prompt text NOT NULL,
  negative_prompt text,
  model_id text,
  provider_request_id text,
  result_variant_id uuid REFERENCES app.hero_image_variants(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE app.game_items (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  slot text NOT NULL CHECK (slot IN ('weapon','armor','charm','companion')),
  rarity text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  required_level integer NOT NULL DEFAULT 1 CHECK (required_level >= 1),
  rating_bonus integer NOT NULL DEFAULT 0,
  stat_bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  icon text NOT NULL DEFAULT 'item',
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE app.hero_owned_items (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES app.game_items(id),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'challenge',
  PRIMARY KEY (account_id, item_id)
);

CREATE TABLE app.hero_equipment (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('weapon','armor','charm','companion')),
  item_id text NOT NULL REFERENCES app.game_items(id),
  equipped_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, slot)
);

CREATE TABLE app.game_skill_nodes (
  id text PRIMARY KEY,
  class_id text NOT NULL CHECK (class_id IN ('all','guardian','technomancer','pathfinder','architect')),
  title text NOT NULL,
  description text NOT NULL,
  cost integer NOT NULL CHECK (cost > 0),
  requires_node_id text REFERENCES app.game_skill_nodes(id),
  rating_bonus integer NOT NULL DEFAULT 0,
  stat_bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE app.hero_unlocked_skills (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  skill_node_id text NOT NULL REFERENCES app.game_skill_nodes(id),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, skill_node_id)
);

CREATE TABLE app.game_seasons (
  id text PRIMARY KEY,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('planned','active','finished')),
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (ends_at > starts_at)
);

CREATE TABLE app.hero_season_progress (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  season_id text NOT NULL REFERENCES app.game_seasons(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'Новичок' CHECK (tier IN ('Новичок','Бронза','Серебро','Золото','Платина')),
  rank integer,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  season_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, season_id)
);

CREATE TABLE app.game_challenges (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  period text NOT NULL CHECK (period IN ('daily','weekly','season')),
  target integer NOT NULL CHECK (target > 0),
  reward_hero_xp integer NOT NULL DEFAULT 0,
  reward_community_points integer NOT NULL DEFAULT 0,
  reward_item_id text REFERENCES app.game_items(id),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CHECK (expires_at > starts_at)
);

CREATE TABLE app.user_challenge_progress (
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  challenge_id text NOT NULL REFERENCES app.game_challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0),
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, challenge_id)
);

CREATE TABLE app.battle_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  season_id text REFERENCES app.game_seasons(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('training','ranked','team')),
  opponent_name text NOT NULL,
  opponent_class text NOT NULL CHECK (opponent_class IN ('guardian','technomancer','pathfinder','architect')),
  result text NOT NULL CHECK (result IN ('win','loss','draw')),
  your_rating integer NOT NULL,
  opponent_rating integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  season_points integer NOT NULL DEFAULT 0,
  summary text NOT NULL,
  action_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  engine_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.team_battle_members (
  battle_id uuid NOT NULL REFERENCES app.battle_results(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('ally','opponent')),
  position integer NOT NULL,
  account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  class_id text NOT NULL CHECK (class_id IN ('guardian','technomancer','pathfinder','architect')),
  rating integer NOT NULL,
  PRIMARY KEY (battle_id, side, position)
);

CREATE INDEX idx_contributions_project_status ON app.contributions(project_id, status, created_at DESC);
CREATE INDEX idx_contributions_account ON app.contributions(contributor_account_id, accepted_at DESC);
CREATE INDEX idx_xp_transactions_account ON app.xp_transactions(account_id, created_at DESC);
CREATE INDEX idx_kudos_recognition ON app.kudos(recognition_id, created_at DESC);
CREATE INDEX idx_battle_results_account ON app.battle_results(account_id, created_at DESC);

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0003_contributions_recognition_game', 'step17-0003')
ON CONFLICT (version) DO NOTHING;

COMMIT;
BEGIN;

CREATE TABLE app.forum_categories (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'message-square',
  color text NOT NULL DEFAULT 'cyan' CHECK (color IN ('cyan','violet','amber','green')),
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE app.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL REFERENCES app.forum_categories(id),
  project_id uuid REFERENCES app.projects(id) ON DELETE CASCADE,
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','solved','locked')),
  pinned boolean NOT NULL DEFAULT false,
  hot boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  solved_post_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES app.forum_threads(id) ON DELETE CASCADE,
  author_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  body text NOT NULL,
  quote_post_id uuid REFERENCES app.forum_posts(id) ON DELETE SET NULL,
  accepted_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

ALTER TABLE app.forum_threads
  ADD CONSTRAINT fk_forum_solved_post
  FOREIGN KEY (solved_post_id) REFERENCES app.forum_posts(id) ON DELETE SET NULL;

CREATE TABLE app.forum_reactions (
  post_id uuid NOT NULL REFERENCES app.forum_posts(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like','helpful','insightful','thanks')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, account_id, reaction)
);

CREATE TABLE app.forum_bookmarks (
  thread_id uuid NOT NULL REFERENCES app.forum_threads(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, account_id)
);

CREATE TABLE app.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct','team','project','system')),
  title text NOT NULL,
  project_id uuid REFERENCES app.projects(id) ON DELETE CASCADE,
  created_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE app.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  muted boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  last_read_message_id uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (conversation_id, account_id)
);

CREATE TABLE app.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
  sender_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  body text NOT NULL,
  original_body text,
  source_language text NOT NULL DEFAULT 'ru' CHECK (source_language IN ('ru','en')),
  display_language text NOT NULL DEFAULT 'ru' CHECK (display_language IN ('ru','en')),
  translated boolean NOT NULL DEFAULT false,
  delivery_status text NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent','delivered','read')),
  reply_to_message_id uuid REFERENCES app.chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

ALTER TABLE app.conversation_participants
  ADD CONSTRAINT fk_participant_last_read_message
  FOREIGN KEY (last_read_message_id) REFERENCES app.chat_messages(id) ON DELETE SET NULL;

CREATE TABLE app.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES app.chat_messages(id) ON DELETE CASCADE,
  attachment_type text NOT NULL CHECK (attachment_type IN ('image','document','code')),
  file_name text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.message_reactions (
  message_id uuid NOT NULL REFERENCES app.chat_messages(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like','helpful','insightful','thanks')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, account_id, reaction)
);

CREATE TABLE app.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('thread','post','message','user')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE app.moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type text NOT NULL CHECK (case_type IN ('community-report','project-review','external-link','user-risk','recognition-dispute')),
  title text NOT NULL,
  summary text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('project','user','thread','message','link','contribution')),
  target_id uuid NOT NULL,
  subject_name text NOT NULL,
  reporter_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  reporter_name text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','reviewing','action-required','resolved','dismissed','appealed')),
  assigned_to_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.moderation_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.moderation_cases(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  source text NOT NULL CHECK (source IN ('user','system','git','community')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.moderation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.moderation_cases(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approve','dismiss','warn','restrict','suspend','remove-content','restore')),
  reason text NOT NULL,
  actor_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE app.moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.moderation_cases(id) ON DELETE CASCADE,
  submitted_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  submitted_by_name text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','upheld','overturned','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  reviewer_name text,
  resolution text
);

CREATE TABLE app.external_link_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  owner_name text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('telegram','discord','github','support','other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  reviewer_name text,
  note text
);

CREATE TABLE app.feature_flags (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','admins','testers')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  updated_by_name text NOT NULL
);

CREATE TABLE app.moderation_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_id text NOT NULL,
  actor_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  details text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.user_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('warn','restrict','suspend')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by_account_id uuid REFERENCES app.accounts(id) ON DELETE SET NULL
);

CREATE TABLE app.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forum_threads_category_updated ON app.forum_threads(category_id, updated_at DESC);
CREATE INDEX idx_forum_posts_thread_created ON app.forum_posts(thread_id, created_at);
CREATE INDEX idx_conversations_updated ON app.conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_created ON app.chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_reports_status_created ON app.community_reports(status, created_at DESC);
CREATE INDEX idx_moderation_cases_status_priority ON app.moderation_cases(status, priority, created_at DESC);
CREATE INDEX idx_notifications_account_unread ON app.notifications(account_id, created_at DESC) WHERE read_at IS NULL;

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0004_community_moderation_notifications', 'step17-0004')
ON CONFLICT (version) DO NOTHING;

COMMIT;
BEGIN;

CREATE OR REPLACE FUNCTION app.current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_account_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_project_member(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.project_members pm
    WHERE pm.project_id = target_project_id
      AND pm.account_id = app.current_account_id()
      AND pm.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION app.is_project_maintainer(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.project_members pm
    WHERE pm.project_id = target_project_id
      AND pm.account_id = app.current_account_id()
      AND pm.status = 'active'
      AND pm.member_role IN ('owner','maintainer','reviewer')
  )
$$;

ALTER TABLE app.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.security_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.hero_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.hero_image_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_self_select ON app.accounts
  FOR SELECT USING (id = app.current_account_id());
CREATE POLICY accounts_self_update ON app.accounts
  FOR UPDATE USING (id = app.current_account_id())
  WITH CHECK (id = app.current_account_id());

CREATE POLICY profiles_public_select ON app.user_profiles
  FOR SELECT USING (
    account_id = app.current_account_id()
    OR EXISTS (
      SELECT 1 FROM app.user_preferences up
      WHERE up.account_id = user_profiles.account_id
        AND up.profile_visibility = 'public'
    )
  );
CREATE POLICY profiles_self_update ON app.user_profiles
  FOR UPDATE USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());

CREATE POLICY preferences_self_all ON app.user_preferences
  FOR ALL USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());
CREATE POLICY devices_self_all ON app.security_devices
  FOR ALL USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());
CREATE POLICY login_events_self_select ON app.login_events
  FOR SELECT USING (account_id = app.current_account_id());

CREATE POLICY projects_public_select ON app.projects
  FOR SELECT USING (status = 'published' OR owner_account_id = app.current_account_id() OR app.is_project_member(id));
CREATE POLICY projects_owner_insert ON app.projects
  FOR INSERT WITH CHECK (owner_account_id = app.current_account_id());
CREATE POLICY projects_maintainer_update ON app.projects
  FOR UPDATE USING (owner_account_id = app.current_account_id() OR app.is_project_maintainer(id));

CREATE POLICY project_members_visible ON app.project_members
  FOR SELECT USING (app.is_project_member(project_id) OR EXISTS (SELECT 1 FROM app.projects p WHERE p.id = project_id AND p.status = 'published'));
CREATE POLICY project_members_maintainer_write ON app.project_members
  FOR ALL USING (app.is_project_maintainer(project_id))
  WITH CHECK (app.is_project_maintainer(project_id));

CREATE POLICY project_tasks_public_select ON app.project_tasks
  FOR SELECT USING (EXISTS (SELECT 1 FROM app.projects p WHERE p.id = project_id AND (p.status = 'published' OR app.is_project_member(p.id))));
CREATE POLICY project_tasks_maintainer_write ON app.project_tasks
  FOR ALL USING (app.is_project_maintainer(project_id))
  WITH CHECK (app.is_project_maintainer(project_id));

CREATE POLICY contributions_visible ON app.contributions
  FOR SELECT USING (
    contributor_account_id = app.current_account_id()
    OR app.is_project_member(project_id)
    OR status = 'accepted'
  );
CREATE POLICY contributions_self_insert ON app.contributions
  FOR INSERT WITH CHECK (contributor_account_id = app.current_account_id());
CREATE POLICY contributions_owner_update ON app.contributions
  FOR UPDATE USING (contributor_account_id = app.current_account_id() OR app.is_project_maintainer(project_id));

CREATE POLICY xp_self_select ON app.xp_transactions
  FOR SELECT USING (account_id = app.current_account_id());

CREATE POLICY hero_self_all ON app.hero_profiles
  FOR ALL USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());
CREATE POLICY hero_images_self_all ON app.hero_image_variants
  FOR ALL USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());

CREATE POLICY conversations_member_select ON app.conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM app.conversation_participants cp
    WHERE cp.conversation_id = id AND cp.account_id = app.current_account_id() AND cp.left_at IS NULL
  ));
CREATE POLICY conversation_participants_member_select ON app.conversation_participants
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM app.conversation_participants mine
    WHERE mine.conversation_id = conversation_id AND mine.account_id = app.current_account_id() AND mine.left_at IS NULL
  ));
CREATE POLICY messages_member_select ON app.chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM app.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.account_id = app.current_account_id() AND cp.left_at IS NULL
  ));
CREATE POLICY messages_member_insert ON app.chat_messages
  FOR INSERT WITH CHECK (
    sender_account_id = app.current_account_id()
    AND EXISTS (
      SELECT 1 FROM app.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.account_id = app.current_account_id() AND cp.left_at IS NULL
    )
  );

CREATE POLICY notifications_self_all ON app.notifications
  FOR ALL USING (account_id = app.current_account_id())
  WITH CHECK (account_id = app.current_account_id());

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0005_rls_policies', 'step17-0005')
ON CONFLICT (version) DO NOTHING;

COMMIT;
BEGIN;

INSERT INTO app.professions(id, label, description) VALUES
  ('frontend', 'Frontend', 'Пользовательские интерфейсы и клиентская логика'),
  ('backend', 'Backend', 'API, серверная логика и интеграции'),
  ('database', 'Базы данных', 'Моделирование, SQL, миграции и производительность'),
  ('design', 'Дизайн', 'Продуктовый, визуальный и UX-дизайн'),
  ('qa', 'Тестирование', 'Ручное и автоматизированное тестирование'),
  ('ai', 'Нейросети', 'Интеграции моделей, промпты и AI-функции'),
  ('management', 'Управление', 'Координация open-source проектов и команд')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

INSERT INTO app.forum_categories(id, title, description, icon, color, position) VALUES
  ('general', 'Общее', 'Обсуждение платформы и сообщества', 'messages-square', 'cyan', 10),
  ('projects', 'Open-source проекты', 'Поиск проектов, участников и помощь', 'folder-git-2', 'violet', 20),
  ('development', 'Разработка', 'Код, архитектура, базы данных и DevOps', 'code-2', 'green', 30),
  ('design', 'Дизайн', 'Интерфейсы, UX и визуальные материалы', 'palette', 'amber', 40),
  ('learning', 'Обучение', 'Задания, наставники и разборы', 'graduation-cap', 'cyan', 50)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO app.game_items(id, title, description, slot, rarity, required_level, rating_bonus, stat_bonuses, icon) VALUES
  ('starter-terminal', 'Терминал новичка', 'Базовый инструмент для первых испытаний', 'weapon', 'common', 1, 5, '{"focus":1}', 'terminal'),
  ('review-shield', 'Щит ревьюера', 'Награда за качественные проверки вкладов', 'armor', 'rare', 3, 12, '{"defense":2}', 'shield-check'),
  ('mentor-charm', 'Знак наставника', 'Усиливает фокус и поддержку команды', 'charm', 'epic', 5, 20, '{"focus":2,"vitality":1}', 'sparkles'),
  ('pixel-companion', 'Пиксельный спутник', 'Редкий спутник open-source сообщества', 'companion', 'legendary', 8, 30, '{"speed":2,"power":1}', 'bot')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.game_skill_nodes(id, class_id, title, description, cost, requires_node_id, rating_bonus, stat_bonuses) VALUES
  ('core-focus', 'all', 'Сосредоточенность', 'Базовое усиление фокуса', 1, NULL, 5, '{"focus":1}'),
  ('guardian-wall', 'guardian', 'Защитная стена', 'Усиление защиты Стража', 1, 'core-focus', 8, '{"defense":2}'),
  ('technomancer-flow', 'technomancer', 'Поток данных', 'Усиление силы и фокуса Техноманта', 1, 'core-focus', 8, '{"power":1,"focus":1}'),
  ('pathfinder-step', 'pathfinder', 'Быстрый шаг', 'Усиление скорости Следопыта', 1, 'core-focus', 8, '{"speed":2}'),
  ('architect-plan', 'architect', 'Точный план', 'Усиление живучести и фокуса Архитектора', 1, 'core-focus', 8, '{"vitality":1,"focus":1}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.feature_flags(id, label, description, enabled, audience, updated_by_name) VALUES
  ('paid-requests', 'Платные запросы', 'Показывает необязательную доску платных запросов без гаранта платформы', true, 'all', 'System'),
  ('team-battles', 'Командные бои', 'Включает командный режим арены', true, 'all', 'System'),
  ('fal-hero-images', 'fal.ai для героя', 'Разрешает серверную генерацию изображений через fal.ai', false, 'testers', 'System'),
  ('git-live-sync', 'Живая Git-синхронизация', 'Включает настоящий GitProvider вместо fallback', false, 'testers', 'System')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.schema_migrations(version, checksum)
VALUES ('0006_reference_data', 'step17-0006')
ON CONFLICT (version) DO NOTHING;

COMMIT;
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
