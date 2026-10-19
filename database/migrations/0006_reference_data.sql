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
