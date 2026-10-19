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
