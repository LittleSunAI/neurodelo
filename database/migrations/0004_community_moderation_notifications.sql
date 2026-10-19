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
