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
