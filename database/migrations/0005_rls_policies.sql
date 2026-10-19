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
