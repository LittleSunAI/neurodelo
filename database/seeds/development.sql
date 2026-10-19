BEGIN;

INSERT INTO app.accounts(id, email, status, email_verified_at, created_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'demo@neurodelo.local', 'active', now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'mentor@neurodelo.local', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.user_profiles(
  account_id, public_slug, display_name, nickname, bio, country, timezone,
  primary_language, experience_level, primary_role, general_level,
  profile_xp, reputation, reliability, review_score, merged_contributions,
  community_points, created_at, updated_at
) VALUES
  ('00000000-0000-4000-8000-000000000001', 'tbv', 'Тестовый участник', 'tbv',
   'Развиваюсь в open-source проектах и помогаю с интерфейсами.', 'Россия', 'Europe/Moscow',
   'ru', 'middle', 'contributor', 12, 1840, 84, 91, 93.50, 8, 320, now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'mentor-alex', 'Алексей Наставник', 'alex',
   'Помогаю новичкам проходить ревью и улучшать архитектуру.', 'Казахстан', 'Asia/Almaty',
   'ru', 'senior', 'mentor', 24, 4920, 96, 97, 98.20, 31, 940, now(), now())
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO app.user_preferences(account_id, profile_visibility, message_permission, invite_permission, notification_settings)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'public', 'community', 'community', '{"messages":true,"projectInvites":true,"forumReplies":true}'),
  ('00000000-0000-4000-8000-000000000002', 'public', 'everyone', 'community', '{"messages":true,"projectInvites":true,"forumReplies":true}')
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO app.user_roles(account_id, role_id) VALUES
  ('00000000-0000-4000-8000-000000000001', 'contributor'),
  ('00000000-0000-4000-8000-000000000002', 'mentor'),
  ('00000000-0000-4000-8000-000000000002', 'maintainer')
ON CONFLICT DO NOTHING;

INSERT INTO app.user_skills(account_id, profession_id, level, progress, confirmed, source) VALUES
  ('00000000-0000-4000-8000-000000000001', 'frontend', 7, 68, true, 'project'),
  ('00000000-0000-4000-8000-000000000001', 'backend', 4, 25, true, 'test'),
  ('00000000-0000-4000-8000-000000000001', 'ai', 5, 42, true, 'project'),
  ('00000000-0000-4000-8000-000000000002', 'backend', 9, 83, true, 'mentor'),
  ('00000000-0000-4000-8000-000000000002', 'management', 8, 55, true, 'mentor')
ON CONFLICT DO NOTHING;

INSERT INTO app.hero_profiles(
  account_id, class_id, hero_level, hero_xp, xp_to_next, vitality, power,
  defense, speed, focus, battle_rating, title, skill_points
) VALUES
  ('00000000-0000-4000-8000-000000000001', 'technomancer', 9, 620, 900, 7, 10, 6, 8, 11, 580, 'Проводник кода', 2),
  ('00000000-0000-4000-8000-000000000002', 'architect', 18, 2110, 2400, 12, 10, 13, 8, 16, 1030, 'Архитектор сообщества', 4)
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO app.projects(
  id, slug, owner_account_id, title, tagline, summary, description,
  license, stage, status, progress, repository_url, default_branch,
  stack, needs, tags, beginner_friendly, readme, contribution_guide,
  code_of_conduct, xp_policy, published_at
) VALUES (
  '10000000-0000-4000-8000-000000000001', 'neurodelo-platform',
  '00000000-0000-4000-8000-000000000002', 'NeuroDelo Platform',
  'Платформа для open-source сотрудничества и развития навыков',
  'Помогаем людям находить открытые проекты, делать вклад и развивать подтверждённое портфолио.',
  'Демонстрационный проект для проверки будущей базы и API-контрактов.',
  'MIT', 'MVP', 'published', 64, 'https://github.com/example/neurodelo-platform', 'main',
  '["Next.js","TypeScript","PostgreSQL"]', '["Frontend","QA","Документация"]',
  '["open-source","community","ai"]', true,
  '# NeuroDelo Platform', 'Перед началом прочитайте CONTRIBUTING.md.',
  'Уважайте других участников.',
  '{"requiresAcceptedResult":true,"requiresMergeForCode":true,"reviewXp":40,"documentationXp":30,"beginnerMultiplier":1.2,"maxTaskXp":500}',
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.project_members(project_id, account_id, member_role, status) VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'owner', 'active'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'contributor', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO app.project_tasks(
  id, project_id, title, summary, category, contribution_kind, difficulty,
  reward_xp, estimated_minutes, required_level, skills, issue_label,
  mentor_review, repository_path, slots, status, claimed_by_account_id, claimed_at
) VALUES (
  '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
  'Добавить пустые состояния профиля', 'Создать доступные пустые состояния для портфолио и благодарностей.',
  'Интерфейс', 'Код', 'Начальная', 120, 180, 3, '["React","Accessibility"]',
  'good first issue', true, 'components/profile', 1, 'claimed',
  '00000000-0000-4000-8000-000000000001', now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.git_repositories(
  id, project_id, provider, full_name, description, visibility, default_branch,
  stars, forks, open_issues, branches, readme, last_synced_at
) VALUES (
  '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
  'github', 'example/neurodelo-platform', 'Демонстрационный репозиторий', 'public', 'main',
  42, 7, 3, '["main","develop"]', '# NeuroDelo Platform', now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.git_issues(
  id, repository_id, project_task_id, issue_number, title, summary, state, labels, assignee_account_id
) VALUES (
  '31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001', 17, 'Добавить пустые состояния профиля',
  'Связано с задачей платформы.', 'open', '["good first issue","frontend"]',
  '00000000-0000-4000-8000-000000000001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.contributions(
  id, project_id, task_id, contributor_account_id, title, summary, kind, status,
  skill_xp, hero_xp, community_points, submitted_at, accepted_at, reviewed_by_account_id, review_note
) VALUES (
  '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
  NULL, '00000000-0000-4000-8000-000000000001', 'Улучшение мобильной навигации',
  'Добавлена нижняя навигация и safe-area для телефонов.', 'Код', 'accepted',
  180, 70, 15, now() - interval '4 days', now() - interval '3 days',
  '00000000-0000-4000-8000-000000000002', 'Изменения приняты после ревью.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.recognition_records(
  id, contribution_id, project_id, contributor_account_id, title, summary,
  contribution_kind, verified, official_thanks_count
) VALUES (
  '41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
  'Мобильная навигация', 'Подтверждённый вклад в доступность интерфейса.', 'Код', true, 1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO app.xp_transactions(
  id, account_id, project_id, contribution_id, profession_id, kind, status,
  skill_xp, hero_xp, community_points, reason, created_by_account_id
) VALUES (
  '42000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
  'frontend', 'contribution', 'confirmed', 180, 70, 15,
  'Принятый вклад в мобильную навигацию', '00000000-0000-4000-8000-000000000002'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
